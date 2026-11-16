# Matriz de rastreabilidade — Sprint 6

Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho Sprint 6. Histórias US são oficiais da Sprint 1; RT-* são referências técnicas provisórias.

| História oficial | Objetivo resumido fiel ao PDF | Prioridade oficial | Situação/cobertura | Casos |
| --- | --- | --- | --- | --- |
| US01 | Extrair dados para análises | alta | Não implementada como exportação; JSON operacional não comprova extração analítica | — |
| US02 | Visualizar os estados dos satélites | alta | Parcial: frota/estado/monitoramento reais na aplicação; sensores simulados | CT-001/002/003/009/010/015/020 |
| US03 | Receber alertas de falhas | alta | Parcial: geração simulada e persistência; perda de alertas comprovada | CT-005/006/007/008/019/023 |
| US04 | Iniciar uma missão | alta | Implementada e tecnicamente verificada; sem aceite formal | CT-010/017 |
| US05 | Analisar trajetória orbital e rota planejada | alta | Parcial: posição SGP4/circular; sem comparação com rota planejada | CT-020/022 |
| US06 | Gerar relatórios das missões | média | Sem gerador/exportação de relatório operacional | — |
| US07 | Cadastrar usuários autorizados | média | Criação por gerente; sem CRUD completo de usuários | CT-010/018 |
| US08 | Definir prioridades para ocorrências | alta | Severidade calculada e tipo urgency não equivalem à priorização configurável da história | — |
| US09 | Agendar missões | média | Implementação de datas, vínculo e estado; validação técnica parcial | CT-004/010/016/017/026 |
| US10 | Enviar comandos aos satélites | alta | Somente demonstração local; controle real está fora do escopo declarado pelo README | — |
| US11 | Configurar parâmetros de monitoramento | alta | Limiares fixos no código; sem configuração pelo usuário | — |
| US12 | Receber telemetria em tempo real | alta | Parcial: polling e geração simulada; sem medição física nem Socket.IO | CT-007/010/019/020/023/035 |
| US13 | Controlar níveis de acesso | alta | Sanctum e papéis em operações específicas; granularidade de missões/ordens ainda limitada | CT-011/012/018 |
| US14 | Calcular indicadores de missões | média | Dashboard deriva indicadores; cálculo numérico sem teste específico nesta sprint | — |
| US15 | Registrar componentes dos satélites | baixa | Sem inventário persistente de componentes/sensores configuráveis | — |
| US16 | Verificar qualidade de sinal | alta | Consulta SatNOGS implementada; não fornece dBm/SNR contínuos; sem validação ao vivo | CT-033 (não executado) |
| US17 | Registrar eventos de missões | média | Parcial: comentários e timestamps; sem módulo geral de eventos validado | CT-016 |
| US18 | Aprovar serviços de reparo | média | CRUD de ordens existe; sem fluxo específico de aprovação por supervisor | — |
| US19 | Encerrar uma missão | média | Transição para Concluída e timestamps verificados | CT-017 |
| US20 | Acompanhar custos das missões | baixa | Parcial: orçamento decimal; sem despesas/contabilidade de custos efetivos | CT-016 |


| Módulo | Funcionalidade | Arquivos relativos à raiz | História | Implementação | Riscos | Testes existentes/adicionados |
| --- | --- | --- | --- | --- | --- | --- |
| Autenticação/usuários | Login, Bearer, logout, cadastro por gerente, recuperação temporária | backend/routes/api.php; app/Http/Controllers/Api/*.php; frontend/src/lib/{api,auth}.ts; stores/auth-store.ts | US07/US13 | Implementado parcialmente: não há listagem/edição/exclusão real de usuários; recuperação sem entrega de e-mail | Tokens anteriores à desativação/reset não são revogados automaticamente; política de acesso limitada | AuthAccessTest; EnvironmentTest; api/auth-store/login/logout/forgot tests |
| Satélites | CRUD manual e importação/busca CelesTrak; paginação | backend/app/Http/Controllers/SatelliteController.php; Models/Satellite.php; frontend/src/features/monitoring | US02 | Implementado; integração externa dependente de rede | Exclusão referenciada pode resultar 500; fonte manual e NORAD têm semânticas distintas | SatelliteCrudTest; SatelliteTest; SprintSixTest |
| Missões | CRUD, comentário, lote, datas, orçamento, ciclo de vida | backend/app/Http/Controllers/MissionController.php; Models/Mission.php; MissionComment.php; frontend/src/features/tasks | US04/US09/US17/US19/US20 | Implementado parcialmente; operador é texto livre; orçamento não é contabilidade | FK restrict; confirmação de reabertura/exclusão; critérios de papéis não granulares | MissionApiTest; MissionPersistenceTest; drawer; E2E |
| Monitoramento | Posição, sensores, leituras e lista de posições | backend/app/Services/SatelliteMonitoringService.php; Http/Controllers/SatelliteMonitoringController.php; frontend/src/features/monitoring | US02/US05/US12 | Implementado; globo ilustrativo; sensores simulados | Dependência FastAPI; posição pode ser null sem impedir leitura | SatelliteMonitoringTest; OrbitControllerTest; E2E |
| Telemetria/alertas | Persistência, sincronização e resolução de alertas | backend/app/Services/TelemetryRecorder.php; Models/{TelemetryReading,SatelliteAlert}.php; SatelliteTelemetryController.php | US03/US12 | Implementado com defeito de colisão em código de alerta | Perda de parâmetros distintos do mesmo código; payload upstream validado apenas parcialmente | SatelliteTelemetryControllerTest; SprintSixTest CT-005 |
| Unidades | Catálogo de 15 parâmetros e símbolos | backend/app/Telemetry/TelemetryUnitCatalog.php; TelemetryUnitController.php | RT-UNIDADES provisória | Implementado como metadados; não há conversor | Chaves do catálogo e sensores não são idênticas; consumidores devem mapear | TelemetryUnitCatalogTest; TelemetryUnitsTest |
| Órbitas Python | SGP4 TLE/OMM, ECI/TEME e conversão geodésica; circular simulada | python-api/app/services/{orbit_service,orbit_simulation_service,geodetic_service,celestrak_service}.py; schemas/orbit.py; api/v1/orbits.py; routers/orbits.py | US05 | Implementado; não verifica rota planejada | TLE antigo de fixture só serve para época do teste; sem perturbações na circular | test_orbits; test_orbit_simulation |
| Sensores Python | Geração aleatória, avaliação por limiar, snapshot consistente | python-api/app/services/{sensor_service,alert_service,telemetry_service}.py; schemas/; api/v1/ | US03/US12 | Implementado e explicitamente simulado | Sem hardware; sem configuração dos limiares pelo usuário | test_sensors; test_alerts; test_sprint6 |
| NASA | DONKI FLR/GST/CME, datas e erros | backend/app/Services/Integrations/NasaDonkiService.php; NasaEventController.php; routes/api.php | RT-NASA provisória | Backend implementado; integração ao vivo não executada | Rede/quota/credencial pública; testes usam Http::fake | NasaIntegrationTest |
| Recepção | Última observação pública SatNOGS | backend/app/Http/Controllers/SatelliteController.php::reception; frontend/src/features/dashboard; monitoring/index.tsx | US16 | Implementado parcialmente; recepção esporádica não mede saúde | Serviço externo sem ensaio ao vivo; sem dBm/SNR contínuos | Sem teste específico de recepção encontrado |
| Ordens de serviço | CRUD, associação missão/satélite/alerta, soft delete | backend/app/Http/Controllers/ServiceOrderController.php; Models/ServiceOrder.php; migrations/2026_11_10* | US18 parcial; RT-OS provisória | Backend implementado; sem fluxo de aprovação por supervisor demonstrado | FK restrict; sem política por papel específica | ServiceOrderTest |
| Dashboard | Frota, missões, orçamento e avisos derivados de consultas | frontend/src/features/dashboard/index.tsx; components/overview.tsx; recent-sales.tsx | US02/US14/US20 parcial | Implementado; E2E verifica presença dos dados, não fórmulas financeiras | Chunk grande e dependências de fontes externas | E2E; sem asserção numérica específica de KPI |
| Comunicações e templates | Console, chats, apps, configurações e painéis legados | frontend/src/features/communications; userscopy/components; users/components; chats; apps; settings | US10 apenas demonstração | Demonstrações ou template; gestão oficial usa users/management.tsx | Fixtures não comprovam banco; 40 falhas legadas | Vitest herdado; componentes mockados |
| Planejados | Exportação, relatórios, inventário, estações persistidas, configuração e aprovação | README.md; SPRINT 1/SPRINT 1 - entrega 1.docx.pdf | US01/US06/US08/US11/US15/US18 | Não implementados integralmente; sem endpoints equivalentes localizados | Não atribuir aceite a requisitos ausentes | Sem validação funcional completa |
| Infraestrutura | Laravel/PHP-FPM + nginx + FastAPI + MariaDB | compose.yaml; docker/php/dockerfile; python-api/Dockerfile; docker/nginx/default.conf | RT-AMBIENTE provisória | Compose usa mariadb:11.4 (README cita MySQL); sem frontend no Compose | Volume mission_control_db_data é persistente; não usar para testes destrutivos | SQLite e E2E aprovados parcialmente; Docker bloqueado |


| História | Módulo/objetivo | Casos | Arquivo automatizado ou roteiro | Resultados |
| --- | --- | --- | --- | --- |
| US01 | Extrair dados para análises | — |  | Não implementada como exportação; JSON operacional não comprova extração analítica |
| US02 | Visualizar os estados dos satélites | CT-001/002/003/009/010/015/020 | backend/tests/Feature/SprintSixTest.php::test_ct001_altitude_limits | Parcial: frota/estado/monitoramento reais na aplicação; sensores simulados |
| US03 | Receber alertas de falhas | CT-005/006/007/008/019/023 | backend/tests/Feature/SprintSixTest.php::test_ct005_alerts_with_same_code_preserve_each_parameter | Parcial: geração simulada e persistência; perda de alertas comprovada |
| US04 | Iniciar uma missão | CT-010/017 | frontend/scripts/integration-smoke.mjs | Implementada e tecnicamente verificada; sem aceite formal |
| US05 | Analisar trajetória orbital e rota planejada | CT-020/022 | backend/tests/Feature/SatelliteMonitoringTest.php; OrbitControllerTest.php | Parcial: posição SGP4/circular; sem comparação com rota planejada |
| US06 | Gerar relatórios das missões | — |  | Sem gerador/exportação de relatório operacional |
| US07 | Cadastrar usuários autorizados | CT-010/018 | frontend/scripts/integration-smoke.mjs | Criação por gerente; sem CRUD completo de usuários |
| US08 | Definir prioridades para ocorrências | — |  | Severidade calculada e tipo urgency não equivalem à priorização configurável da história |
| US09 | Agendar missões | CT-004/010/016/017/026 | backend/tests/Feature/SprintSixTest.php::test_ct004_invalid_bulk_is_atomic | Implementação de datas, vínculo e estado; validação técnica parcial |
| US10 | Enviar comandos aos satélites | — |  | Somente demonstração local; controle real está fora do escopo declarado pelo README |
| US11 | Configurar parâmetros de monitoramento | — |  | Limiares fixos no código; sem configuração pelo usuário |
| US12 | Receber telemetria em tempo real | CT-007/010/019/020/023/035 | python-api/tests/test_sprint6.py::test_ct007_telemetry_alerts_match_returned_sensors | Parcial: polling e geração simulada; sem medição física nem Socket.IO |
| US13 | Controlar níveis de acesso | CT-011/012/018 | frontend/src/lib/api.test.ts | Sanctum e papéis em operações específicas; granularidade de missões/ordens ainda limitada |
| US14 | Calcular indicadores de missões | — |  | Dashboard deriva indicadores; cálculo numérico sem teste específico nesta sprint |
| US15 | Registrar componentes dos satélites | — |  | Sem inventário persistente de componentes/sensores configuráveis |
| US16 | Verificar qualidade de sinal | CT-033 (não executado) |  | Consulta SatNOGS implementada; não fornece dBm/SNR contínuos; sem validação ao vivo |
| US17 | Registrar eventos de missões | CT-016 | backend/tests/Feature/MissionApiTest.php (métodos de CRUD, comentários, lote e orçamento) | Parcial: comentários e timestamps; sem módulo geral de eventos validado |
| US18 | Aprovar serviços de reparo | — |  | CRUD de ordens existe; sem fluxo específico de aprovação por supervisor |
| US19 | Encerrar uma missão | CT-017 | backend/tests/Feature/MissionApiTest.php (métodos de ciclo de vida) | Transição para Concluída e timestamps verificados |
| US20 | Acompanhar custos das missões | CT-016 | backend/tests/Feature/MissionApiTest.php (métodos de CRUD, comentários, lote e orçamento) | Parcial: orçamento decimal; sem despesas/contabilidade de custos efetivos |


Inventário por método/parametrização: [INVENTARIO_AUTOMATIZADO.csv](INVENTARIO_AUTOMATIZADO.csv). Os resultados executados estão no relatório principal e na tabela a seguir.

| CT | História | Arquivo | Resultado |
| --- | --- | --- | --- |
| CT-001 | US02 | backend/tests/Feature/SprintSixTest.php::test_ct001_altitude_limits | passou |
| CT-002 | US02 | backend/tests/Feature/SprintSixTest.php::test_ct002_pagination_limits | passou |
| CT-003 | US02/US09 | backend/tests/Feature/SprintSixTest.php::test_ct003_missing_records_return_404 | passou |
| CT-004 | US09 | backend/tests/Feature/SprintSixTest.php::test_ct004_invalid_bulk_is_atomic | passou |
| CT-005 | US03 | backend/tests/Feature/SprintSixTest.php::test_ct005_alerts_with_same_code_preserve_each_parameter | falhou |
| CT-006 | US03 | python-api/tests/test_sprint6.py::test_ct006_alert_boundaries | passou |
| CT-007 | US03/US12 | python-api/tests/test_sprint6.py::test_ct007_telemetry_alerts_match_returned_sensors | passou |
| CT-008 | US03 | python-api/tests/test_sprint6.py::test_ct008_communication_decision_table | passou |
| CT-009 | US02 | frontend/src/lib/meter-color.test.ts | passou |
| CT-010 | US02/US04/US07/US09/US12/US13 | frontend/scripts/integration-smoke.mjs | passou |
| CT-011 | US13 | frontend/src/lib/api.test.ts | passou |
| CT-012 | US13 | frontend/src/stores/auth-store.test.ts; features/auth/sign-in; features/auth/forgot-password; components/sign-out-dialog.test.tsx; lib/*.test.ts (exceto api/meter) | passou |
| CT-013 | Referência técnica provisória RT-BUILD | frontend/package.json; tsconfig*.json | passou |
| CT-014 | Referência técnica provisória RT-LINT | frontend/eslint.config.js | passou |
| CT-015 | US02/US13 | backend/tests/Feature/SatelliteCrudTest.php; SatelliteTest.php | passou |
| CT-016 | US09/US17/US20 | backend/tests/Feature/MissionApiTest.php (métodos de CRUD, comentários, lote e orçamento) | passou |
| CT-017 | US04/US09/US19 | backend/tests/Feature/MissionApiTest.php (métodos de ciclo de vida) | passou |
| CT-018 | US07/US13 | backend/tests/Feature/AuthAccessTest.php | passou |
| CT-019 | US03/US12 | backend/tests/Feature/SatelliteTelemetryControllerTest.php; SatelliteSensorControllerTest.php | passou |
| CT-020 | US02/US05/US12 | backend/tests/Feature/SatelliteMonitoringTest.php; OrbitControllerTest.php | passou |
| CT-021 | Referência técnica provisória RT-NASA | backend/tests/Feature/NasaIntegrationTest.php | passou |
| CT-022 | US05 | python-api/tests/test_orbits.py; test_orbit_simulation.py | passou |
| CT-023 | US03/US12 | python-api/tests/test_sensors.py; test_alerts.py | passou |
| CT-024 | Referência técnica provisória RT-UNIDADES | backend/tests/Unit/TelemetryUnitCatalogTest.php; backend/tests/Feature/TelemetryUnitsTest.php | passou |
| CT-025 | Referência técnica provisória RT-OS | backend/tests/Feature/ServiceOrderTest.php | passou |
| CT-026 | US09 | backend/tests/Feature/SatelliteMissionMigrationTest.php; MissionPersistenceTest.php | passou |
| CT-027 | Referência técnica provisória RT-SMOKE | backend/tests/Feature/EnvironmentTest.php; TelemetryUnitsTest.php; ExampleTest.php; backend/tests/Unit/ExampleTest.php; python-api/tests/test_health.py | passou |
| CT-028 | US01–US20 | docs/sprint-6/MATRIZ_RASTREABILIDADE.md | passou |
| CT-029 | US02/US09/US12 | compose.yaml; docker/; backend/database/migrations | bloqueado |
| CT-030 | US09; RT-REGRESSAO provisória para templates | frontend/src/components/*.test.tsx; context/*.test.tsx; hooks/*.test.ts; features/users*/components/*.test.tsx; features/tasks/components/*.test.tsx; features/auth/sign-up/components/*.test.tsx | falhou |
| CT-031 | US02/US09 | Roteiro manual neste caso | não executado |
| CT-032 | US02/US09/US13 | Roteiro manual; frontend/scripts/integration-smoke.mjs como referência de passos | não executado |
| CT-033 | US05/US16; RT-NASA provisória | backend/app/Services/Integrations; SatelliteController::reception | não executado |
| CT-034 | US01–US20 | Modelo Word não disponível no repositório; estrutura fornecida na solicitação | não executado |
| CT-035 | US12; RT-DESEMPENHO provisória | docs/sprint-6/medir_telemetria.py | passou |

