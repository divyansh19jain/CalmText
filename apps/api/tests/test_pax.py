from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_pax():
    response = client.post(
        "/api/v1/pax/analyze",
        json={"text": "hello world"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "pax" in data
    assert "prompt_version" in data
    assert "model" in data
    assert "latency_ms" in data

def test_analyze_pax_invalid_input():
    response = client.post(
        "/api/v1/pax/analyze",
        json={} # missing text is unprocessable
    )
    assert response.status_code == 422

def test_feedback():
    response = client.post(
        "/api/v1/pax/feedback",
        json={
            "text": "hello world",
            "pax": "*tilts head*",
            "prompt_version": "pax_v1",
            "helpful": True
        }
    )
    assert response.status_code == 200
    assert response.json() == {"success": True}
