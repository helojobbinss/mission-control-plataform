# Relatório de testes — US01 e US11

## 1. Identificação do projeto

- Projeto: Mission Control Platform.
- Repositório: https://github.com/helojobbinss/mission-control-plataform.
- Branch analisada: main, incluindo alterações não commitadas.
- HEAD de referência: f84d2f0bf298a3b8418998c34b45da15d9f28851. As implementações US01/US11 e os testes/documentos desta entrega estão na árvore de trabalho, não nesse commit isoladamente.
- Data: 16/11/2026, America/Sao_Paulo. Timestamps UTC nas leituras/capturas podem indicar 17/11/2026, correspondente à noite de 16/11 no fuso local.
- Tecnologias: Laravel/PHP, React/TypeScript, FastAPI/Python, MariaDB e Docker Compose.
- Sem commit, push, merge, nova funcionalidade ou operação destrutiva no ambiente principal nesta validação.

## 2. Objetivo dos testes

Validar funcionalmente US01 (extração de dados) e US11 (configuração de parâmetros), confirmar integração e persistência, detectar defeitos e fornecer evidências reproduzíveis para documentação acadêmica. Aprovação técnica não substitui aceite formal da equipe ou do professor.

## 3. Escopo

**US01 implementada:** GET /api/exports, conjuntos missions/satellites/telemetry persistidos, filtros no backend, CSV UTF-8 BOM, tratamento de fórmulas, autorização Sanctum e download no React. Página /extrair-dados integrada à navegação. Datas de cadastros filtram created_at; telemetria filtra recorded_at. Telemetria não permite mission_id porque o histórico não tem esse vínculo.

**US11 implementada no escopo de três sensores:** temperatura interna, bateria e tensão. GET/PUT /api/satellites/{satellite}/monitoring/limits; JSON nullable por satélite; padrão legado quando não configurado; edição por gerente/operador ativo. A seção fica abaixo dos detalhes atuais, na própria tela de monitoramento. MonitoringLimits aplica regras aos endpoints Laravel de telemetria antes da gravação de leituras/alertas. Outros sensores e API Python independente mantêm avaliação padrão. Não são medições físicas.

**Consulta documental:** docs/sprint-6/PLANO_DE_TESTES.md e MATRIZ_RASTREABILIDADE.md descrevem o estado anterior como não implementado. Não foram reescritos: as implementações posteriores estão documentadas em docs/US01_IMPLEMENTACAO.md e docs/US11_IMPLEMENTACAO.md. Este relatório registra a validação atual.

## 4. Metodologia

1. Inspeção da árvore de trabalho, rotas, controllers, serviços, modelos, migration e componentes React, incluindo testes preexistentes.
2. Testes de feature PHPUnit com HTTP simulado somente para dependências externas e SQLite isolado; asserções sobre respostas e banco real de teste.
3. Testes funcionais de componentes no Chromium/Vitest com adapter HTTP controlado: formulários, erros e cache. Não são provas de disponibilidade do backend real.
4. E2E Playwright com React → Vite proxy → Laravel → SQLite temporário e Laravel → FastAPI real para sensores simulados; login, dois satélites manuais, configurações, reload, missões e downloads reais. Evidências de HTTP não incluem headers de autenticação nem respostas de login.
5. Regressão completa backend/frontend/Python, build e lint.
6. Parser CSV independente da biblioteca padrão Python para verificar os arquivos efetivamente baixados.

## 5. Ambiente e comandos

| Componente | Versão/ambiente identificado | Evidência |
| --- | --- | --- |
| Host | Windows; PowerShell; Node v22.23.4 | ambiente-node.json |
| React / Vite / Vitest / Playwright | 19.3.0 / 8.3.3 / 4.1.11 / 1.59.1 instalados | ambiente-node.json |
| PHP do contêiner | 8.4.27 | php-version.log |
| PHPUnit | 11.5.57 | backend-final.log |
| Python do contêiner | 3.11.18 | python-version.log |
| Cliente MariaDB disponível | 11.4.13-MariaDB | mariadb-version.log; não é ensaio de CRUD nessa base |
| Banco de feature tests | SQLite :memory:, com proteção de bootstrap | backend-final.xml; tests/bootstrap.php e CreatesApplication.php |
| Banco E2E | SQLite em diretório mission-control-smoke-* temporário | integration-smoke.mjs; e2e.log |

A migration aditiva de monitoring_limits foi verificada no banco de teste por RefreshDatabase e pelo seed do E2E. migrate:status do ambiente local foi apenas consultado; não houve rollback, fresh, limpeza de volume ou aplicação de migration nesta tarefa de validação.

Comandos efetivamente executados (os logs foram redirecionados para evidencias):

```powershell
# Na raiz; o wrapper rtk proxy foi usado para execução no ambiente.
docker compose exec -T -e US_VALIDATION_INTEGRITY=/tmp/us-integrity.json app php vendor/phpunit/phpunit/phpunit --no-progress --log-junit /tmp/us-backend.xml
docker compose cp app:/tmp/us-backend.xml docs/testes-us01-us11/evidencias/backend-final.xml
docker compose cp app:/tmp/us-integrity.json docs/testes-us01-us11/evidencias/integridade-banco.json
docker compose exec -T app php artisan migrate:status
python docs/testes-us01-us11/validar_csv.py

# Em frontend:
npm test -- src/features/monitoring/components/monitoring-limits.test.tsx
npm test -- src/features/monitoring/components/monitoring-limits.test.tsx src/features/exports/index.test.tsx src/lib/api.test.ts src/context/search-provider.test.tsx
npm test
npm test -- src/features/tasks/components/tasks-mutate-drawer.test.tsx
npm run build
npm run lint
$env:PHP_BINARY = 'C:\Users\willc\AppData\Local\Temp\mission-control-php84\php.exe'
$env:US_VALIDATION_EVIDENCE = 'C:\Projeto\Nova pasta\mission-control-plataform\docs\testes-us01-us11\evidencias'
npm run test:integration

# Em python-api:
.\.venv-integration\Scripts\python.exe -m pytest -q -p no:cacheprovider
```

PHP_BINARY é específico desta máquina; em outra máquina precisa indicar PHP >=8.4.1 com SQLite. O runner usa portas 15173, 18000 e 18001 e encerra seus próprios processos. Não depende de credenciais do banco principal. Os logs PHPUnit e a comparação de integridade foram copiados do contêiner. Nenhum token foi armazenado nas evidências.

## 6. Casos de teste desta solicitação

Os identificadores abaixo seguem **esta solicitação de validação**. Alguns IDs têm objetivos diferentes dos documentos de implementação anteriores; a coluna de evidência e a rastreabilidade por método eliminam a ambiguidade.

| ID | História | Objetivo | Resultado esperado | Resultado obtido | Status | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| CT-US01-001 | US01 | Exportar persistidos | CSV com os registros conhecidos | Três conjuntos baixados; IDs/valores conferidos nos testes de feature | Aprovado | backend-final.xml; export-*.csv; e2e.log |
| CT-US01-002 | US01 | Integridade do arquivo | BOM, colunas, escaping e dados consistentes | Parser lê os três arquivos; asserções de Unicode, aspas, quebras, datas, números e fórmulas passam | Aprovado | csv-validacao.json; backend-final.xml |
| CT-US01-003 | US01 | Filtros | Somente interseção dos filtros | Datas limítrofes, satellite_id, mission_id e dataset conferidos | Aprovado | DataExportTest::test_ct_us01_002_filters_dates_ids_and_mission_relationship; backend-final.xml |
| CT-US01-004 | US01 | Sem registros | Resposta compreensível | HTTP 404 com mensagem, exibida na tela | Aprovado | http-e2e.json; us01-sem-registros.png |
| CT-US01-005 | US01 | Inválidos | 422 por campo | Oito cenários parametrizados passam; missão proibida na telemetria rejeitada | Aprovado | backend-final.xml; DataExportTest::invalidFilters |
| CT-US01-006 | US01 | Acesso | Impedir não autenticados | Sem sessão/token inválido retornam 401; Bearer usado pelo cliente | Aprovado | backend-final.xml; frontend-focal.log |
| CT-US01-007 | US01 | Integração | Download real da API pelo React | Três downloads reais com BOM e conteúdo esperado | Aprovado | e2e.log; http-e2e.json; export-*.csv |
| CT-US01-008 | US01 | Banco somente leitura | Sem alterações ou chamadas upstream | Snapshots iguais das quatro tabelas e Http::assertNothingSent | Aprovado | integridade-banco.json; backend-final.xml |
| CT-US11-001 | US11 | Carregar | Limites do satélite correto | GET 200 com padrões/próprios; UI A/B confere valores | Aprovado | backend-final.xml; http-e2e.json; us11-independencia.png |
| CT-US11-002 | US11 | Salvar | Persistir valor autorizado | PUT 200, modelo fresh e GET conferidos | Aprovado | backend-final.xml; us11-salvo.png |
| CT-US11-003 | US11 | Reload | Manter configuração | 75 °C reaparece após reload no Chromium | Aprovado | us11-recarregado.png; e2e.log |
| CT-US11-004 | US11 | Independência | A não altera B | A=75 °C, B=40 °C; retorno a A=75 °C; edição não salva descartada no componente | Aprovado | e2e.log; frontend-focal.log; backend-final.xml |
| CT-US11-005 | US11 | Validar | Rejeitar limites inválidos sem escrita parcial | Inversão, texto, bateria >100%, zero absoluto, campos ausentes e sensor desconhecido rejeitados | Aprovado | backend-final.xml; MonitoringLimitsTest |
| CT-US11-006 | US11 | Aplicação real | Mesma leitura muda de estado | Payload 72 °C resulta warning, normal e critical conforme limites persistidos; leitura e alerta gravados conferidos | Aprovado | backend-final.xml; test_ct005_thresholds_change_same_reading_and_persist_classification |
| CT-US11-007 | US11 | Mesma tela | Detalhes e edição no monitoramento | Capturas reais mostram seção abaixo do cartão de detalhes | Aprovado | us11-salvo.png; us11-recarregado.png |
| CT-US11-008 | US11 | Acesso | Impedir escrita não autorizada | 401 sem sessão; 403 para visitante e conta inativa | Aprovado | backend-final.xml |
| CT-US11-009 | US11 | Comunicação | Exibir erro sem falso salvamento | Falhas de GET/PUT simuladas no adapter; erro visível, retry funciona, cache não assume valor não salvo | Aprovado | frontend-focal.log; monitoring-limits.test.tsx |
| CT-US11-010 | US11 | Regressão | Manter seleção/leituras/estados | E2E seleciona A/B, recebe FastAPI e regressão backend/Python passa | Aprovado no escopo | e2e.log; backend-final.log; python-regressao.log |

## 7. Resultados da US01

Os oito CTs desta solicitação passaram. A exportação não é um mock: arquivos em evidencias/export-*.csv foram baixados pelo Chromium de uma instância Laravel com SQLite de teste. O parser independente confirma UTF-8 BOM, cabeçalhos e quantidade uniforme de colunas. O teste de feature verifica conteúdo contra fixtures persistidas, formatos e proteção de fórmulas. integridade-banco.json registra before/after e equal=true para missões, satélites, leituras e alertas.

Não foi identificado defeito funcional da US01 nesta rodada. Não houve abertura interativa no Excel nem ensaio de exportação muito volumosa ou banco MariaDB isolado. A ausência de registros retorna um 404 previsto pelo contrato, não falha inesperada.

## 8. Resultados da US11

Os dez CTs passaram no escopo implementado, após corrigir D-US11-01. Configurações são persistidas e aplicadas na avaliação, não apenas exibidas. A prova determinística de classificação utiliza um payload upstream controlado de 72 °C, com Laravel e banco de teste reais. O E2E usa o Python real com sensores aleatórios e comprova salvar, recarregar e alternar A/B; não se alega obter duas medições físicas idênticas.

Falhas de comunicação foram simuladas no adapter para verificar a reação do componente, sem interromper a API do usuário. A compatibilidade dos demais fluxos foi exercitada no smoke. Leituras históricas não são recalculadas retroativamente.

## 9. Defeitos e ocorrências

### D-US11-01 — Cache conserva limite anterior após PUT bem-sucedido

- Severidade: média.
- Reprodução: carregar limite 40, editar para 75, salvar com resposta 200 contendo 75 e consultar QueryClient para ['monitoring-limits', satelliteId].
- Esperado: cache acompanha o estado persistido e a confirmação continua visível.
- Observado inicialmente: formulário confirmava salvamento, mas cache ainda continha 40. Evidência: us11-inicial.log (1 falha/3 passes).
- Arquivo: frontend/src/features/monitoring/components/monitoring-limits.tsx.
- Correção localizada: usar a resposta PUT em setQueryData na chave do satélite original. Confirmação foi movida para o componente pai para sobreviver à recriação do formulário quando o cache é atualizado. Não altera contrato da API.
- Reteste: os quatro testes do componente passaram dentro do conjunto focal (26 aprovados), e também na suíte completa. E2E passou após correção e mostra persistência/troca A/B.
- Estado final: corrigido.

### R-REG-01 — Duas falhas em testes preexistentes de missão

- Severidade: média para a confiabilidade da suíte; não há evidência de falha funcional da US01/US11.
- Arquivo: frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx, asserções sobre saveMission.
- Reprodução: npm test ou execução isolada desse arquivo.
- Esperado: spy de saveMission permitir asserções sobre chamadas.
- Observado: `TypeError: [AsyncFunction saveMission] is not a spy or a call to a spy!` em “rejeita os campos obrigatórios vazios sem salvar” e “envia a missão válida e fecha após a confirmação do serviço”.
- Resultado: suíte completa 174 passes/2 falhas; arquivo isolado 4 passes/2 falhas. frontend-completo.log e regressao-missoes.log.
- O arquivo não foi modificado por esta validação. A causa exata do comportamento do mock não foi corrigida ou determinada integralmente; não se afirma comparação executada com um checkout limpo anterior.
- Estado final: aberto para a equipe. Fora do escopo; não bloqueou os CTs solicitados. O fluxo real de missão no E2E passou.

### A-ENV-01 — Fontes externas bloqueadas no navegador

- Severidade: baixa; limitação do ambiente, sem correção de aplicação.
- Google Fonts retorna ERR_NETWORK_ACCESS_DENIED. Capturas usam fallback; não se declara homologação visual completa. browser-errors.json registra URLs e mensagens reais.
- O mesmo arquivo contém 404 esperado da exportação vazia e requisições abortadas durante navegação. Não se declara console sem erros. O runner não registrou exceção JavaScript pageerror; se houvesse, sua asserção final falharia.
- Estado: documentado, sem alteração de rede/dependências.

### A-DEP-01 — Aviso Starlette/httpx

- Severidade: baixa; aviso de depreciação, não falha de teste.
- Evidência: python-regressao.log; 46 testes passam com 1 warning.
- Estado: documentado; dependências não foram alteradas nesta validação.

## 10. Regressão e contagens

| Execução final | Aprovados | Reprovados | Bloqueados no runner | Evidência |
| --- | ---: | ---: | ---: | --- |
| PHPUnit completo | 126 | 0 | 0 | backend-final.log/xml; 830 assertions |
| Vitest completo | 174 | 2 | 0 | frontend-completo.log; 176 testes/28 arquivos |
| Pytest completo | 46 | 0 | 0 | python-regressao.log |
| Total das três suítes | **346** | **2** | **0** | 348 testes; exclui repetições |
| E2E integrado, contabilizado separadamente | 1 fluxo | 0 | 0 | e2e.log |
| Parser CSV, separado | 3 arquivos válidos | 0 | 0 | csv-validacao.json |

O conjunto focal de 26 testes é subconjunto da suíte completa e não foi somado novamente. A execução isolada de missão e o reteste não são novos casos únicos. Os **18 CTs de negócio solicitados (8 US01 + 10 US11) foram executados e aprovados**, com múltiplos métodos/asserções por CT. Isso não significa que os 348 testes gerais sejam todos da US01/US11.

Build Vite + TypeScript e lint ESLint concluíram sem erros. As migrations foram aplicadas automaticamente somente nos bancos descartáveis de teste. Os serviços temporários inicializaram e atenderam o E2E; o runtime principal foi preservado.

## 11. Rastreabilidade por arquivo/método

| História/requisito | CTs desta validação | Teste/inspeção | Evidência/status |
| --- | --- | --- | --- |
| US01 exportar e formatar | 001–002 | DataExportTest::test_ct_us01_001_exports_all_three_persisted_datasets e test_ct_us01_007_csv_round_trips_unicode_quotes_newlines_and_blocks_formulas | backend-final.xml; csv-validacao.json; aprovados |
| US01 filtrar/validar/vazio | 003–005 | DataExportTest::test_ct_us01_002_filters_dates_ids_and_mission_relationship; test_ct_us01_003_empty_datasets_return_a_clear_message; test_ct_us01_004_validates_filters | backend-final.xml; aprovados |
| US01 acesso/integridade | 006/008 | DataExportTest::test_ct_us01_005_requires_authentication; test_ct_us01_006_preserves_all_records_and_does_not_call_upstream | backend-final.xml; integridade-banco.json; aprovados |
| US01 download/UI/erros | 004/007 | frontend/src/features/exports/index.test.tsx; scripts/integration-smoke.mjs | frontend-focal.log; e2e.log; aprovados |
| US11 consulta/salvamento/persistência | 001–004 | MonitoringLimitsTest::test_ct001_defaults_and_missing_satellite e test_ct002_ct004_ct006_save_reload_and_independence; E2E A/B/reload | backend-final.xml; e2e.log; aprovados |
| US11 validação/acesso | 005/008 | MonitoringLimitsTest::test_ct003_invalid_limits_are_atomic; test_ct007_access_control; test_missing_unknown_and_inactive_inputs_are_rejected | backend-final.xml; aprovados |
| US11 avaliação | 006/010 | MonitoringLimitsTest::test_ct005_thresholds_change_same_reading_and_persist_classification; test_ct008_unconfigured_satellite_preserves_legacy_payload; test_boundaries_and_unrelated_alerts_are_preserved | backend-final.xml; aprovados |
| US11 comunicação/seleção/cache | 004/009 | frontend/src/features/monitoring/components/monitoring-limits.test.tsx | us11-inicial.log → frontend-focal.log; corrigido/aprovados |
| US11 posição da seção | 007 | Inspeção de monitoring/index.tsx e captura obtida por E2E | us11-salvo.png; aprovado |

## 12. Limitações e não executados

- Zero CTs solicitados bloqueados. Homologação em Excel desktop, grandes volumes, múltiplos navegadores e testes de carga não foram executados e não entram na contagem dos 18 CTs.
- Não foi criado um MariaDB descartável para repetir todo o conjunto de testes; persistência foi validada em SQLite. migrate:status e versão do cliente MariaDB são inspeções do ambiente, não prova equivalente de CRUD em MariaDB.
- Não foi interrompido/reiniciado o banco principal para testar persistência. Reload real e novas consultas são comprovados; recuperação após desastre/reinício não foi ensaiada.
- A aplicação efetiva dos limites cobre os três sensores implementados nos endpoints Laravel de telemetria. Endpoints independentes de sensores/Python continuam com regras padrão; não se amplia o escopo nesta validação.
- Testes de comunicação usam falhas controladas do adapter; não são ensaio de interrupção física da rede/servidor principal. Não foi ensaiada toda permutação temporal de respostas lentas.
- Exportação é síncrona, utiliza Blob no navegador e não fixa snapshot transacional longo; volume extremo e alterações concorrentes de cadastros não foram homologados.
- Falhas gerais de missão e fontes externas permanecem registradas. Não se declara a plataforma inteira livre de regressões.

## 13. Conclusão técnica

**US01: aprovada tecnicamente no escopo implementado e executado.** Oito CTs passaram, com download real, validação do CSV, filtros, autorização e integridade somente leitura comprovados.

**US11: aprovada tecnicamente no escopo dos três sensores implementados**, após correção do cache. Dez CTs passaram, incluindo persistência, isolamento por satélite, validação, autorização, reação a falhas e aplicação determinística dos parâmetros à telemetria persistida.

**Regressão geral: não integralmente aprovada.** Permanecem duas falhas em testes preexistentes de missão. A equipe deve investigar o mock antes de declarar a suíte completa verde. Os vereditos das histórias não constituem aceite institucional.

## Artefatos e alterações desta validação

- Correção de aplicação: frontend/src/features/monitoring/components/monitoring-limits.tsx.
- Testes adicionados/ampliados: monitoring-limits.test.tsx, backend/tests/Feature/MonitoringLimitsTest.php, backend/tests/Feature/DataExportTest.php (snapshot opcional de integridade).
- Runner: frontend/scripts/integration-smoke.mjs, com coleta opcional por US_VALIDATION_EVIDENCE e seleção A/B.
- Documentação: este relatório, RESUMO_PARA_WORD.md, validar_csv.py e evidencias/.
- Arquivos de implementação ainda não commitados das tarefas anteriores continuam no workspace. Não foram atribuídos a esta rodada como novas funcionalidades.

O manifesto SHA256 em evidencias/manifesto-sha256.json identifica os arquivos de evidência e as fontes selecionadas efetivamente verificadas. Capturas são reais de Chromium; CSVs e dados de integridade vêm de fixtures isoladas, não de telemetria física ou registros privados do usuário.
