import subprocess
import uuid
from pathlib import Path
from django.conf import settings

TEMP_CODE_DIR = Path(settings.BASE_DIR) / "temp_code"

def execute_python(code, stdin=""):
    filename = f"{uuid.uuid4().hex}.py"
    filepath = TEMP_CODE_DIR / filename
    try:
        with open(filepath, "w", encoding="utf-8") as file:
            file.write(code)
        result = subprocess.run(["python", str(filepath)], input=stdin, text=True, capture_output=True, timeout=3)
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Execution Timed Out(3 Seconds Exceeded)",
            "return_code": -1
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "return_code": -1
        }
    finally:
        if filepath.exists():
            filepath.unlink()