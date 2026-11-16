"""Valida documentação/evidências da Sprint 6 sem executar ou alterar a aplicação."""
import csv
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'docs/sprint-6'
E = D / 'evidencias'
report = (D / 'RELATORIO_PARA_WORD.md').read_text(encoding='utf-8')
required = [
    '## IDENTIFICAÇÃO', '## 1. PLANO DE TESTE', '### 1.1 CONTEXTO E ESCOPO',
    '### 1.2 ESTRATÉGIAS', '### 1.3 DADOS E AMBIENTE', '### 1.4 CRITÉRIOS',
    '## 2. ESPECIFICAÇÃO DE CASOS DE TESTE', '## 3. LOG DE EXECUÇÃO',
    '## 4. RELATÓRIO DE INCIDENTE', '## 5. RELATÓRIO DE CONCLUSÃO',
    '### 5.1 MÉTRICAS', '### 5.2 AVALIAÇÃO DOS CRITÉRIOS DE CONCLUSÃO',
    '### 5.3 DESVIOS DO PLANO', '### 5.4 RISCOS RESIDUAIS',
    '### 5.5 LIÇÕES APRENDIDAS', '### 5.6 RECOMENDAÇÃO',
    '## 6. TESTES AUTOMATIZADOS',
]
positions = [report.index(title + '\n') for title in required]
assert positions == sorted(positions), 'Títulos fora de ordem'
for index, title in enumerate(required):
    level = len(title) - len(title.lstrip('#'))
    following = [m.start() for m in re.finditer(r'^#{1,' + str(level) + r'} ', report, flags=re.M)
                 if m.start() > positions[index]]
    end = following[0] if following else len(report)
    assert len(report[positions[index] + len(title):end].strip()) > 40, title
print('APROVADO: 17 títulos acadêmicos presentes, ordenados e preenchidos.')

for name in ['PLANO_DE_TESTES.md', 'CASOS_DE_TESTE.md', 'LOG_DE_EXECUCAO.md',
             'INCIDENTES.md', 'RELATORIO_DE_CONCLUSAO.md',
             'MATRIZ_RASTREABILIDADE.md', 'COMO_EXECUTAR_TESTES.md']:
    assert (D / name).stat().st_size > 100

cases = json.loads((D / 'casos.json').read_text(encoding='utf-8'))
metrics = json.loads((D / 'metricas.json').read_text(encoding='utf-8'))
assert [c['id'] for c in cases] == [f'CT-{i:03}' for i in range(1, 36)]
for c in cases:
    for key in ['historia', 'modulo', 'nivel', 'tipo', 'objetivo', 'prioridade',
                'tecnica', 'precondicoes', 'entradas', 'passos', 'esperado',
                'real', 'status', 'evidencia', 'incidente', 'arquivo', 'comando']:
        assert c[key], (c['id'], key)
    if c['status'] in {'passou', 'falhou', 'bloqueado'}:
        for name in c['evidencia'].split(';'):
            assert (E / name.strip()).is_file(), (c['id'], name)
            assert (E / name.strip()).stat().st_size > 0
    if c['status'] == 'falhou':
        assert c['incidente'] != '—'
    assert c['id'] in report and c['objetivo'] in report

stats = Counter(c['status'] for c in cases)
assert metrics['casos_planejados'] == sum(stats.values()) == 35
assert metrics['casos_executados'] == stats['passou'] + stats['falhou'] == 30
assert metrics['casos_aprovados'] == stats['passou'] == 28
assert metrics['casos_reprovados'] == stats['falhou'] == 2
assert metrics['casos_bloqueados'] == stats['bloqueado'] == 1
assert metrics['casos_nao_executados'] == stats['não executado'] == 4
print('APROVADO: 35 CT completos; 30 executados, 28 aprovados, 2 reprovados, 1 bloqueado e 4 não executados.')

with (D / 'INVENTARIO_AUTOMATIZADO.csv').open(encoding='utf-8-sig', newline='') as f:
    records = list(csv.DictReader(f))
assert len(records) == metrics['instancias_framework'] == 316
counts = Counter(r['status'] for r in records)
assert counts['passou'] == metrics['instancias_aprovadas'] == 275
assert counts['falhou'] == metrics['instancias_reprovadas'] == 41
assert metrics['testes_automatizados_distintos_executados'] == len(records) + 1 == 317
assert metrics['testes_automatizados_aprovados'] == counts['passou'] + 1 == 276
for r in records:
    assert (ROOT / r['arquivo']).is_file(), r['arquivo']
    assert (E / r['evidencia']).stat().st_size > 0
    assert r['ct'] in {c['id'] for c in cases}
    assert r['metodo'] in report.replace('\\|', '|'), r['metodo']
for filename, count in [('backend-final.xml', 104), ('python-final.xml', 45)]:
    assert len(list(ET.parse(E / filename).getroot().iter('testcase'))) == count
vitest = json.loads((E / 'frontend-final.json').read_text(encoding='utf-8'))
assert vitest['numTotalTests'] == 167 and vitest['numFailedTests'] == 40
assert sum(len(s['assertionResults']) for s in vitest['testResults']) == 167
for c in cases:
    instances = [r for r in records if r['ct'] == c['id']]
    if instances:
        assert (c['status'] == 'falhou') == any(r['status'] == 'falhou' for r in instances), c['id']
assert 'PASS: route guard' in (E / 'sistema-final.log').read_text(encoding='utf-8')
print('APROVADO: 316 instâncias conferidas com JUnit/JSON; E2E aprovado; vereditos dos CT consistentes.')

inc = (D / 'INCIDENTES.md').read_text(encoding='utf-8')
ids = re.findall(r'^### (INC-\d{3})', inc, flags=re.M)
assert ids == [f'INC-{i:03}' for i in range(1, 15)]
assert metrics['incidentes_total'] == 14 and metrics['incidentes_abertos'] == 12
assert metrics['incidentes_por_severidade'] == {'alta': 1, 'média': 8, 'baixa': 5}
assert metrics['cobertura_codigo'] is None
assert '85.71%' in report and '93.33%' in report and '87.07%' in report
print('APROVADO: incidentes, severidades, percentuais e cobertura não medida consistentes.')

changed = subprocess.check_output(['git', 'diff', '--name-only'], cwd=ROOT, text=True).splitlines()
assert set(changed) <= {'.gitignore', 'frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx'}, changed
untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=ROOT, text=True).splitlines()
allowed_tests = {'backend/tests/Feature/SprintSixTest.php',
                 'frontend/src/lib/meter-color.test.ts', 'python-api/tests/test_sprint6.py'}
assert all(p.startswith('docs/sprint-6/') or p in allowed_tests for p in untracked), untracked
subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
print('APROVADO: alterações restritas a testes/documentação/ignore; nenhum arquivo de produção modificado.')

manifest = D / 'INTEGRIDADE_SHA256.csv'
if manifest.exists():
    with manifest.open(encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            assert hashlib.sha256((ROOT / row['arquivo']).read_bytes()).hexdigest() == row['sha256'], row['arquivo']
    print('APROVADO: hashes SHA256 de todos os arquivos do inventário conferidos.')
else:
    print('OBSERVAÇÃO: inventário SHA256 ainda não criado; gerá-lo e executar novamente antes da entrega.')

print('VALIDAÇÃO CONCLUÍDA. Isso valida os entregáveis; não altera as falhas de produto ou da regressão.')
