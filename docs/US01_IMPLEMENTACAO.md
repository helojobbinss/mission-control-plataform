# US01 — Extrair dados para análises

## Identificação

- História: US01; prioridade alta.
- Objetivo original: “Como cientista de dados, quero poder extrair os dados, para realizar análises mais precisas.”
- Implementação e validação: 16/11/2026, sobre o workspace com os ajustes já integrados. Sem commit, push ou merge desta entrega.

## Análise do código e dos documentos

Foram consultados README.md, docs/sprint-6/MATRIZ_RASTREABILIDADE.md,
docs/sprint-6/PLANO_DE_TESTES.md e a extração integral do documento
`SPRINT 1/SPRINT 1 - entrega 1.docx.pdf`, em
`docs/sprint-6/evidencias/sprint-1-extraida.txt` (US01). Os documentos da
Sprint 6 registram a ausência de exportação: endpoints JSON operacionais não
constituíam extração analítica. Esses documentos históricos não foram reescritos.

O código confirmou os modelos Mission, Satellite e TelemetryReading, suas
migrations, os relacionamentos Mission::satellite, Satellite::missions e
TelemetryReading::satellite. Não foi encontrado exportador CSV aproveitável.
As rotas de leitura de missões e satélites usam auth:sanctum, sem restrição por
papel. A exportação segue essa mesma permissão de leitura: qualquer usuário
autenticado pode acessar; não foi criado um papel fictício de cientista de dados.

Missões e satélites são cadastros persistidos. TelemetryRecorder grava os
sensores em readings (JSON), posição em orbital_position (JSON), simulated e
recorded_at. Sensores são simulados pela API Python; a exportação mantém essa
informação e consulta apenas as leituras já gravadas. Não consulta Python,
CelesTrak ou SatNOGS e não produz novas leituras. Não existe mission_id no
histórico: não se atribui uma leitura a uma missão por suposição.

## Implementação

A página **Extrair dados** foi integrada ao menu Geral e ao layout autenticado,
com seleção de conjunto, datas, IDs opcionais, download e mensagens de erro ou
ausência de registros. Reutiliza os componentes Select, Input, Label, Button,
Card, Header e Main e o cliente HTTP com Bearer existente.

### Arquivos criados

- backend/app/Http/Controllers/DataExportController.php — validação e resposta de download.
- backend/app/Services/DataExportService.php — consulta, filtros e serialização CSV.
- backend/tests/Feature/DataExportTest.php — CT-US01-001 a CT-US01-007 (14 testes, com parametrização).
- frontend/src/features/exports/index.tsx — formulário e download do Blob.
- frontend/src/features/exports/index.test.tsx — cinco testes no navegador.
- frontend/src/routes/_authenticated/extrair-dados/index.tsx — rota da página.
- docs/US01_IMPLEMENTACAO.md — este documento.

### Arquivos alterados

- backend/routes/api.php — GET /api/exports dentro de auth:sanctum.
- frontend/src/components/layout/data/sidebar-data.ts — link Extrair dados.
- frontend/scripts/integration-smoke.mjs — fluxo US01 no teste integrado existente.

Nenhuma alteração de schema, autenticação, mecanismo de telemetria ou lógica de
missões/monitoramento. Nenhuma biblioteca adicionada. A árvore de rotas TanStack
é gerada pelo Vite e continua fora do Git.

### Endpoint e filtros

`GET /api/exports`, com `Authorization: Bearer <token>`.

| Parâmetro | Regra e significado |
| --- | --- |
| dataset | Obrigatório: missions, satellites ou telemetry |
| start_date | Opcional, YYYY-MM-DD; início do dia UTC, inclusivo |
| end_date | Opcional, YYYY-MM-DD; dia inteiro UTC, inclusivo; não pode preceder start_date |
| satellite_id | Opcional, inteiro positivo existente; disponível nos três conjuntos |
| mission_id | Opcional, inteiro positivo existente; filtra a missão ou seu satélite nos respectivos conjuntos; proibido em telemetry |

Os filtros se combinam por interseção no backend. Para cadastros, o período usa
created_at; para telemetria, recorded_at. O limite superior é o início do dia
seguinte, exclusivo. Datas inicial e final também podem ser usadas separadamente.
Sem filtros, exporta todos os registros do conjunto. IDs referem-se às chaves
internas, e não ao número NORAD. Filtros conflitantes válidos retornam conjunto vazio.

| Resposta | Comportamento |
| --- | --- |
| 200 | Arquivo CSV via streamDownload e Content-Disposition attachment |
| 401 | Acesso sem autenticação ou token inválido |
| 404 | JSON: Nenhum registro encontrado para os filtros informados. |
| 422 | JSON com os erros de validação |

### Formato

UTF-8 com BOM (`EF BB BF`), vírgula, aspas duplas e linhas CRLF, usando fputcsv
com escape vazio. Datas de calendário usam YYYY-MM-DD, timestamps usam ISO 8601
UTC com Z. Nulos são células vazias. Decimais usam ponto. Textos que começam por
marcadores de fórmula (=, +, -, @), inclusive após espaços/controles, e textos
com tabulação ou quebra de linha inicial recebem apóstrofo de proteção. Aspas,
vírgulas, acentos e quebras internas são escapados pelo serializador nativo.
Números tipados negativos são preservados; um texto protegido terá o apóstrofo
visível ao ser lido por ferramentas que não o tratam como marcador de texto.

- **missions**: id, name, satellite_id, description, status, category,
  operator_name, planned_start_date, planned_end_date, started_at, ended_at,
  budget, created_at, updated_at. A unidade monetária de budget não é definida
  no schema: a exportação não inventa uma moeda.
- **satellites**: id, norad_id, name, international_designator, source, status,
  description, launch_date, orbit_altitude_km, orbit_inclination_deg,
  orbit_raan_deg, orbit_initial_anomaly_deg, orbit_epoch, created_at, updated_at.
  Os parâmetros orbitais manuais são identificados por source=manual.
- **telemetry**: uma linha por sensor, repetindo id da leitura, satellite_id,
  recorded_at, simulated (1/0), parameter, value, unit, status, latitude_deg,
  longitude_deg, altitude_km, orbital_speed_km_s. Uma leitura sem sensores ainda
  exporta uma linha com metadados e campos do sensor vazios. Posição ausente
  permanece vazia. Nenhum sensor é descartado por uma lista fixa de nomes.

O backend verifica existência e percorre os resultados com lazyById em lotes de
500, sem carregar todo o conjunto e sem consultas por relacionamento em cada
linha. Não atualiza, exclui nem insere registros durante a exportação.

## Testes executados

| Caso | Objetivo | Procedimento executado | Esperado | Obtido | Status |
| --- | --- | --- | --- | --- | --- |
| CT-US01-001 | Exportação persistida | Criar cadastros e leitura no SQLite isolado; baixar os três conjuntos; conferir IDs, valor e unidade | CSV com os registros armazenados | Três conjuntos corretos, telemetria com duas linhas/sensores | Aprovado |
| CT-US01-002 | Filtros | Datas limítrofes, satélites distintos, missão e seu vínculo; data final isolada | Apenas registros correspondentes, incluindo o último dia | IDs e contagens conferidos | Aprovado |
| CT-US01-003 | Sem registros | Consultar três conjuntos vazios | Resposta compreensível, sem arquivo enganoso | HTTP 404 com mensagem; também verificado na UI integrada | Aprovado |
| CT-US01-004 | Validação | Oito entradas: dataset, datas, ordem, IDs inexistentes, array e missão na telemetria | HTTP 422 por campo | Oito cenários aprovados | Aprovado |
| CT-US01-005 | Acesso | Consultar sem sessão e com token inválido; demais testes com Sanctum | HTTP 401 para não autenticados; leitura autorizada funciona | Respostas esperadas | Aprovado |
| CT-US01-006 | Integridade | Comparar conteúdo integral das quatro tabelas antes/depois; bloquear HTTP externo | Nenhuma alteração nem chamada externa | Snapshots iguais; nenhuma requisição upstream | Aprovado |
| CT-US01-007 | Compatibilidade | Ler CSV com fgetcsv; conferir BOM, MIME, download, colunas, acentos, aspas, quebras, fórmulas e decimais | Estrutura e valores preservados, fórmulas neutralizadas | Asserções aprovadas | Aprovado |

### Comandos e resultados reais

Na raiz:

```powershell
docker compose exec -T app php vendor/phpunit/phpunit/phpunit --no-progress --filter DataExportTest
# OK (14 tests, 156 assertions)

docker compose exec -T app php vendor/phpunit/phpunit/phpunit --no-progress
# OK (118 tests, 781 assertions)
```

Em frontend:

```powershell
npm test -- src/features/exports/index.test.tsx src/lib/api.test.ts src/context/search-provider.test.tsx
# Test Files 3 passed (3); Tests 22 passed (22)

npm run build
# vite build e tsc -b: exit code 0

npm run lint
# eslint .: exit code 0
```

O teste de integração usa PHP >=8.4.1 com SQLite, Python com requirements do
projeto e Chromium do Playwright. Neste ambiente:

```powershell
$env:PHP_BINARY = 'C:\Users\willc\AppData\Local\Temp\mission-control-php84\php.exe'
npm run test:integration
```

Saídas efetivamente obtidas:

```text
PASS US01: navigation, authenticated real CSV downloads for three datasets, UTF-8 BOM and empty date filter feedback.
PASS: route guard, login, manual satellite, FastAPI telemetry, mission creation/edit/transition, dashboard, session reload, manager user creation and logout.
```

O runner criou seu próprio SQLite temporário e serviços nas portas 15173, 18000
e 18001 e os removeu ao terminar. Não utilizou nem apagou dados/volumes MariaDB.
Os testes PHPUnit também usam SQLite isolado com proteção no bootstrap.

### Exemplo de requisição

```http
GET /api/exports?dataset=telemetry&satellite_id=1&start_date=2026-11-16&end_date=2026-11-16
Authorization: Bearer <token obtido no login>
Accept: text/csv
```

Formato do cabeçalho realmente gerado (precedido pelo BOM no arquivo):

```csv
id,satellite_id,recorded_at,simulated,parameter,value,unit,status,latitude_deg,longitude_deg,altitude_km,orbital_speed_km_s
```

Os testes CT-US01 usam uma leitura persistida de fixture: temperature=-12.5,
unit=°C, simulated=1, latitude=-23.5. São dados de teste, não evidência de sensores
físicos nem registros do banco do usuário.

## Execução e teste manual

Com os serviços já configurados, na raiz execute `docker compose up -d`; em
frontend execute `npm ci` se necessário e `npm run dev`. Acesse
http://localhost:5173, entre com uma conta existente e use **Geral → Extrair
dados**, ou http://localhost:5173/extrair-dados.

1. Selecione um conjunto e clique em **Exportar CSV** para os registros disponíveis.
2. Opcionalmente preencha datas e IDs internos existentes; confirme a seleção no arquivo.
3. Para verificar ausência de registros, escolha um período sem dados.
4. Abra o CSV no Excel (importar como UTF-8/vírgula se a configuração regional usar ponto e vírgula) ou em Python com `pandas.read_csv('export-telemetry.csv', encoding='utf-8-sig')`.

Nenhuma conta demonstrativa foi criada por esta implementação. O conjunto de
telemetria fica vazio até que o fluxo normal de monitoramento tenha persistido
leituras; a extração não força sua geração.

## Limitações e critérios

Os critérios funcionais da US01 foram cobertos pela implementação e pelos testes
acima, incluindo navegação/download real no navegador. Isso é validação técnica,
não aceite formal da equipe nem homologação em todas as versões de Excel.

- Não há vínculo de leitura com missão: o filtro de missão é indisponível na
  telemetria. Não se infere período de uma missão como associação histórica.
- Datas filtram criação dos cadastros ou instante da leitura, não datas de
  lançamento/planejamento.
- CSV é síncrono; memória do backend é limitada por lote, mas o navegador recebe
  um Blob completo. Arquivos muito grandes podem atingir limites do navegador ou
  timeout do cliente HTTP. Não há job/armazenamento de exportações.
- A exportação não fixa um snapshot transacional longo: alterações concorrentes
  nos cadastros podem aparecer entre lotes.
- Validação automatizada de dados usou SQLite isolado, não uma cópia MariaDB de
  produção. Abertura interativa no Excel não foi executada; estrutura foi lida
  com parser CSV e baixada pelo Chromium.
- A suíte completa herdada do frontend não foi reexecutada: foram executados os
  testes novos, contratos HTTP e busca/navegação afetados, além do smoke integrado,
  build e lint. Não se declara toda a suíte legada aprovada.
- Sem US06, US14, dashboards, novas medições ou alteração dos mecanismos existentes.
