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
ROBOFLOW_MODEL_URL = "https://detect.roboflow.com/test-dataset-yjjjr-gpw9n/2"

# Class name mapping for RDD2022 dataset
RDD_CLASSES = {
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
}

# Extended damage classification — enriches base detections
DAMAGE_SUBTYPES = {
    "D00": {
        "name": "Longitudinal Crack",
        "category": "Crack",
        "risk": "Structural weakening along road direction. Can lead to lane separation.",
        "repair": "Crack sealing or routing and sealing",
    },
    "D10": {
        "name": "Transverse Crack",
        "category": "Crack",
        "risk": "Perpendicular stress fractures. Indicates thermal contraction or base failure.",
        "repair": "Crack filling or full-depth patching",
    },
    "D20": {
        "name": "Alligator Crack",
        "category": "Crack",
        "risk": "Interconnected fatigue cracks. Severe structural failure indicator — highest priority.",
        "repair": "Full-depth reclamation or overlay required",
    },
    "D40": {
        "name": "Pothole",
        "category": "Pothole",
        "risk": "Surface disintegration forming bowl-shaped holes. Immediate vehicle hazard.",
        "repair": "Throw-and-roll patch or semi-permanent repair",
    },
}

SEVERITY_COLORS = {
    "D00": (255, 107, 44),   # orange
    "D10": (255, 145, 66),   # amber
    "D20": (255, 68, 68),    # red — most severe crack type
    "D40": (200, 50, 50),    # dark red — pothole
}


def cv_supplementary_detection(image: Image.Image) -> list:
    """
    OpenCV-based supplementary detection for damage types the YOLO model might miss.
    Detects: surface spalling, water stains/leaks, corrosion discoloration.
    Returns additional detections to merge with YOLO results.
    """
    img_np = np.array(image)
    h, w = img_np.shape[:2]
    hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    extra_detections = []

    # 1. Detect surface spalling (large bright patches on dark surfaces)
    _, bright_mask = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
    bright_mask = cv2.morphologyEx(bright_mask, cv2.MORPH_OPEN, np.ones((10, 10)))
    contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > (w * h * 0.02) and area < (w * h * 0.3):  # 2-30% of image
            x, y, cw, ch = cv2.boundingRect(cnt)
            extra_detections.append({
                "bbox": [float(x), float(y), float(x + cw), float(y + ch)],
                "confidence": round(0.3 + (area / (w * h)) * 0.5, 3),
                "class_name": "spalling",
                "display_name": "Surface Spalling",
                "class_id": 10,
            })

    # 2. Detect water/moisture stains (blue-ish or dark wet patches)
    lower_blue = np.array([90, 30, 30])
    upper_blue = np.array([130, 255, 200])
    blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
    blue_mask = cv2.morphologyEx(blue_mask, cv2.MORPH_OPEN, np.ones((15, 15)))
    contours, _ = cv2.findContours(blue_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > (w * h * 0.03):
            x, y, cw, ch = cv2.boundingRect(cnt)
            extra_detections.append({
                "bbox": [float(x), float(y), float(x + cw), float(y + ch)],
                "confidence": round(0.25 + (area / (w * h)) * 0.4, 3),
                "class_name": "leak",
                "display_name": "Water Stain / Leak",
                "class_id": 11,
            })

    # 3. Detect corrosion (orange/rust-colored patches)
    lower_rust = np.array([5, 80, 80])
    upper_rust = np.array([25, 255, 255])
    rust_mask = cv2.inRange(hsv, lower_rust, upper_rust)
    rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_OPEN, np.ones((10, 10)))
    contours, _ = cv2.findContours(rust_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > (w * h * 0.01):
            x, y, cw, ch = cv2.boundingRect(cnt)
            extra_detections.append({
                "bbox": [float(x), float(y), float(x + cw), float(y + ch)],
                "confidence": round(0.3 + (area / (w * h)) * 0.5, 3),
                "class_name": "corrosion",
                "display_name": "Corrosion / Rust",
                "class_id": 12,
            })

    return extra_detections[:5]  # Cap at 5 supplementary detections


ALL_SEVERITY_COLORS = {
    **SEVERITY_COLORS,
    "spalling": (180, 130, 255),   # purple
    "leak": (0, 150, 255),         # blue
    "corrosion": (255, 165, 0),    # orange
}


def draw_detections(image: Image.Image, detections: list) -> Image.Image:
    """Draw bounding boxes and labels on the image."""
    img = image.copy()
    draw = ImageDraw.Draw(img)

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cls = det["class_name"]
        conf = det["confidence"]
        color = ALL_SEVERITY_COLORS.get(cls, (0, 229, 204))
        display = det.get("display_name", RDD_CLASSES.get(cls, cls))

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
        """Run detection on a PIL Image. Tries Roboflow first, falls back to CV."""
        if self.use_roboflow:
            try:
                result = self._detect_roboflow(image, confidence_threshold)
            except Exception as e:
                print(f"[CRACKWATCH] Roboflow API failed: {e}")
                print("[CRACKWATCH] Falling back to OpenCV supplementary detection")
                result = self._detect_cv_only(image)
            # If Roboflow returned 0 detections (might be blocked), try local + CV
            if result["detection_count"] == 0 and not self.local_model:
                print("[CRACKWATCH] Roboflow returned 0 detections, running CV supplementary only")
                try:
                    cv_extras = cv_supplementary_detection(image)
                    if cv_extras:
                        for det in cv_extras:
                            cls = det["class_name"]
                            if cls in DAMAGE_SUBTYPES:
                                det["category"] = DAMAGE_SUBTYPES[cls]["category"]
                                det["risk"] = DAMAGE_SUBTYPES[cls]["risk"]
                                det["repair"] = DAMAGE_SUBTYPES[cls]["repair"]
                            else:
                                det["category"] = cls.capitalize()
                                det["risk"] = "Monitor and assess."
                                det["repair"] = "Professional assessment recommended"
                        annotated = draw_detections(image, cv_extras)
                        buf = io.BytesIO()
                        annotated.save(buf, format="JPEG", quality=85)
                        result["annotated_image"] = base64.b64encode(buf.getvalue()).decode()
                        result["detections"] = cv_extras
                        result["detection_count"] = len(cv_extras)
                except Exception as e:
                    print(f"[CRACKWATCH] CV fallback error: {e}")
            return result
        else:
            return self._detect_local(image, confidence_threshold)

    def _detect_cv_only(self, image: Image.Image) -> dict:
        """Fallback: OpenCV-only detection when Roboflow is unavailable."""
        w, h = image.size
        detections = cv_supplementary_detection(image)

        for det in detections:
            cls = det["class_name"]
            if cls in DAMAGE_SUBTYPES:
                det["category"] = DAMAGE_SUBTYPES[cls]["category"]
                det["risk"] = DAMAGE_SUBTYPES[cls]["risk"]
                det["repair"] = DAMAGE_SUBTYPES[cls]["repair"]
            else:
                det["category"] = cls.capitalize()
                det["risk"] = "Monitor and assess during next inspection."
                det["repair"] = "Professional assessment recommended"

        annotated = draw_detections(image, detections)
        buf = io.BytesIO()
        annotated.save(buf, format="JPEG", quality=85)
        annotated_b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "detections": detections,
            "annotated_image": annotated_b64,
            "image_width": w,
            "image_height": h,
            "detection_count": len(detections),
        }

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

        # Run supplementary CV detection for spalling, leaks, corrosion
        try:
            cv_extras = cv_supplementary_detection(image)
            detections.extend(cv_extras)
        except Exception as e:
            print(f"[CRACKWATCH] CV supplementary detection error: {e}")

        # Add damage subtype info to each detection
        for det in detections:
            cls = det["class_name"]
            if cls in DAMAGE_SUBTYPES:
                info = DAMAGE_SUBTYPES[cls]
                det["category"] = info["category"]
                det["risk"] = info["risk"]
                det["repair"] = info["repair"]
            else:
                det["category"] = cls.capitalize()
                det["risk"] = "Monitor and assess during next inspection cycle."
                det["repair"] = "Professional assessment recommended"

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
