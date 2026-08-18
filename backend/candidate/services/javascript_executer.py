import subprocess
import uuid
from pathlib import Path
from django.conf import settings
import shutil

TEMP_CODE_DIR = Path(settings.BASE_DIR) / "temp_code"

def execute_javascript(code, stdin=""):
    folder_name = uuid.uuid4().hex
    temp_dir = TEMP_CODE_DIR / folder_name
    temp_dir.mkdir(parents=True, exist_ok=True)
    js_file = temp_dir / "main.js"
    try:
        with open(js_file, "w", encoding="utf-8") as file:
            file.write(code)
        run_result = subprocess.run(["node", "main.js"], cwd=temp_dir, input=stdin, capture_output=True, text=True)
        return {
            "success": run_result.returncode == 0,
            "stdout": run_result.stdout,
            "stderr": run_result.stderr,
            "return_code": run_result.returncode
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "return_code": -1
        }
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)