from .python_executer import execute_python
from .java_executer import execute_java
from .c_executer import execute_c
from .cpp_executer import execute_cpp
from .javascript_executer import execute_javascript

def execute_code(language, code, stdin=""):
    language = language.lower().strip()
    executors = {
        "python": execute_python,
        "java": execute_java,
        "c": execute_c,
        "cpp": execute_cpp,
        "c++": execute_cpp,
        "javascript": execute_javascript,
        "js": execute_javascript,
    }
    executor = executors.get(language)
    if executor is None:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Unsupported language: {language}",
            "return_code": -1
        }
    return executor(code, stdin)