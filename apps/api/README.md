# CalmText API

Phase 1 backend for CalmText.

## Getting Started

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
cp .env.example .env

# Run server
uvicorn app.main:app --reload

# Run tests
pytest tests/
```
