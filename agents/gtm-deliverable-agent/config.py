import os
from pathlib import Path

from dotenv import load_dotenv

AGENT_ROOT = Path(__file__).resolve().parent
load_dotenv(AGENT_ROOT / ".env")

# Where client exports live. Defaults to the repo-local secure_input/ (gitignored)
# but should be overridden to a path outside any repo for real engagements --
# see README's security note.
CLIENT_DATA_DIR = Path(os.environ.get("GTM_AGENT_CLIENT_DATA_DIR", AGENT_ROOT / "secure_input"))

OUTPUT_DIR = Path(os.environ.get("GTM_AGENT_OUTPUT_DIR", AGENT_ROOT / "output"))
