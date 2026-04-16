"""
CRACKWATCH Backend — FastAPI server for infrastructure damage detection.
"""

import os
import uuid
import time
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inference import get_detector, check_image_authenticity
from severity import compute_severity, compute_overall_stats
from cost_engine import estimate_cost, rank_priorities, generate_repair_plan, explain_severity
from auth import login, register_citizen, verify_token

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


# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@app.post("/auth/login")
async def auth_login(username: str = Form(...), password: str = Form(...)):
    """Government login with username + password."""
    result = login(username, password)
    if not result:
        raise HTTPException(401, "Invalid username or password")
    return result


@app.post("/auth/register")
async def auth_register(name: str = Form(...)):
    """Citizen registration — just a name, no password."""
    if not name.strip():
        raise HTTPException(400, "Name is required")
    return register_citizen(name.strip())


@app.get("/auth/me")
async def auth_me(request: Request):
    """Verify token and return user info."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    return {"username": payload["sub"], "role": payload["role"], "name": payload["name"]}


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

    # Run image authenticity check
    from PIL import Image as PILImage
    import io as _io
    try:
        pil_img = PILImage.open(_io.BytesIO(image_bytes)).convert("RGB")
        authenticity = check_image_authenticity(pil_img)
    except:
        authenticity = {"trust_score": 100, "is_likely_authentic": True, "flags": [], "recommendation": "Check skipped"}

    return JSONResponse(content={
        "id": detection_id,
        "detections": ranked_detections,
        "annotated_image": result["annotated_image"],
        "stats": stats,
        "inference_time_ms": inference_time,
        "location": record["location"],
        "authenticity": authenticity,
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


# ============================================================
# VIDEO PROCESSING
# ============================================================

@app.post("/detect/video")
async def detect_video(
    file: UploadFile = File(...),
    confidence: float = Form(default=0.25),
    frame_interval: int = Form(default=30),
):
    """
    Upload a video → extract frames at intervals → run AI on each frame.
    Returns per-frame detections and an aggregate summary.
    frame_interval: extract 1 frame every N frames (default 30 = ~1 per second at 30fps)
    """
    import tempfile
    import cv2 as _cv2
    import base64 as _b64
    from PIL import Image as _PILImage

    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video (MP4, AVI, etc.)")

    # Save to temp file (OpenCV needs file path)
    video_bytes = await file.read()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    tmp.write(video_bytes)
    tmp.close()

    try:
        cap = _cv2.VideoCapture(tmp.name)
        if not cap.isOpened():
            raise HTTPException(400, "Could not open video file")

        total_frames = int(cap.get(_cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(_cv2.CAP_PROP_FPS) or 30
        duration = total_frames / fps if fps > 0 else 0

        detector = get_detector()
        frame_results = []
        frame_num = 0
        all_detections = []

        start_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_num % frame_interval == 0:
                # Convert BGR to RGB
                rgb = _cv2.cvtColor(frame, _cv2.COLOR_BGR2RGB)
                pil_img = _PILImage.fromarray(rgb)

                result = detector.detect(pil_img, confidence)
                scored = compute_severity(result["detections"], result["image_width"], result["image_height"])
                ranked = rank_priorities(scored)

                timestamp_sec = round(frame_num / fps, 2)

                frame_results.append({
                    "frame_number": frame_num,
                    "timestamp_sec": timestamp_sec,
                    "timestamp_display": f"{int(timestamp_sec//60)}:{int(timestamp_sec%60):02d}",
                    "detections": ranked,
                    "detection_count": len(ranked),
                    "annotated_image": result["annotated_image"],
                })

                all_detections.extend(ranked)

            frame_num += 1

            # Safety limit — max 100 frames processed
            if len(frame_results) >= 100:
                break

        cap.release()
        total_time = round((time.time() - start_time) * 1000, 1)

        # Aggregate stats
        stats = compute_overall_stats(all_detections)

        return {
            "video_info": {
                "filename": file.filename,
                "total_frames": total_frames,
                "fps": round(fps, 1),
                "duration_sec": round(duration, 1),
                "frames_analyzed": len(frame_results),
                "frame_interval": frame_interval,
            },
            "frame_results": frame_results,
            "aggregate_stats": stats,
            "total_detections": len(all_detections),
            "processing_time_ms": total_time,
        }

    finally:
        os.unlink(tmp.name)


@app.post("/detect/frame")
async def detect_single_frame(
    frame_data: str = Form(...),
    confidence: float = Form(default=0.25),
):
    """
    Live feed: receive a single base64-encoded frame, return detections.
    Used by the frontend webcam/live camera feature.
    """
    import base64 as _b64
    from PIL import Image as _PILImage
    import io as _io

    try:
        # Strip data URL prefix if present
        if "," in frame_data:
            frame_data = frame_data.split(",")[1]

        img_bytes = _b64.b64decode(frame_data)
        pil_img = _PILImage.open(_io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Invalid frame data")

    start_time = time.time()
    detector = get_detector()
    result = detector.detect(pil_img, confidence)
    scored = compute_severity(result["detections"], result["image_width"], result["image_height"])
    ranked = rank_priorities(scored)
    inference_time = round((time.time() - start_time) * 1000, 1)

    return {
        "detections": ranked,
        "annotated_image": result["annotated_image"],
        "detection_count": len(ranked),
        "inference_time_ms": inference_time,
    }


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


# ============================================================
# PUBLIC CITIZEN APP ENDPOINTS
# ============================================================

# In-memory store for citizen reports
citizen_reports: list[dict] = []

@app.post("/public/report")
async def submit_citizen_report(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(default=""),
    reporter_name: Optional[str] = Form(default="Anonymous"),
    location_name: Optional[str] = Form(default=""),
):
    """
    PUBLIC: Citizens submit damage reports with photo + GPS location.
    Auto-runs AI detection on the uploaded image.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    image_bytes = await file.read()

    # Run AI detection on citizen's photo
    start_time = time.time()
    detector = get_detector()
    result = detector.detect_from_bytes(image_bytes, 0.20)
    inference_time = round((time.time() - start_time) * 1000, 1)

    scored = compute_severity(result["detections"], result["image_width"], result["image_height"])
    ranked = rank_priorities(scored)
    stats = compute_overall_stats(ranked)

    report_id = f"RPT-{str(uuid.uuid4())[:6].upper()}"
    report = {
        "id": report_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reporter": reporter_name,
        "description": description,
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "name": location_name,
        },
        "image_filename": file.filename,
        "annotated_image": result["annotated_image"],
        "detections": ranked,
        "stats": stats,
        "inference_time_ms": inference_time,
        # Government tracking fields
        "status": "submitted",
        "status_history": [
            {"status": "submitted", "time": datetime.now(timezone.utc).isoformat(), "note": "Citizen report received"}
        ],
        "assigned_to": None,
        "fix_date": None,
        "upvotes": 1,
    }

    citizen_reports.append(report)

    # Also add to govt detection_store
    detection_store.append({
        "id": report_id,
        "timestamp": report["timestamp"],
        "filename": file.filename,
        "image_width": result["image_width"],
        "image_height": result["image_height"],
        "detections": ranked,
        "annotated_image": result["annotated_image"],
        "stats": stats,
        "inference_time_ms": inference_time,
        "location": report["location"],
        "source": "citizen_report",
    })

    return {
        "id": report_id,
        "status": "submitted",
        "detections_count": len(ranked),
        "severity_summary": {
            "critical": stats["critical_count"],
            "warning": stats["warning_count"],
            "minor": stats["minor_count"],
        },
        "message": "Report submitted! Authorities have been notified.",
    }


@app.get("/public/reports/map")
async def get_map_reports():
    """PUBLIC: All reports for map display (lightweight, no images)."""
    map_data = []
    for r in citizen_reports:
        loc = r["location"]
        if loc["latitude"] and loc["longitude"]:
            damage_type = r["detections"][0].get("display_name", "Damage") if r["detections"] else "Unknown"
            map_data.append({
                "id": r["id"],
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "location_name": loc.get("name", ""),
                "damage_type": damage_type,
                "severity": r["stats"].get("avg_severity", 0),
                "status": r["status"],
                "timestamp": r["timestamp"],
                "reporter": r["reporter"],
                "description": r["description"],
                "upvotes": r["upvotes"],
                "defect_count": r["stats"]["total_defects"],
            })
    return {"reports": map_data, "total": len(map_data)}


@app.get("/public/reports/map/detail")
async def get_map_reports_with_images():
    """PUBLIC: All reports WITH annotated images for detail view."""
    map_data = []
    for r in citizen_reports:
        loc = r["location"]
        if loc["latitude"] and loc["longitude"]:
            damage_type = r["detections"][0].get("display_name", "Damage") if r["detections"] else "Unknown"
            # Include cost from first detection
            cost_est = 0
            repair_method = ""
            if r["detections"]:
                c = r["detections"][0].get("cost", {})
                cost_est = c.get("cost_estimated", 0)
                repair_method = c.get("repair_method", "")

            map_data.append({
                "id": r["id"],
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "location_name": loc.get("name", ""),
                "damage_type": damage_type,
                "severity": r["stats"].get("avg_severity", 0),
                "status": r["status"],
                "timestamp": r["timestamp"],
                "reporter": r["reporter"],
                "description": r["description"],
                "upvotes": r["upvotes"],
                "defect_count": r["stats"]["total_defects"],
                "annotated_image": r.get("annotated_image", ""),
                "cost_estimated": cost_est,
                "repair_method": repair_method,
                "status_history": r.get("status_history", []),
            })
    return {"reports": map_data, "total": len(map_data)}


@app.get("/admin/reports/map")
async def get_admin_map_reports():
    """ADMIN: All reports with images + admin controls for government dashboard."""
    map_data = []
    for r in citizen_reports:
        loc = r["location"]
        if loc["latitude"] and loc["longitude"]:
            damage_type = r["detections"][0].get("display_name", "Damage") if r["detections"] else "Unknown"
            cost_est = 0
            repair_method = ""
            if r["detections"]:
                c = r["detections"][0].get("cost", {})
                cost_est = c.get("cost_estimated", 0)
                repair_method = c.get("repair_method", "")

            map_data.append({
                "id": r["id"],
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "location_name": loc.get("name", ""),
                "damage_type": damage_type,
                "severity": r["stats"].get("avg_severity", 0),
                "status": r["status"],
                "timestamp": r["timestamp"],
                "reporter": r["reporter"],
                "description": r["description"],
                "upvotes": r["upvotes"],
                "defect_count": r["stats"]["total_defects"],
                "annotated_image": r.get("annotated_image", ""),
                "cost_estimated": cost_est,
                "repair_method": repair_method,
                "status_history": r.get("status_history", []),
                "assigned_to": r.get("assigned_to"),
                "detections": r.get("detections", []),
            })
    return {"reports": map_data, "total": len(map_data)}


@app.get("/public/reports/{report_id}")
async def get_citizen_report(report_id: str):
    """PUBLIC: Full details of a specific report."""
    for r in citizen_reports:
        if r["id"] == report_id:
            return r
    raise HTTPException(404, "Report not found")


@app.post("/public/reports/{report_id}/upvote")
async def upvote_report(report_id: str):
    """PUBLIC: Upvote a report to increase priority."""
    for r in citizen_reports:
        if r["id"] == report_id:
            r["upvotes"] += 1
            return {"id": report_id, "upvotes": r["upvotes"]}
    raise HTTPException(404, "Report not found")


@app.get("/public/stats")
async def get_public_transparency_stats():
    """PUBLIC: Government transparency & accountability stats."""
    total = len(citizen_reports)
    fixed = sum(1 for r in citizen_reports if r["status"] == "fixed")
    in_progress = sum(1 for r in citizen_reports if r["status"] == "in_progress")
    acknowledged = sum(1 for r in citizen_reports if r["status"] == "acknowledged")
    pending = sum(1 for r in citizen_reports if r["status"] == "submitted")

    addressed = fixed + in_progress + acknowledged
    performance_score = round((addressed / total * 100) if total > 0 else 0, 1)

    total_cost = 0
    for r in citizen_reports:
        for det in r.get("detections", []):
            if "cost" in det:
                total_cost += det["cost"].get("cost_estimated", 0)

    return {
        "total_reports": total,
        "fixed": fixed,
        "in_progress": in_progress,
        "acknowledged": acknowledged,
        "pending": pending,
        "performance_score": performance_score,
        "total_estimated_cost": total_cost,
        "total_estimated_cost_formatted": f"₹{total_cost:,}",
    }


@app.patch("/admin/reports/{report_id}/status")
async def update_report_status(
    report_id: str,
    status: str = Form(...),
    note: str = Form(default=""),
):
    """ADMIN: Update report status (submitted → acknowledged → in_progress → fixed)."""
    valid_statuses = ["submitted", "acknowledged", "in_progress", "fixed"]
    if status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid_statuses}")

    for r in citizen_reports:
        if r["id"] == report_id:
            r["status"] = status
            r["status_history"].append({
                "status": status,
                "time": datetime.now(timezone.utc).isoformat(),
                "note": note,
            })
            if status == "fixed":
                r["fix_date"] = datetime.now(timezone.utc).isoformat()
            return {"id": report_id, "status": status, "message": f"Status updated to {status}"}

    raise HTTPException(404, "Report not found")
