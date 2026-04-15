"""
CRACKWATCH Backend — FastAPI server for infrastructure damage detection.
"""

import os
import uuid
import time
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inference import get_detector
from severity import compute_severity, compute_overall_stats
from cost_engine import estimate_cost, rank_priorities, generate_repair_plan, explain_severity

app = FastAPI(
    title="CRACKWATCH API",
    description="AI-powered infrastructure damage detection system",
    version="1.0.0",
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for detections (hackathon — no DB needed)
detection_store: list[dict] = []
alert_store: list[dict] = []

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.on_event("startup")
async def startup():
    """Pre-load model on startup so first request is fast."""
    print("[CRACKWATCH] Starting up...")
    get_detector()
    print("[CRACKWATCH] Ready.")


@app.get("/")
async def root():
    return {"status": "online", "service": "CRACKWATCH API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/detect")
async def detect_damage(
    file: UploadFile = File(...),
    confidence: float = Form(default=0.25),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    location_name: Optional[str] = Form(default=None),
):
    """
    Upload an image and detect infrastructure damage.

    Returns detections with bounding boxes, severity scores,
    and an annotated image.
    """
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (JPEG, PNG, etc.)")

    # Read image bytes
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(400, "Empty file")

    # Run detection
    start_time = time.time()
    detector = get_detector()
    result = detector.detect_from_bytes(image_bytes, confidence)
    inference_time = round((time.time() - start_time) * 1000, 1)  # ms

    # Compute severity scores
    scored_detections = compute_severity(
        result["detections"],
        result["image_width"],
        result["image_height"],
    )

    # Compute overall stats
    stats = compute_overall_stats(scored_detections)

    # Rank priorities + cost estimation
    ranked_detections = rank_priorities(scored_detections)

    # Add explainability to each detection
    for det in ranked_detections:
        det["explanation"] = explain_severity(det)

    # Build detection record
    detection_id = str(uuid.uuid4())[:8]
    record = {
        "id": detection_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "filename": file.filename,
        "image_width": result["image_width"],
        "image_height": result["image_height"],
        "detections": ranked_detections,
        "annotated_image": result["annotated_image"],
        "stats": stats,
        "inference_time_ms": inference_time,
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "name": location_name,
        },
    }

    # Store in memory
    detection_store.append(record)

    # Generate alerts for critical detections
    for det in ranked_detections:
        if det["severity_label"] == "critical":
            alert = {
                "id": len(alert_store) + 1,
                "time": record["timestamp"],
                "type": "CRITICAL_DAMAGE",
                "severity": "critical",
                "message": f'{det["display_name"]} detected — severity {det["severity"]}% — {location_name or "Unknown location"}',
                "detection_id": detection_id,
                "class_name": det["class_name"],
            }
            alert_store.append(alert)
        elif det["severity_label"] == "warning":
            alert = {
                "id": len(alert_store) + 1,
                "time": record["timestamp"],
                "type": "DAMAGE_WARNING",
                "severity": "warning",
                "message": f'{det["display_name"]} detected — severity {det["severity"]}% — monitoring recommended',
                "detection_id": detection_id,
                "class_name": det["class_name"],
            }
            alert_store.append(alert)

    return JSONResponse(content={
        "id": detection_id,
        "detections": ranked_detections,
        "annotated_image": result["annotated_image"],
        "stats": stats,
        "inference_time_ms": inference_time,
        "location": record["location"],
    })


@app.get("/detections")
async def list_detections():
    """Get all past detection records (without annotated images to save bandwidth)."""
    records = []
    for r in detection_store:
        records.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "filename": r["filename"],
            "stats": r["stats"],
            "inference_time_ms": r["inference_time_ms"],
            "location": r["location"],
            "detection_count": len(r["detections"]),
        })
    return {"detections": list(reversed(records)), "total": len(records)}


@app.get("/detections/{detection_id}")
async def get_detection(detection_id: str):
    """Get a specific detection by ID (includes annotated image)."""
    for r in detection_store:
        if r["id"] == detection_id:
            return r
    raise HTTPException(404, "Detection not found")


@app.get("/stats")
async def get_aggregate_stats():
    """Get aggregate statistics across all detections."""
    all_detections = []
    for r in detection_store:
        all_detections.extend(r["detections"])

    stats = compute_overall_stats(all_detections)
    stats["total_scans"] = len(detection_store)
    stats["total_images"] = len(detection_store)

    # Location stats
    locations_with_damage = sum(
        1 for r in detection_store if r["stats"]["total_defects"] > 0
    )
    stats["locations_with_damage"] = locations_with_damage

    return stats


@app.get("/alerts")
async def get_alerts():
    """Get all alerts sorted by most recent."""
    return {"alerts": list(reversed(alert_store)), "total": len(alert_store)}


@app.post("/detect/batch")
async def detect_batch(
    files: list[UploadFile] = File(...),
    confidence: float = Form(default=0.25),
):
    """Process multiple images at once."""
    results = []
    detector = get_detector()

    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            results.append({"filename": file.filename, "error": "Not an image"})
            continue

        image_bytes = await file.read()
        start_time = time.time()
        result = detector.detect_from_bytes(image_bytes, confidence)
        inference_time = round((time.time() - start_time) * 1000, 1)

        scored = compute_severity(
            result["detections"],
            result["image_width"],
            result["image_height"],
        )
        stats = compute_overall_stats(scored)

        detection_id = str(uuid.uuid4())[:8]
        record = {
            "id": detection_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "filename": file.filename,
            "image_width": result["image_width"],
            "image_height": result["image_height"],
            "detections": scored,
            "annotated_image": result["annotated_image"],
            "stats": stats,
            "inference_time_ms": inference_time,
            "location": {"latitude": None, "longitude": None, "name": None},
        }
        detection_store.append(record)

        results.append({
            "id": detection_id,
            "filename": file.filename,
            "detection_count": len(scored),
            "stats": stats,
            "inference_time_ms": inference_time,
        })

    return {"results": results, "total_processed": len(results)}


@app.get("/repair-plan")
async def get_repair_plan():
    """
    Generate Today's Repair Plan — the 'What should I fix today?' feature.
    Aggregates all detections, ranks by priority, estimates costs.
    """
    all_detections = []
    for r in detection_store:
        for det in r["detections"]:
            det_copy = {**det}
            det_copy["source_scan"] = r["id"]
            det_copy["scan_time"] = r["timestamp"]
            loc = r.get("location", {})
            det_copy["location_name"] = loc.get("name") or r.get("filename", "Unknown")
            all_detections.append(det_copy)

    if not all_detections:
        return {
            "message": "No scans yet. Upload images to generate a repair plan.",
            "summary": None,
            "top_priorities": [],
        }

    plan = generate_repair_plan(all_detections, location="Survey Area")
    return plan


@app.get("/repair-plan/{detection_id}")
async def get_detection_repair_plan(detection_id: str):
    """Generate repair plan for a specific scan."""
    for r in detection_store:
        if r["id"] == detection_id:
            loc = r.get("location", {})
            location_name = loc.get("name") or r.get("filename", "Unknown")
            plan = generate_repair_plan(r["detections"], location=location_name)
            return plan
    raise HTTPException(404, "Detection not found")
