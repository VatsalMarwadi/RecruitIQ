import subprocess
import uuid
from pathlib import Path
from django.conf import settings
import shutil

TEMP_CODE_DIR = Path(settings.BASE_DIR) / "temp_code"

def execute_c(code, stdin=""):
    folder_name = uuid.uuid4().hex
    temp_dir = TEMP_CODE_DIR / folder_name
    temp_dir.mkdir(parents=True, exist_ok=True)
    c_file = temp_dir / "main.c"
    executable = temp_dir / "main.exe"
    try:
        with open(c_file, "w", encoding="utf-8") as file:
            file.write(code)
        compile_result = subprocess.run(["gcc", "main.c", "-o", "main.exe"], cwd=temp_dir, capture_output=True, text=True)
        if compile_result.returncode != 0:
            return {
                "success": False,
                "stdout": compile_result.stdout,
                "stderr": compile_result.stderr,
                "return_code": compile_result.returncode
            }
        run_result = subprocess.run([str(executable)], cwd=temp_dir, input=stdin, capture_output=True, text=True)
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