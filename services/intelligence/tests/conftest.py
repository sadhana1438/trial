import sys
from pathlib import Path

# Add services/intelligence directory to sys.path
INTELLIGENCE_DIR = Path(__file__).resolve().parent.parent
if str(INTELLIGENCE_DIR) not in sys.path:
    sys.path.insert(0, str(INTELLIGENCE_DIR))
