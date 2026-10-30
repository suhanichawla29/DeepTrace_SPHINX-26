"""Root test runner for DeepTrace AI-Generated Image Detector.

Delegates execution to the backend test_model.py.
"""

from pathlib import Path
import runpy
import sys

BACKEND_DIR = Path(__file__).resolve().parent / "DeepTrace" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

target_script = BACKEND_DIR / "test_model.py"

if __name__ == "__main__":
    runpy.run_path(str(target_script), run_name="__main__")

