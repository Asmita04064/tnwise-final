#!/usr/bin/env python3
# ==========================================================
# AI URINALYSIS SYSTEM – ROCHE STRIP + pH + SG + DISEASE
# SINGLE CELL | CLINICALLY ALIGNED
# ==========================================================

import sys
import os

# Ensure print outputs immediately
sys.stdout.flush()

print("=" * 60)
print("AI URINALYSIS SYSTEM - Starting...")
print("=" * 60)

try:
    import cv2
    print("✅ cv2 imported successfully")
except ImportError as e:
    print(f"❌ Failed to import cv2: {e}")
    print("Install via: pip install opencv-python")
    sys.exit(1)

try:
    import numpy as np
    print("✅ numpy imported successfully")
except ImportError as e:
    print(f"❌ Failed to import numpy: {e}")
    print("Install via: pip install numpy")
    sys.exit(1)

try:
    import matplotlib.pyplot as plt
    print("✅ matplotlib imported successfully")
except ImportError as e:
    print(f"❌ Failed to import matplotlib: {e}")
    print("Install via: pip install matplotlib")
    sys.exit(1)

try:
    from ultralytics import YOLO
    print("✅ ultralytics imported successfully")
    ULTRA_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  ultralytics not available: {e}")
    ULTRA_AVAILABLE = False
    YOLO = None

# ================= PATHS =================
CURRENT_FOLDER = os.path.dirname(os.path.abspath(__file__))
IMG_PATH = os.path.join(CURRENT_FOLDER, "data", "363.jpeg")
YOLO_MODEL_PATH = os.path.join(CURRENT_FOLDER, "models", "urinalysis_model3_best.pt")

NUM_PADS = 11
PAD_NAMES = [
    "Specific Gravity", "pH", "Leukocytes", "Nitrite", "Protein",
    "Glucose", "Ketone", "Urobilinogen", "Bilirubin", "Erythrocytes", "Color"
]

# ================= ROCHE LAB REFERENCES =================
ROCHE_CHART = {
    "Leukocytes": [("neg", (88, 0, 6)), ("trace", (82, -2, 8)), ("1+", (76, -4, 10)), ("2+", (70, -6, 12))],
    "Protein": [("neg", (90, -2, 8)), ("trace", (84, -4, 12)), ("1+", (78, -6, 16)), ("2+", (70, -8, 20))],
    "Glucose": [("neg", (90, -4, 10)), ("1+", (82, -6, 14)), ("2+", (74, -8, 18)), ("3+", (66, -10, 22)), ("4+", (58, -12, 26))],
    "Ketone": [("neg", (92, -2, 6)), ("1+", (82, 8, -6)), ("2+", (70, 16, -12)), ("3+", (60, 22, -18))],
    "Urobilinogen": [("normal", (92, -2, 6)), ("1+", (80, 6, -4)), ("2+", (66, 14, -10)), ("3+", (56, 20, -14))],
    "Bilirubin": [("neg", (94, -2, 6)), ("1+", (82, 10, 16)), ("2+", (70, 18, 24))],
    "Erythrocytes": [("neg", (92, -2, 6)), ("trace", (84, -4, 10)), ("1+", (72, -6, 14)), ("2+", (60, -8, 18)), ("3+", (50, -10, 22))]
}

# ================= NUMERIC SCALES =================
PH_SCALE = [
    (5.0, (92, -2, 6)), (6.0, (84, -4, 8)),
    (7.0, (76, -6, 10)), (8.0, (68, -8, 12))
]

SG_SCALE = [
    (1.005, (94, -2, 6)), (1.010, (88, -4, 8)), (1.015, (82, -6, 10)),
    (1.020, (76, -8, 12)), (1.025, (70, -10, 14)), (1.030, (64, -12, 16))
]

# ================= FUNCTIONS =================
def normalize(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(2.0, (8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

def detect_strip(img, model):
    if model is None:
        return img
    try:
        res = model(img, conf=0.15)[0]
        if res.boxes is None or len(res.boxes) == 0:
            print("⚠️  YOLO did not detect strip")
            return img
        box = res.boxes.xyxy.cpu().numpy()
        box = box[np.argmax(res.boxes.conf.cpu().numpy())]
        x1, y1, x2, y2 = map(int, box)
        return img[y1:y2, x1:x2]
    except:
        return img

def split_pads(strip):
    h, w, _ = strip.shape
    pad_w = w // NUM_PADS
    pads = []
    for i in range(NUM_PADS):
        p = strip[:, i*pad_w:(i+1)*pad_w]
        p = p[int(0.25*h):int(0.75*h), int(0.25*pad_w):int(0.75*pad_w)]
        pads.append(cv2.GaussianBlur(p, (5, 5), 0))
    return pads

def mean_lab(pad):
    lab = cv2.cvtColor(pad, cv2.COLOR_BGR2LAB)
    return np.mean(lab.reshape(-1, 3), axis=0)

def deltaE(a, b):
    return np.linalg.norm(np.array(a) - np.array(b))

def roche_label(test, lab):
    ref = ROCHE_CHART[test]
    return min([(deltaE(lab, c), lbl) for lbl, c in ref], key=lambda x: x[0])[1]

def numeric_label(lab, scale):
    return min([(deltaE(lab, c), v) for v, c in scale], key=lambda x: x[0])[1]

# ================= CREATE TEST IMAGE IF MISSING =================
def create_test_image(path):
    """Generate a synthetic urinalysis strip test image."""
    print(f"⏳ Creating test image at {path}...")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # Create a synthetic test image (11 pads, similar to urinalysis strip)
    img = np.ones((150, 550, 3), dtype=np.uint8) * 200  # Light gray background
    
    # Colors for each test pad (simulating different results)
    pad_colors = [
        (200, 150, 100),  # Specific Gravity
        (180, 140, 120),  # pH
        (150, 100, 80),   # Leukocytes
        (200, 180, 160),  # Nitrite
        (210, 190, 170),  # Protein
        (190, 160, 140),  # Glucose
        (170, 130, 110),  # Ketone
        (195, 165, 145),  # Urobilinogen
        (160, 110, 90),   # Bilirubin
        (140, 90, 70),    # Erythrocytes
        (220, 210, 200),  # Color
    ]
    
    pad_width = 50
    for i, color in enumerate(pad_colors):
        x_start = i * pad_width
        x_end = (i + 1) * pad_width
        img[:, x_start:x_end] = color
    
    # Add some noise/texture
    noise = np.random.randint(-5, 5, img.shape, dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    cv2.imwrite(path, img)
    print(f"✅ Test image created: {path}")
    return img

# ================= RUN ANALYSIS =================
print("\n========== Checking Assets ==========\n")

if not os.path.exists(IMG_PATH):
    print(f"⚠️  Image not found at {IMG_PATH}")
    create_test_image(IMG_PATH)
else:
    print(f"✅ Image found at {IMG_PATH}")

model = None
if not os.path.exists(YOLO_MODEL_PATH):
    print(f"⚠️  Model file not found at {YOLO_MODEL_PATH}")
    print(f"   Continuing without strip detection (will use full image)")
else:
    print("Loading model...")
    try:
        model = YOLO(YOLO_MODEL_PATH, task="detect")
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"⚠️  Failed to load YOLO model: {e}")
        model = None

print("Reading image...")
img_bgr = cv2.imread(IMG_PATH)
if img_bgr is None:
    print(f"❌ ERROR: Failed to read image: {IMG_PATH}")
    sys.exit(1)

print("✅ Image loaded successfully")
img = normalize(img_bgr)

if model is not None:
    try:
        strip = detect_strip(img, model)
    except Exception as e:
        print(f"⚠️  Strip detection failed: {e}")
        print("   Using full image fallback")
        strip = img
else:
    strip = img

pads = split_pads(strip)
results = {}

print("\n========== AI URINALYSIS STRIP REPORT ==========\n")

for i, pad in enumerate(pads[:-1]):  # Exclude Color pad
    test = PAD_NAMES[i]
    lab = mean_lab(pad)

    if test == "Nitrite":
        label = "pos" if lab[2] < 130 else "neg"
    elif test == "pH":
        label = str(numeric_label(lab, PH_SCALE))
    elif test == "Specific Gravity":
        label = f"{numeric_label(lab, SG_SCALE):.3f}"
    else:
        label = roche_label(test, lab)

    results[test] = label
    print(f"{test:<18}: {label}")

# ================= DISEASE PREDICTION =================
print("\n========== AI CLINICAL INTERPRETATION ==========\n")

diseases = []

if results.get("Leukocytes") in ["1+", "2+", "3+"] and results.get("Nitrite") == "pos":
    diseases.append("Urinary Tract Infection (UTI)")

if results.get("Glucose") in ["2+", "3+", "4+"]:
    diseases.append("Diabetes Mellitus")

if results.get("Ketone") in ["2+", "3+"] and results.get("Glucose") in ["2+", "3+", "4+"]:
    diseases.append("Ketosis / Possible DKA")

if results.get("Protein") in ["2+", "3+"] or float(results.get("Specific Gravity", 1.0)) > 1.025:
    diseases.append("Possible Kidney Disease")

if results.get("Bilirubin") in ["1+", "2+"] or results.get("Urobilinogen") in ["2+", "3+"]:
    diseases.append("Possible Liver Dysfunction")

if results.get("Erythrocytes") in ["1+", "2+", "3+"]:
    diseases.append("Hematuria")

if diseases:
    for d in diseases:
        print("❌", d)
else:
    print("✅ No major pathology detected")

# ================= VISUAL CHECK =================
print("Generating visualization...")
plt.figure(figsize=(16, 4))
for i, p in enumerate(pads):
    plt.subplot(1, NUM_PADS, i+1)
    plt.imshow(cv2.cvtColor(p, cv2.COLOR_BGR2RGB))
    plt.title(PAD_NAMES[i], fontsize=7)
    plt.axis("off")

# Save instead of show
output_path = os.path.join(CURRENT_FOLDER, "analysis_result.png")
plt.savefig(output_path, dpi=100, bbox_inches='tight')
print(f"✅ Visualization saved to: {output_path}")
plt.close()

print("\n✅ Analysis complete!")
