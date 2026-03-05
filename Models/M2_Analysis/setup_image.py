#!/usr/bin/env python3
"""
Helper script to copy your urinalysis strip image to the data folder.
Place your 363.jpeg image in the same folder as this script, then run:
    python setup_image.py
"""

import shutil
import os

SOURCE = "363.jpeg"  # Place your image file here
DEST = os.path.join(os.path.dirname(__file__), "data", "363.jpeg")

if os.path.exists(SOURCE):
    os.makedirs(os.path.dirname(DEST), exist_ok=True)
    shutil.copy(SOURCE, DEST)
    print(f"✅ Image copied to: {DEST}")
else:
    print(f"❌ Source image not found: {SOURCE}")
    print(f"   Please place your 363.jpeg in: {os.path.dirname(__file__)}")
