"""
Inference pipeline for infrastructure damage detection.
Uses Roboflow hosted model API (trained YOLOv11 on RDD2022).
Falls back to local YOLOv8 if available.
"""

import os
import io
import base64
import json
import cv2
import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "model"

# Roboflow API config
ROBOFLOW_API_KEY = "***REMOVED***"
ROBOFLOW_MODEL_URL = "https://detect.roboflow.com/test-dataset-yjjjr-gpw9n/1"

# Class name mapping for RDD2022 dataset
RDD_CLASSES = {
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
}

SEVERITY_COLORS = {
    "D00": (255, 107, 44),   # orange
    "D10": (255, 145, 66),   # amber
    "D20": (255, 68, 68),    # red
    "D40": (255, 68, 68),    # red
}


def draw_detections(image: Image.Image, detections: list) -> Image.Image:
    """Draw bounding boxes and labels on the image."""
    img = image.copy()
    draw = ImageDraw.Draw(img)

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cls = det["class_name"]
        conf = det["confidence"]
        color = SEVERITY_COLORS.get(cls, (0, 229, 204))
        display = RDD_CLASSES.get(cls, cls)

        # Draw box
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        # Draw label background
        label = f"{display} {conf:.0%}"
        try:
            font = ImageFont.truetype("arial.ttf", 14)
        except:
            font = ImageFont.load_default()
        bbox = draw.textbbox((x1, y1 - 20), label, font=font)
        draw.rectangle([bbox[0] - 2, bbox[1] - 2, bbox[2] + 2, bbox[3] + 2], fill=color)
        draw.text((x1, y1 - 20), label, fill=(0, 0, 0), font=font)

        # Corner markers
        corner_len = min(20, (x2 - x1) // 4, (y2 - y1) // 4)
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            draw.line([(cx, cy), (cx + dx * corner_len, cy)], fill=color, width=2)
            draw.line([(cx, cy), (cx, cy + dy * corner_len)], fill=color, width=2)

    return img


class DamageDetector:
    def __init__(self, model_path: str = None):
        """
        Initialize the detector.
        Uses Roboflow API for the trained crack model.
        Falls back to local YOLO if best.pt exists.
        """
        self.use_roboflow = True
        self.local_model = None

        # Check for local model first
        if model_path and os.path.exists(model_path):
            print(f"[CRACKWATCH] Loading local model: {model_path}")
            from ultralytics import YOLO
            self.local_model = YOLO(model_path)
            self.use_roboflow = False
        else:
            local_best = MODEL_DIR / "best.pt"
            if local_best.exists():
                print(f"[CRACKWATCH] Loading local model: {local_best}")
                from ultralytics import YOLO
                self.local_model = YOLO(str(local_best))
                self.use_roboflow = False
            else:
                print("[CRACKWATCH] Using Roboflow hosted model API")

    def detect(self, image: Image.Image, confidence_threshold: float = 0.25) -> dict:
        """Run detection on a PIL Image."""
        if self.use_roboflow:
            return self._detect_roboflow(image, confidence_threshold)
        else:
            return self._detect_local(image, confidence_threshold)

    def _detect_roboflow(self, image: Image.Image, confidence_threshold: float) -> dict:
        """Use Roboflow hosted inference API."""
        w, h = image.size

        # Convert image to base64 for API
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=90)
        img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        # Call Roboflow API
        response = requests.post(
            ROBOFLOW_MODEL_URL,
            params={
                "api_key": ROBOFLOW_API_KEY,
                "confidence": int(confidence_threshold * 100),
            },
            data=img_b64,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            print(f"[CRACKWATCH] Roboflow API error: {response.status_code} {response.text}")
            return {
                "detections": [],
                "annotated_image": img_b64,
                "image_width": w,
                "image_height": h,
                "detection_count": 0,
            }

        data = response.json()
        predictions = data.get("predictions", [])

        detections = []
        for pred in predictions:
            cx = pred["x"]
            cy = pred["y"]
            pw = pred["width"]
            ph = pred["height"]
            x1 = cx - pw / 2
            y1 = cy - ph / 2
            x2 = cx + pw / 2
            y2 = cy + ph / 2

            cls_name = pred["class"]
            display_name = RDD_CLASSES.get(cls_name, cls_name)

            detections.append({
                "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                "confidence": round(pred["confidence"], 3),
                "class_name": cls_name,
                "display_name": display_name,
                "class_id": list(RDD_CLASSES.keys()).index(cls_name) if cls_name in RDD_CLASSES else 0,
            })

        # Draw detections on image
        annotated = draw_detections(image, detections)
        ann_buffer = io.BytesIO()
        annotated.save(ann_buffer, format="JPEG", quality=85)
        annotated_b64 = base64.b64encode(ann_buffer.getvalue()).decode("utf-8")

        return {
            "detections": detections,
            "annotated_image": annotated_b64,
            "image_width": w,
            "image_height": h,
            "detection_count": len(detections),
        }

    def _detect_local(self, image: Image.Image, confidence_threshold: float) -> dict:
        """Use local YOLO model."""
        img_np = np.array(image)
        if len(img_np.shape) == 2:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2RGB)
        elif img_np.shape[2] == 4:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2RGB)

        h, w = img_np.shape[:2]
        results = self.local_model(img_np, conf=confidence_threshold, verbose=False)
        result = results[0]

        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = self.local_model.names.get(cls_id, f"class_{cls_id}")
            display_name = RDD_CLASSES.get(cls_name, cls_name)

            detections.append({
                "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                "confidence": round(conf, 3),
                "class_name": cls_name,
                "display_name": display_name,
                "class_id": cls_id,
            })

        annotated = result.plot()
        annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
        pil_annotated = Image.fromarray(annotated_rgb)

        buffer = io.BytesIO()
        pil_annotated.save(buffer, format="JPEG", quality=85)
        annotated_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "detections": detections,
            "annotated_image": annotated_b64,
            "image_width": w,
            "image_height": h,
            "detection_count": len(detections),
        }

    def detect_from_bytes(self, image_bytes: bytes, confidence_threshold: float = 0.25) -> dict:
        """Run detection from raw image bytes."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self.detect(image, confidence_threshold)


# Singleton
_detector = None

def get_detector(model_path: str = None) -> DamageDetector:
    global _detector
    if _detector is None:
        _detector = DamageDetector(model_path)
    return _detector
