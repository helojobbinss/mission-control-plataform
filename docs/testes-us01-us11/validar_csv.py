"""Valida os CSVs efetivamente baixados pelo smoke; usa apenas biblioteca padrão."""
import csv
import hashlib
import io
import json
from pathlib import Path

evidence = Path(__file__).resolve().parent / 'evidencias'
results = []
for dataset in ('missions', 'satellites', 'telemetry'):
    path = evidence / f'export-{dataset}.csv'
    raw = path.read_bytes()
    assert raw.startswith(b'\xef\xbb\xbf'), path
    rows = list(csv.reader(io.StringIO(raw.decode('utf-8-sig'), newline='')))
    assert len(rows) > 1 and rows[0][0] == 'id', path
    assert all(len(row) == len(rows[0]) for row in rows), path
    results.append({'file': path.name, 'bom': True, 'encoding': 'utf-8-sig',
                    'delimiter': ',', 'columns': rows[0], 'data_rows': len(rows) - 1,
                    'sha256': hashlib.sha256(raw).hexdigest()})
report = json.dumps(results, indent=2, ensure_ascii=False)
(evidence / 'csv-validacao.json').write_text(report, encoding='utf-8')
print(report)
