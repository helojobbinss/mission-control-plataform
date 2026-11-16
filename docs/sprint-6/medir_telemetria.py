"""CT-035: observação de latência local; não é ensaio de carga ou SLA."""
import json
import statistics
import time
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'python-api'))
from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    client.get('/api/v1/health').raise_for_status()
    durations = []
    for _ in range(20):
        start = time.perf_counter()
        response = client.get('/api/v1/satellites/5/telemetry')
        response.raise_for_status()
        body = response.json()
        assert body['simulated'] is True
        assert body['total_alerts'] == len(body['alerts'])
        durations.append((time.perf_counter() - start) * 1000)
    result = {
        'caso': 'CT-035', 'amostras': len(durations),
        'ambiente': 'FastAPI TestClient no processo, sem rede ou banco',
        'latencias_ms': durations,
        'mediana_ms': statistics.median(durations),
        'p95_ms_posto_19_de_20': sorted(durations)[18],
        'limite_de_aceitacao': None,
        'conclusao': 'Coleta concluída; não permite afirmar adequação a SLA inexistente.',
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
