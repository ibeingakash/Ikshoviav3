import sys
import pytest

if __name__ == "__main__":
    exit_code = pytest.main(["-v", "api/tests/test_ai_tutor.py"])
    print(f"PYTEST COMPLETED WITH CODE: {exit_code}")
    sys.exit(exit_code)
