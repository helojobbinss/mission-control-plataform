## IDENTIFICAÇÃO

Equipe (confirmada na Sprint 1 e no README): Heloisa Jobbins Scheffer — backend; Iryane Karolyne Ienke — frontend; Maria Dalapria — Scrum Master assistente e documentação; Rafael Krachinski Seixas — QA e backend; Thauany Favarin Mainardes — QA e frontend; William Galvão — Scrum Master.

Sistema: **Mission Control Platform**, plataforma acadêmica web para cadastro de satélites e missões, acompanhamento orbital e telemetria simulada, com Laravel, React/TypeScript e FastAPI. A Sprint 1 utiliza o nome anterior Space Monitoring System. Disciplina Experiência Profissional: Fábrica de Software, Engenharia de Software, UniCesumar; professor Lucas Martini Sargentim, conforme solicitação. Esta execução foi conduzida pelo agente de desenvolvimento a pedido do usuário; a participação da equipe em sessões de teste não foi presumida.

Versão: frontend 2.2.1; backend sem versão de produto própria no manifesto. Commit inicial e HEAD final: `3799ff303c9158f36bcb28bf89103baba899d087`. Branch: `sprint-6/testes-validacao-documentacao`, criada a partir da main local limpa. Não houve fetch, merge, commit ou push; não foi presumida igualdade com main remota. Os testes novos e documentos ainda não integram um commit: a revisão deve considerar HEAD **mais a árvore de trabalho**. O inventário SHA256 permite identificar os arquivos efetivamente entregues.

Data de execução: **15/11/2026**, fuso America/Sao_Paulo (UTC−03:00). Os horários exatos de cada comando estão nos logs, sem datas retroativas. Consolidação: 2026-11-15T21:39:33.844677-03:00.

Documento para transcrição ao Word, seguindo os títulos fornecidos. O arquivo Word institucional não estava disponível para inspeção, portanto não se afirma validação de campos adicionais desse arquivo. Documento em revisão, sem aprovação institucional ou aceite formal.

## 1. PLANO DE TESTE

### 1.1 CONTEXTO E ESCOPO

O objetivo dos testes é verificar comportamentos efetivos, persistência e contratos entre componentes, identificar falhas e produzir evidências reproduzíveis. O objetivo da aplicação é centralizar informações operacionais de satélites e missões. Foram inspecionados manifestos, locks, Compose, rotas web/API, controllers, serviços, models, migrations, clientes HTTP, telas e testes existentes. A rota web `/` entrega welcome; a interface React roda separadamente via Vite. `python-api/` é serviço efetivo de cálculo orbital SGP4, conversão geodésica, simulação circular e geração/avaliação de sensores, não apenas um proxy. O Compose possui app PHP-FPM, nginx, python-api e **MariaDB 11.4**, com volume persistente; não inclui frontend nem Socket.IO.

Incluídos: cadastro/consulta/validação de satélites, missões e relacionamentos; ciclo de missão; comentários/orçamento; autenticação/autorização implementada; leituras e alertas; catálogo de unidades; ordens de serviço; órbitas; contratos de serviços externos com substituições controladas; fluxo real React→Laravel→SQLite e Laravel→FastAPI; compilação, revisão estática, smoke e regressão. O catálogo descreve unidades: não existe conversor genérico a ser testado. A conversão ECI/TEME→coordenadas geodésicas é parte do serviço orbital e tem testes próprios.

Excluídos da execução funcional completa: APIs públicas ao vivo, MariaDB/Docker por bloqueio, hardware espacial, envio real de comandos, Socket.IO/N2YO, exportação de relatórios, inventário e aprovação de reparos sem implementação completa; testes de carga, pentest e auditoria exaustiva de acessibilidade. Compatibilidade adicional e avaliação humana têm roteiros sem execução. Mocks de NASA/CelesTrak/Python validam contratos locais, jamais a disponibilidade desses serviços. A telemetria e as comunicações demonstrativas não constituem medições ou comandos físicos.

Documentos encontrados: `SPRINT 1/SPRINT 1 - entrega 1.docx.pdf`, README e três documentos em docs (integration-baseline, frontend-integration, telemetry-units). **Não foram encontrados documentos das Sprints 2 a 5**, nem critérios de aceite formalizados por história no material disponível. Foi lido o PDF inteiro; a extração textual integral está em `evidencias/sprint-1-extraida.txt`. Seus identificadores oficiais são US01 a US20: a tabela abaixo resume fielmente seus objetivos, sem criar histórias. Referências RT-* são provisórias da auditoria para aspectos técnicos sem história própria, e não requisitos atribuídos à equipe.


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

Matriz de auditoria da implementação:

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


Riscos de produto: perda de alertas simultâneos; falha de integridade na persistência e vínculos; permissões insuficientemente granulares; tratamento 500 de exclusão referenciada; token anterior permanecer após desativação ou redefinição de senha (observação estática, não validada dinamicamente nesta sprint); inconsistência entre sensores e alertas; dependência de fontes orbitais; falhas de payload/HTTP; contratos divergentes entre frontend e backend. Riscos de projeto: ferramentas/dependências ausentes, infraestrutura Docker não preparada, documentação desatualizada e regressão de templates com falsos negativos. As exclusões e esses riscos impedem extrapolar aprovações locais para operação real de satélites.

Referência metodológica: adaptação acadêmica das descrições públicas da [ISO/IEC/IEEE 29119-2:2021](https://www.iso.org/standard/79428.html), para processos; [29119-3:2021](https://www.iso.org/standard/79429.html), para documentação; e [29119-4:2021](https://standards.ieee.org/ieee/29119-4/7500/), para técnicas. Consultadas em 15/11/2026. Não foi adquirido o texto integral; este trabalho não declara certificação ou conformidade normativa integral.

### 1.2 ESTRATÉGIAS


| Nível | Tipo | Técnicas e justificativa | Ferramentas |
| --- | --- | --- | --- |
| Unidade | Funcional e segurança do cliente | Partições válidas/inválidas; fronteiras reais do código; decisões de alertas e cores; isolar algoritmos | PHPUnit; pytest; Vitest |
| Integração | Persistência, contrato, confiabilidade | Laravel e SQLite reais; FastAPI TestClient real; fronteiras externas mockadas explicitamente; tabelas de decisão para erro e papéis | PHPUnit/RefreshDatabase; pytest/TestClient; Http::fake/Mockery/monkeypatch |
| Sistema | Fluxo completo e smoke | Cenário no Chromium com React, Laravel, FastAPI e SQLite temporário; transição de estados de sessão/missão | Playwright; runner integration-smoke.mjs |
| Aceitação | Verificação técnica derivada e roteiro humano | Relacionar histórias a cenários executáveis; aceite humano separado em CT-034, sem assinatura presumida | E2E e matrizes; roteiro manual pendente |
| Estático/não funcional | Tipos, regras, compatibilidade e latência exploratória | Build/ESLint; inspeção; 20 requisições em processo, sem SLA ou concorrência | TypeScript/Vite; ESLint; perf_counter/TestClient |


Smoke: CT-027 (rotas, inicialização, isolamento SQLite e health) e CT-010 (fluxo integrado). Regressão: suítes completas preservadas, inclusive testes de demonstração que falham. Reteste: somente o reparo da infraestrutura de formulário e preparação foi seguido de nova execução; INC-001 permanece sem correção, portanto sua repetição é confirmação da falha, não reteste de correção. O plano não define limiares de negócio ausentes. Cobertura de instruções/decisões não foi instrumentada; fronteiras e ramos exercitados não equivalem a percentual de cobertura.

### 1.3 DADOS E AMBIENTE

Windows, PowerShell 5.1.26100.9711, sistema 64 bits; PHP CLI 8.5.12 (ZTS), Laravel 12.71.0, Sanctum 4.3.3 e PHPUnit 11.5.57 do composer.lock. PDO SQLite disponível; extensões mbstring, DOM/XML, curl e openssl verificadas. Node portátil oficial 24.22.3; react 19.3.0, typescript 6.0.3, vite 8.3.3, vitest 4.1.11, playwright 1.59.1. Python 3.13.18 em ambiente virtual local, FastAPI 0.162.0, pytest 8.4.2, Pydantic 2.14.2, sgp4 2.27, skyfield 1.55 e demais pins de requirements.txt. Chromium 147.0.7727.15 (Playwright build 1217), desktop headless; nenhum dispositivo móvel ou outro navegador efetivamente utilizado. A consulta CIM ao nome comercial do Windows recebeu acesso negado; a edição do SO não é inferida.

PHPUnit força APP_ENV=testing, DB_CONNECTION=sqlite, DB_DATABASE=:memory:, DB_URL e DATABASE_URL vazios; cache/sessão em array e fila síncrona. RefreshDatabase atua só nesse banco. O E2E cria SQLite em diretório temporário próprio, verifica portas livres, sobe processos próprios e os encerra ao concluir. Nenhum banco de desenvolvimento/produção foi migrado, limpo ou alterado. Não foi usado o volume persistente do Compose.

Dados fictícios: nomes QA, satélite manual e missão Smoke, e-mails @example.test, IDs de fixture; TLEs públicos locais usados apenas em suas épocas de referência. Datas fixas nos testes são entradas fictícias, não datas de execução. Credenciais de fixture permanecem apenas no código e memória; tokens emitidos não foram gravados nos documentos. Nenhuma credencial pessoal, serviço pago ou integração física foi utilizada. O benchmark usa sensores aleatórios reais do simulador e verifica apenas consistência; resultados variam por execução.

Preparação: Composer inicialmente bloqueado por rede do sandbox e ZIP desabilitado; instalado com extensão ZIP habilitada somente no processo. Node foi baixado de nodejs.org e seu ZIP conferido contra SHASUMS256 oficial; Python existente foi localizado fora do PATH e usado em .venv. Cache do uv/npm e navegadores ficam em .tools ignorado pelo Git. A execução de scripts PowerShell foi liberada apenas no processo. Tentativas pré-capturador e suas limitações estão em evidencias/preparacao.md. Não houve alteração em arquivos de produção ou locks.

O capturador salva comando, diretório, ambiente, data/hora, SHA base, saída textual e código de retorno. O PowerShell pode representar linhas vazias de stderr como RemoteException; os relatórios JSON/JUnit preservam resultados estruturados. Os logs iniciais com rótulos BASE referem-se às suítes anteriores aos novos testes de PHP/Python; o frontend inicial já inclui as seis novas instâncias de cor. Inventário de testes e mapeamento de cada instância para CT constam na seção 6.

### 1.4 CRITÉRIOS

Entrada: checkout identificado, leitura do código e histórias disponíveis, isolamento de banco verificado, dependências compatíveis e dados fictícios. Priorização: casos de dados, autenticação e telemetria com prioridade alta; ferramentas estáticas e observações de desempenho com prioridade média.

Conclusão proposta: todos os casos críticos executados e aprovados, nenhum incidente crítico aberto, evidências de toda execução e regressão viável concluída. Severidades operacionais são alta/média/baixa; para a decisão de liberação, defeito alto em integridade é tratado como crítico. Sem considerar apenas a contagem de testes, CT-005 é impeditivo. Aceite institucional requer confirmação humana em CT-034.

Suspender: banco sem isolamento comprovado, risco de escrita em dados reais, segredo em evidências, dependência que impeça inicialização ou porta ocupada no E2E. Retomar: corrigir a pré-condição, registrar a mudança, reexecutar smoke e testes afetados. Bloqueio específico de Docker suspende CT-029, sem impedir SQLite e demais suítes independentes. Falhas funcionais reprodutíveis são registradas, não removidas nem convertidas em aprovação.

## 2. ESPECIFICAÇÃO DE CASOS DE TESTE

Os 35 CT são cenários do plano. Um CT pode ter múltiplos métodos/parametrizações, identificados individualmente no inventário automatizado. Um cenário é reprovado se qualquer instância associada falhar. As instâncias dos frameworks são contabilizadas separadamente; não se somam reexecuções às métricas de casos. Histórias associadas têm cobertura técnica parcial, nunca aceite integral implícito.

| ID | História | Objetivo | Prioridade | Técnica e justificativa | Entradas e passos | Resultado esperado |
| --- | --- | --- | --- | --- | --- | --- |
| CT-001 | US02 | Validar e persistir as fronteiras da altitude manual | alta | Valores limite: quatro pontos em torno dos limites do controller | Nome QA fictício; source=manual; inclinação=0; altitude=159,99/160/40000/40000,01 km; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter test_ct001; comparar as asserções e a saída com o esperado. | HTTP 422/201/201/422; nenhum registro nas rejeições |
| CT-002 | US02 | Validar os limites de paginação | alta | Valores limite: mínimo 1 e máximo 100 encontrados no código | per_page=0/1/100/101; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter test_ct002; comparar as asserções e a saída com o esperado. | HTTP 422/200/200/422 |
| CT-003 | US02/US09 | Tratar identificadores inexistentes sem consultar serviços externos | alta | Particionamento: identificadores existentes versus ausentes | GET satellites/999999, missions/999999, service-orders/999999; operador autenticado; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter test_ct003; comparar as asserções e a saída com o esperado. | HTTP 404 nos três endpoints |
| CT-004 | US09 | Evitar atualização parcial de um lote inválido | alta | Tabela de decisão: lote com todos os IDs válidos versus um ausente | Uma missão Agendada; ids=[id,999999]; action=operator; value=QA alterado; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter test_ct004; comparar as asserções e a saída com o esperado. | HTTP 422; operator_name original permanece null |
| CT-005 | US03 | Preservar alertas simultâneos de parâmetros distintos | alta | Particionamento: mesmo código com parâmetros distintos revela colisão | HIGH_ANGULAR_VELOCITY em gyroscope_x e gyroscope_y; 4,9 °/s; instante fictício 2026-01-01 UTC; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter test_ct005; comparar as asserções e a saída com o esperado. | Dois alertas abertos, um por eixo (critério de integridade proposto pela auditoria) |
| CT-006 | US03 | Validar comparadores estritos dos limiares de simulação | alta | Valores limite: abaixo, igual e acima de constantes efetivas | 14 combinações: bateria 19,99/20/20,01; temperatura 39,99/40/40,01; tensão 24,99/25/31/31,01; giro X -4,51/-4,5/4,5/4,51; Na raiz do repositório, entrar no diretório indicado no comando; executar cd python-api; .venv/Scripts/python.exe -m pytest tests/test_sprint6.py -k ct006 -v; comparar as asserções e a saída com o esperado. | Alerta somente nas partições fora dos limiares; 14 instâncias aprovadas |
| CT-007 | US03/US12 | Confirmar que os alertas correspondem aos sensores retornados na mesma leitura | alta | Consistência entre componentes: recalcular alertas sobre a leitura efetiva | get_satellite_telemetry(5); gerador real aleatório, sem mocks; Na raiz do repositório, entrar no diretório indicado no comando; executar cd python-api; .venv/Scripts/python.exe -m pytest tests/test_sprint6.py -k ct007 -v; comparar as asserções e a saída com o esperado. | Mesma contagem, parâmetros, valores e timestamps ao reavaliar a leitura |
| CT-008 | US03 | Distinguir estado normal, perda e valor inválido | alta | Tabela de decisão: três estados do algoritmo | online/offline/unknown; demais sensores controlados; Na raiz do repositório, entrar no diretório indicado no comando; executar cd python-api; .venv/Scripts/python.exe -m pytest tests/test_sprint6.py -k ct008 -v; comparar as asserções e a saída com o esperado. | Nenhum alerta de comunicação / COMMUNICATION_LOST / SENSOR_FAILURE |
| CT-009 | US02 | Apresentar a cor correta nas fronteiras implementadas | alta | Valores limite: decisões <30 e <70 | 0/29,99/30/69,99/70/100; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm test -- src/lib/meter-color.test.ts; comparar as asserções e a saída com o esperado. | Vermelho/vermelho/amarelo/amarelo/verde/verde; seis instâncias |
| CT-010 | US02/US04/US07/US09/US12/US13 | Validar o fluxo integrado no navegador com serviços reais | alta | Transição de estados e cenário de uso: sessão ausente, autenticada e encerrada; missão Agendada→Ativa | manager@example.test; satélite Smoke Manual; missão Smoke Mission; SQLite temporário exclusivo; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm run test:integration; comparar as asserções e a saída com o esperado. | Guard redireciona; login; cadastro; telemetria FastAPI; criar/editar/iniciar missão; dashboard; restauração após recarga; criar operador; logout |
| CT-011 | US13 | Preservar Bearer, paginação, payload e distinção entre erros HTTP | alta | Particionamento: sucesso e classes 401/403/404/422/500; destino de redirecionamento permitido versus externo | Adaptador Axios controlado; duas páginas; login/missão e mensagens de erro; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm test -- src/lib/api.test.ts; comparar as asserções e a saída com o esperado. | Nove testes de contrato aprovados; sem alegar integração HTTP real |
| CT-012 | US13 | Verificar sessão, login, saída, recuperação e funções auxiliares | alta | Particionamento: sessão presente/ausente e sucesso/erro; fixtures e mocks locais | auth-store, login/logout/forgot, cookies e helpers existentes; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm test; comparar as asserções e a saída com o esperado. | Todos os testes dos arquivos associados aprovados; recuperação não comprova envio de e-mail |
| CT-013 | Referência técnica provisória RT-BUILD | Compilar Vite e TypeScript sem erros | média | Análise estática: verificar sintaxe, tipos e empacotamento | npm run build; configuração e lock atuais; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm run build; comparar as asserções e a saída com o esperado. | Código zero; build e tsc aprovados; aviso de chunk grande registrado |
| CT-014 | Referência técnica provisória RT-LINT | Executar as regras estáticas configuradas | média | Análise estática por regras do ESLint | npm run lint; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm run lint; comparar as asserções e a saída com o esperado. | Zero erros; um aviso Fast Refresh registrado |
| CT-015 | US02/US13 | Validar CRUD, obrigatoriedade, identidade e permissões | alta | Partições e valores limite: manual/CelesTrak; NORAD duplicado; gerente/operador/analista/sem papel | Fixtures de SatelliteCrudTest e SatelliteTest; serviços CelesTrak mockados; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter "SatelliteCrudTest\|SatelliteTest"; comparar as asserções e a saída com o esperado. | Cadastro/consulta/edição/exclusão permitidos; entradas inválidas e papéis inadequados rejeitados |
| CT-016 | US09/US17/US20 | Validar criação, listagem, edição, comentários, lote e orçamento | alta | Particionamento e valores limite: status, orçamento regex e datas encontrados no controller | Fixtures MissionApiTest; orçamento com até 10 inteiros e 2 decimais; associação com satélite existente; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter MissionApiTest; comparar as asserções e a saída com o esperado. | Persistência e envelopes corretos; entradas fora das regras recebem 422; comentários isolados |
| CT-017 | US04/US09/US19 | Verificar início, conclusão, aborto e confirmação de reabertura/exclusão | alta | Transição de estados e tabela de decisão: Agendada/Ativa/Concluída/Abortada | Métodos lifecycle, period, finished, completed e bulk_status de MissionApiTest; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter MissionApiTest; comparar as asserções e a saída com o esperado. | Transições e timestamps correspondem ao estado; confirmações exigidas pelo código |
| CT-018 | US07/US13 | Validar token, conta inativa no login, papel gerente e recuperação em produção | alta | Tabela de decisão: credencial, atividade e papel do usuário | Usuários fictícios por factory; contas ativa/inativa; gerente/operador; ambiente production somente dentro do teste; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter AuthAccessTest; comparar as asserções e a saída com o esperado. | Token funciona; logout remove token; inativo não entra; apenas gerente cadastra; token de recuperação não exposto em produção |
| CT-019 | US03/US12 | Persistir leituras, atualizar/resolver alertas e tratar indisponibilidade | alta | Partições: resposta válida, payload inválido, HTTP upstream, conexão ausente e CelesTrak indisponível | Http::fake/Mockery nos serviços externos; SQLite em memória real; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter "SatelliteTelemetryControllerTest\|SatelliteSensorControllerTest"; comparar as asserções e a saída com o esperado. | Dados persistem; alertas resolvem; 502/503 conforme código; falha orbital não impede leitura |
| CT-020 | US02/US05/US12 | Escolher fonte manual/CelesTrak e isolar falhas por satélite | alta | Tabela de decisão: source manual versus celestrak; serviço disponível/indisponível | SQLite real; respostas Python substituídas por Http::fake; satélite inexistente; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter "SatelliteMonitoringTest\|OrbitControllerTest"; comparar as asserções e a saída com o esperado. | Fonte correta; 404/422/502/503 apropriados; telemetria mantida sem posição; demais satélites continuam |
| CT-021 | Referência técnica provisória RT-NASA | Validar datas, autorização e tradução das respostas NASA | alta | Partições: datas válidas/inválidas/invertidas; sucesso/falha upstream | Http::fake com FLR/GST/CME; nenhuma chave real; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter NasaIntegrationTest; comparar as asserções e a saída com o esperado. | Datas encaminhadas; datas inválidas rejeitadas antes da chamada; erro upstream gera 502; rotas autenticadas |
| CT-022 | US05 | Verificar SGP4, coordenadas, simulação circular e fuso horário | alta | Valores limite e equivalência: equatorial/polar; datas com/sem fuso; catálogo ausente/inválido | TLEs de referência locais; OMM via monkeypatch; satélite 5; época fixa dos testes; Na raiz do repositório, entrar no diretório indicado no comando; executar cd python-api; .venv/Scripts/python.exe -m pytest tests/test_orbits.py tests/test_orbit_simulation.py -v; comparar as asserções e a saída com o esperado. | Coordenadas e velocidade dentro das tolerâncias explícitas; periodicidade; 422/404/502 de erro |
| CT-023 | US03/US12 | Validar estrutura, faixas simuladas e alertas básicos | alta | Particionamento e valores limite: NORAD positivo/zero; sensores presentes/ausentes e estado offline | TestClient real; sensores aleatórios; monkeypatch apenas nas rotas de alertas que o declaram; Na raiz do repositório, entrar no diretório indicado no comando; executar cd python-api; .venv/Scripts/python.exe -m pytest tests/test_sensors.py tests/test_alerts.py -v; comparar as asserções e a saída com o esperado. | Faixas e unidades implementadas; simulated=true; 422 para ID zero; alertas previstos |
| CT-024 | Referência técnica provisória RT-UNIDADES | Conferir as 15 definições e o endpoint público | alta | Particionamento: campos numéricos versus categoria sem unidade; unicidade do conjunto | GET /api/telemetry/units; catálogo PHP; communication_status; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter "TelemetryUnitCatalogTest\|TelemetryUnitsTest"; comparar as asserções e a saída com o esperado. | 15 chaves únicas; símbolos e tipos exatos; categoria com unit/symbol null; sem conversão matemática |
| CT-025 | Referência técnica provisória RT-OS | Validar CRUD e associação consistente entre missão e satélite | alta | Tabela de decisão: mesmo satélite versus outro; ativo versus excluído logicamente | Ordem maintenance; operador existente; missão/satélite associados; outro satélite; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter ServiceOrderTest; comparar as asserções e a saída com o esperado. | Criar/consultar/atualizar; vínculo incorreto rejeitado; exclusão lógica; consulta após exclusão recebe 404 |
| CT-026 | US09 | Preservar catálogo ao vincular missões e persistir estado | alta | Teste estrutural de relacionamento: FK e reuso da tabela existente | SQLite isolado, migrations do projeto, satélite ISS fictício dos testes; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter "SatelliteMissionMigrationTest\|MissionPersistenceTest"; comparar as asserções e a saída com o esperado. | Catálogo preservado; missão vinculada e atualização persistida |
| CT-027 | Referência técnica provisória RT-SMOKE | Detectar rapidamente quebra de inicialização, banco isolado, rota pública e autenticação | alta | Particionamento: saudável versus indisponível; público versus protegido | TelemetryUnitsTest, EnvironmentTest, ExampleTest e Python health; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php vendor/phpunit/phpunit/phpunit --filter "TelemetryUnitsTest\|EnvironmentTest"; cd ../python-api; .venv/Scripts/python.exe -m pytest tests/test_health.py -v; comparar as asserções e a saída com o esperado. | Cinco testes do smoke backend aprovados; health e exemplos aprovados nas suítes completas |
| CT-028 | US01–US20 | Confrontar implementação, rotas, documentação e histórias | média | Inspeção por rastreabilidade: comparar artefatos oficiais com código e configuração | SPRINT 1 PDF; docs; routes; controllers; services; migrations; componentes; manifests; Na raiz do repositório, entrar no diretório indicado no comando; executar cd backend; php artisan route:list --path=api --json; na raiz: git ls-files; comparar as asserções e a saída com o esperado. | Matriz completa e divergências explicitamente identificadas |
| CT-029 | US02/US09/US12 | Reexecutar persistência no banco configurado pelo Compose | alta | Equivalência de ambiente: SQLite versus MariaDB real | Docker + MariaDB 11.4; banco de teste exclusivo, nunca volume de desenvolvimento; Na raiz do repositório, entrar no diretório indicado no comando; executar docker version (pré-condição); após instalar, criar compose de teste exclusivo antes de qualquer migration; comparar as asserções e a saída com o esperado. | Subir ambiente de teste separado e aprovar regressão sem tocar dados existentes |
| CT-030 | US09; RT-REGRESSAO provisória para templates | Verificar componentes herdados e formulário atual sem mascarar falhas | alta | Partições e transição de estados: abrir/fechar, vazio/válido, confirmar/cancelar | Fixtures locais e mocks declarados nos arquivos; nenhum backend real nesta suíte; Na raiz do repositório, entrar no diretório indicado no comando; executar cd frontend; npm test; comparar as asserções e a saída com o esperado. | Todos os casos dos componentes aprovados; seis testes de missão usam QueryClient e saveMission mockado |
| CT-031 | US02/US09 | Avaliar legibilidade, teclado e mensagens com usuário representativo | média | Exploratório por tarefas: criar missão e corrigir formulário inválido | Sessão fictícia; navegador; roteiro cadastrar→errar campo→corrigir→salvar; Na raiz do repositório, entrar no diretório indicado no comando; executar Abrir o ambiente isolado; executar tarefas; registrar dispositivo, horários e observações; comparar as asserções e a saída com o esperado. | Participante conclui tarefas; observações e dificuldades registradas, sem pressupor aceite |
| CT-032 | US02/US09/US13 | Repetir login, cadastro e missão em Firefox e dispositivo móvel | média | Particionamento por navegador e viewport | Firefox e aparelho móvel, versão e resolução a registrar; Na raiz do repositório, entrar no diretório indicado no comando; executar Preparar Firefox/dispositivo; repetir CT-010 e registrar evidências reais; comparar as asserções e a saída com o esperado. | Fluxo concluído sem erros; diferenças visuais anotadas |
| CT-033 | US05/US16; RT-NASA provisória | Observar NASA, CelesTrak e SatNOGS reais sem confundir mocks com integração | média | Partições: sucesso, ausência de dados e indisponibilidade externa | Conta fictícia autenticada; NORAD de referência; datas válidas; nenhuma credencial pessoal; Na raiz do repositório, entrar no diretório indicado no comando; executar Em ambiente isolado, consultar rotas de integração autenticadas; remover tokens das evidências; comparar as asserções e a saída com o esperado. | Respostas reais com fonte/data e tratamento de ausência/erro registrados |
| CT-034 | US01–US20 | Obter validação formal dos critérios com os responsáveis | alta | Cenários de uso derivados das histórias; aprovação deve ser humana e documentada | Relatório, histórias oficiais, responsáveis e critérios pactuados; Na raiz do repositório, entrar no diretório indicado no comando; executar Apresentar resultados à equipe/professor; registrar decisão e data sem preencher em nome deles; comparar as asserções e a saída com o esperado. | Ata ou assinatura de aceite real, com ressalvas e critérios verificados |
| CT-035 | US12; RT-DESEMPENHO provisória | Medir latência local sem inventar um SLA | média | Amostragem exploratória: 20 requisições sequenciais após health; posto 19 para p95 | TestClient em processo; satélite 5; dados simulados reais; Na raiz do repositório, entrar no diretório indicado no comando; executar python-api/.venv/Scripts/python.exe docs/sprint-6/medir_telemetria.py; comparar as asserções e a saída com o esperado. | Coleta com 20 respostas HTTP 200; total_alerts consistente; sem juízo de adequação a SLA |

Tabela complementar de execução e rastreio:

| ID | Módulo | Nível | Tipo | Pré-condições | Arquivo/método ou procedimento | Resultado real | Status | Evidência (em evidencias/) | Incidente |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CT-001 | Satélites | integração | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SprintSixTest.php::test_ct001_altitude_limits | HTTP 422/201/201/422; nenhum registro nas rejeições | passou | backend-final.log | — |
| CT-002 | Satélites | integração | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SprintSixTest.php::test_ct002_pagination_limits | HTTP 422/200/200/422 | passou | backend-final.log | — |
| CT-003 | API | integração | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SprintSixTest.php::test_ct003_missing_records_return_404 | HTTP 404 nos três endpoints | passou | backend-final.log | — |
| CT-004 | Missões | integração | funcional/confiabilidade | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SprintSixTest.php::test_ct004_invalid_bulk_is_atomic | HTTP 422; operator_name original permanece null | passou | backend-final.log | — |
| CT-005 | Alertas | integração | funcional/integridade | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SprintSixTest.php::test_ct005_alerts_with_same_code_preserve_each_parameter | Somente gyroscope_y persistido; gyroscope_x foi sobrescrito | falhou | backend-final.log | INC-001 |
| CT-006 | Alertas Python | unidade | funcional | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | python-api/tests/test_sprint6.py::test_ct006_alert_boundaries | Alerta somente nas partições fora dos limiares; 14 instâncias aprovadas | passou | python-final.log | — |
| CT-007 | Telemetria Python | integração | funcional/confiabilidade | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | python-api/tests/test_sprint6.py::test_ct007_telemetry_alerts_match_returned_sensors | Mesma contagem, parâmetros, valores e timestamps ao reavaliar a leitura | passou | python-final.log | — |
| CT-008 | Comunicação simulada | unidade | funcional | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | python-api/tests/test_sprint6.py::test_ct008_communication_decision_table | Nenhum alerta de comunicação / COMMUNICATION_LOST / SENSOR_FAILURE | passou | python-final.log | — |
| CT-009 | Apresentação de telemetria | unidade | funcional | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | frontend/src/lib/meter-color.test.ts | Vermelho/vermelho/amarelo/amarelo/verde/verde; seis instâncias | passou | frontend-final.log | — |
| CT-010 | Fluxo oficial | sistema/aceitação técnica | funcional | PHP/PDO SQLite, Python venv, Node e Chromium; PYTHON_BINARY aponta para .venv/Scripts/python.exe; portas 18000/18001/15173 livres. O runner verifica as portas, cria banco temporário e encerra seus processos. | frontend/scripts/integration-smoke.mjs | Guard redireciona; login; cadastro; telemetria FastAPI; criar/editar/iniciar missão; dashboard; restauração após recarga; criar operador; logout | passou | sistema-final.log | — |
| CT-011 | Cliente HTTP | unidade | funcional/segurança | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | frontend/src/lib/api.test.ts | Nove testes de contrato aprovados; sem alegar integração HTTP real | passou | frontend-final.log | — |
| CT-012 | Sessão e utilitários frontend | unidade/componente | funcional/segurança | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | frontend/src/stores/auth-store.test.ts; features/auth/sign-in; features/auth/forgot-password; components/sign-out-dialog.test.tsx; lib/*.test.ts (exceto api/meter) | Todos os testes dos arquivos associados aprovados; recuperação não comprova envio de e-mail | passou | frontend-final.log | — |
| CT-013 | Compilação | estático | não funcional/compatibilidade | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | frontend/package.json; tsconfig*.json | Código zero; build e tsc aprovados; aviso de chunk grande registrado | passou | frontend-build-final.log | INC-010 |
| CT-014 | Frontend | estático | não funcional/manutenibilidade | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | frontend/eslint.config.js | Zero erros; um aviso Fast Refresh registrado | passou | frontend-lint-final.log | INC-011 |
| CT-015 | Cadastro de satélites | integração | funcional/segurança | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SatelliteCrudTest.php; SatelliteTest.php | Cadastro/consulta/edição/exclusão permitidos; entradas inválidas e papéis inadequados rejeitados | passou | backend-final.log | — |
| CT-016 | Missões | integração | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/MissionApiTest.php (métodos de CRUD, comentários, lote e orçamento) | Persistência e envelopes corretos; entradas fora das regras recebem 422; comentários isolados | passou | backend-final.log | — |
| CT-017 | Ciclo de missões | integração/aceitação técnica | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/MissionApiTest.php (métodos de ciclo de vida) | Transições e timestamps correspondem ao estado; confirmações exigidas pelo código | passou | backend-final.log | — |
| CT-018 | Autenticação | integração | funcional/segurança | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/AuthAccessTest.php | Token funciona; logout remove token; inativo não entra; apenas gerente cadastra; token de recuperação não exposto em produção | passou | backend-final.log | — |
| CT-019 | Telemetria persistida | integração | funcional/confiabilidade | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SatelliteTelemetryControllerTest.php; SatelliteSensorControllerTest.php | Dados persistem; alertas resolvem; 502/503 conforme código; falha orbital não impede leitura | passou | backend-final.log | — |
| CT-020 | Monitoramento | integração | funcional/confiabilidade | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SatelliteMonitoringTest.php; OrbitControllerTest.php | Fonte correta; 404/422/502/503 apropriados; telemetria mantida sem posição; demais satélites continuam | passou | backend-final.log | — |
| CT-021 | NASA DONKI | integração com fronteira mockada | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/NasaIntegrationTest.php | Datas encaminhadas; datas inválidas rejeitadas antes da chamada; erro upstream gera 502; rotas autenticadas | passou | backend-final.log | — |
| CT-022 | Órbitas Python | unidade/integração | funcional | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | python-api/tests/test_orbits.py; test_orbit_simulation.py | Coordenadas e velocidade dentro das tolerâncias explícitas; periodicidade; 422/404/502 de erro | passou | python-final.log | — |
| CT-023 | Sensores Python | unidade/integração | funcional | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | python-api/tests/test_sensors.py; test_alerts.py | Faixas e unidades implementadas; simulated=true; 422 para ID zero; alertas previstos | passou | python-final.log | — |
| CT-024 | Catálogo de unidades | unidade/integração | funcional | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Unit/TelemetryUnitCatalogTest.php; backend/tests/Feature/TelemetryUnitsTest.php | 15 chaves únicas; símbolos e tipos exatos; categoria com unit/symbol null; sem conversão matemática | passou | backend-final.log | — |
| CT-025 | Ordens de serviço | integração | funcional/integridade | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/ServiceOrderTest.php | Criar/consultar/atualizar; vínculo incorreto rejeitado; exclusão lógica; consulta após exclusão recebe 404 | passou | backend-final.log | — |
| CT-026 | Persistência e migrations | integração | funcional/integridade | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/SatelliteMissionMigrationTest.php; MissionPersistenceTest.php | Catálogo preservado; missão vinculada e atualização persistida | passou | backend-final.log | — |
| CT-027 | Inicialização | sistema técnico | funcional/smoke | Dependências instaladas; PHP/PDO SQLite; APP_ENV=testing e SQLite :memory: forçados por phpunit.xml. | backend/tests/Feature/EnvironmentTest.php; TelemetryUnitsTest.php; ExampleTest.php; backend/tests/Unit/ExampleTest.php; python-api/tests/test_health.py | Cinco testes do smoke backend aprovados; health e exemplos aprovados nas suítes completas | passou | smoke-backend.log; python-final.log | — |
| CT-028 | Auditoria | estático | revisão estática | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | docs/sprint-6/MATRIZ_RASTREABILIDADE.md | Matriz completa e divergências explicitamente identificadas | passou | rotas.log; auditoria.json; sprint-1-extraida.txt | INC-012 |
| CT-029 | Docker/MariaDB | integração/sistema | funcional/compatibilidade | Docker funcional; configuração separada de testes com volume e banco descartáveis. O Compose atual aponta para volume persistente de desenvolvimento e não deve ser usado para refresh de testes. | compose.yaml; docker/; backend/database/migrations | Docker não encontrado; nenhuma migration foi executada em MariaDB | bloqueado | docker.log | INC-013 |
| CT-030 | Componentes frontend | unidade/componente | funcional/regressão | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | frontend/src/components/*.test.tsx; context/*.test.tsx; hooks/*.test.ts; features/users*/components/*.test.tsx; features/tasks/components/*.test.tsx; features/auth/sign-up/components/*.test.tsx | Seis testes de missão reparados e aprovados; 40 falhas persistem em nove arquivos herdados | falhou | frontend-final.log | INC-002/003/004/005/006/007 |
| CT-031 | Usabilidade | aceitação | não funcional/usabilidade | Participante identificado com autorização e aplicação de teste iniciada. | Roteiro manual neste caso | Não houve sessão observada com participante; automação não equivale a avaliação humana | não executado | — | — |
| CT-032 | Compatibilidade | sistema | não funcional/compatibilidade | Navegadores/dispositivos adicionais e banco de teste exclusivo disponíveis. | Roteiro manual; frontend/scripts/integration-smoke.mjs como referência de passos | Apenas Chromium desktop foi utilizado; não houve preparação nem execução em Firefox/aparelho móvel | não executado | — | — |
| CT-033 | Fontes externas reais | integração | funcional | Decisão de habilitar chamadas ao vivo com configuração pública de teste; não é necessária para suítes mockadas. | backend/app/Services/Integrations; SatelliteController::reception | Execução de serviços externos ao vivo excluída para manter suíte independente de rede; nenhuma chave real utilizada | não executado | — | — |
| CT-034 | Aceite institucional | aceitação | funcional | Responsáveis disponíveis; critérios de aceite formalizados; defeitos críticos avaliados. | Modelo Word não disponível no repositório; estrutura fornecida na solicitação | Nenhum aceite formal foi realizado; critérios técnicos desta sprint são derivados do código, não critérios aprovados pela instituição | não executado | — | — |
| CT-035 | Telemetria local | integração | não funcional/desempenho básico | Dependências instaladas; dados fictícios do arquivo; sem credenciais reais. | docs/sprint-6/medir_telemetria.py | 20/20 respostas válidas; mediana 1,142 ms; p95 por posto 19 = 1,333 ms; sem rede, banco ou carga concorrente | passou | desempenho.log | — |

## 3. LOG DE EXECUÇÃO

As datas abaixo são extraídas dos arquivos de evidência, sem atribuir horário de execução a casos não executados. Commit indicado é o HEAD base mais a árvore de trabalho; arquivos e hashes entregues constam no inventário.

| Caso | Data/hora da execução registrada | Commit base | Esperado | Obtido | Status | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| CT-001 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 422/201/201/422; nenhum registro nas rejeições | HTTP 422/201/201/422; nenhum registro nas rejeições | passou | backend-final.log |
| CT-002 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 422/200/200/422 | HTTP 422/200/200/422 | passou | backend-final.log |
| CT-003 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 404 nos três endpoints | HTTP 404 nos três endpoints | passou | backend-final.log |
| CT-004 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 422; operator_name original permanece null | HTTP 422; operator_name original permanece null | passou | backend-final.log |
| CT-005 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Dois alertas abertos, um por eixo (critério de integridade proposto pela auditoria) | Somente gyroscope_y persistido; gyroscope_x foi sobrescrito | falhou | backend-final.log |
| CT-006 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Alerta somente nas partições fora dos limiares; 14 instâncias aprovadas | Alerta somente nas partições fora dos limiares; 14 instâncias aprovadas | passou | python-final.log |
| CT-007 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Mesma contagem, parâmetros, valores e timestamps ao reavaliar a leitura | Mesma contagem, parâmetros, valores e timestamps ao reavaliar a leitura | passou | python-final.log |
| CT-008 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Nenhum alerta de comunicação / COMMUNICATION_LOST / SENSOR_FAILURE | Nenhum alerta de comunicação / COMMUNICATION_LOST / SENSOR_FAILURE | passou | python-final.log |
| CT-009 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Vermelho/vermelho/amarelo/amarelo/verde/verde; seis instâncias | Vermelho/vermelho/amarelo/amarelo/verde/verde; seis instâncias | passou | frontend-final.log |
| CT-010 | 2026-11-15T21:27:58.9551836-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Guard redireciona; login; cadastro; telemetria FastAPI; criar/editar/iniciar missão; dashboard; restauração após recarga; criar operador; logout | Guard redireciona; login; cadastro; telemetria FastAPI; criar/editar/iniciar missão; dashboard; restauração após recarga; criar operador; logout | passou | sistema-final.log |
| CT-011 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Nove testes de contrato aprovados; sem alegar integração HTTP real | Nove testes de contrato aprovados; sem alegar integração HTTP real | passou | frontend-final.log |
| CT-012 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Todos os testes dos arquivos associados aprovados; recuperação não comprova envio de e-mail | Todos os testes dos arquivos associados aprovados; recuperação não comprova envio de e-mail | passou | frontend-final.log |
| CT-013 | 2026-11-15T21:29:05.8095984-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Código zero; build e tsc aprovados; aviso de chunk grande registrado | Código zero; build e tsc aprovados; aviso de chunk grande registrado | passou | frontend-build-final.log |
| CT-014 | 2026-11-15T21:38:24.8223992-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Zero erros; um aviso Fast Refresh registrado | Zero erros; um aviso Fast Refresh registrado | passou | frontend-lint-final.log |
| CT-015 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Cadastro/consulta/edição/exclusão permitidos; entradas inválidas e papéis inadequados rejeitados | Cadastro/consulta/edição/exclusão permitidos; entradas inválidas e papéis inadequados rejeitados | passou | backend-final.log |
| CT-016 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Persistência e envelopes corretos; entradas fora das regras recebem 422; comentários isolados | Persistência e envelopes corretos; entradas fora das regras recebem 422; comentários isolados | passou | backend-final.log |
| CT-017 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Transições e timestamps correspondem ao estado; confirmações exigidas pelo código | Transições e timestamps correspondem ao estado; confirmações exigidas pelo código | passou | backend-final.log |
| CT-018 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Token funciona; logout remove token; inativo não entra; apenas gerente cadastra; token de recuperação não exposto em produção | Token funciona; logout remove token; inativo não entra; apenas gerente cadastra; token de recuperação não exposto em produção | passou | backend-final.log |
| CT-019 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Dados persistem; alertas resolvem; 502/503 conforme código; falha orbital não impede leitura | Dados persistem; alertas resolvem; 502/503 conforme código; falha orbital não impede leitura | passou | backend-final.log |
| CT-020 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Fonte correta; 404/422/502/503 apropriados; telemetria mantida sem posição; demais satélites continuam | Fonte correta; 404/422/502/503 apropriados; telemetria mantida sem posição; demais satélites continuam | passou | backend-final.log |
| CT-021 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Datas encaminhadas; datas inválidas rejeitadas antes da chamada; erro upstream gera 502; rotas autenticadas | Datas encaminhadas; datas inválidas rejeitadas antes da chamada; erro upstream gera 502; rotas autenticadas | passou | backend-final.log |
| CT-022 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Coordenadas e velocidade dentro das tolerâncias explícitas; periodicidade; 422/404/502 de erro | Coordenadas e velocidade dentro das tolerâncias explícitas; periodicidade; 422/404/502 de erro | passou | python-final.log |
| CT-023 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Faixas e unidades implementadas; simulated=true; 422 para ID zero; alertas previstos | Faixas e unidades implementadas; simulated=true; 422 para ID zero; alertas previstos | passou | python-final.log |
| CT-024 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | 15 chaves únicas; símbolos e tipos exatos; categoria com unit/symbol null; sem conversão matemática | 15 chaves únicas; símbolos e tipos exatos; categoria com unit/symbol null; sem conversão matemática | passou | backend-final.log |
| CT-025 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Criar/consultar/atualizar; vínculo incorreto rejeitado; exclusão lógica; consulta após exclusão recebe 404 | Criar/consultar/atualizar; vínculo incorreto rejeitado; exclusão lógica; consulta após exclusão recebe 404 | passou | backend-final.log |
| CT-026 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Catálogo preservado; missão vinculada e atualização persistida | Catálogo preservado; missão vinculada e atualização persistida | passou | backend-final.log |
| CT-027 | 2026-11-15T21:27:59.0158970-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Cinco testes do smoke backend aprovados; health e exemplos aprovados nas suítes completas | Cinco testes do smoke backend aprovados; health e exemplos aprovados nas suítes completas | passou | smoke-backend.log; python-final.log |
| CT-028 | 2026-11-15T21:23:46.8373799-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Matriz completa e divergências explicitamente identificadas | Matriz completa e divergências explicitamente identificadas | passou | rotas.log; auditoria.json; sprint-1-extraida.txt |
| CT-029 | 2026-11-15T21:29:25.7029726-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Subir ambiente de teste separado e aprovar regressão sem tocar dados existentes | Docker não encontrado; nenhuma migration foi executada em MariaDB | bloqueado | docker.log |
| CT-030 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Todos os casos dos componentes aprovados; seis testes de missão usam QueryClient e saveMission mockado | Seis testes de missão reparados e aprovados; 40 falhas persistem em nove arquivos herdados | falhou | frontend-final.log |
| CT-031 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Participante conclui tarefas; observações e dificuldades registradas, sem pressupor aceite | Não houve sessão observada com participante; automação não equivale a avaliação humana | não executado | — |
| CT-032 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Fluxo concluído sem erros; diferenças visuais anotadas | Apenas Chromium desktop foi utilizado; não houve preparação nem execução em Firefox/aparelho móvel | não executado | — |
| CT-033 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Respostas reais com fonte/data e tratamento de ausência/erro registrados | Execução de serviços externos ao vivo excluída para manter suíte independente de rede; nenhuma chave real utilizada | não executado | — |
| CT-034 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Ata ou assinatura de aceite real, com ressalvas e critérios verificados | Nenhum aceite formal foi realizado; critérios técnicos desta sprint são derivados do código, não critérios aprovados pela instituição | não executado | — |
| CT-035 | 2026-11-15T21:24:21.7538086-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Coleta com 20 respostas HTTP 200; total_alerts consistente; sem juízo de adequação a SLA | 20/20 respostas válidas; mediana 1,142 ms; p95 por posto 19 = 1,333 ms; sem rede, banco ou carga concorrente | passou | desempenho.log |

Histórico preservado (as repetições não aumentam o denominador final):

| Evidência | Data/hora inicial | Resultado |
| --- | --- | --- |
| backend-inicial.log | 2026-11-15T21:15:01.2552013-03:00 | Suíte anterior à adição: 93 testes/607 asserções aprovados, 1 deprecation |
| python-inicial.log | 2026-11-15T21:15:05.4337864-03:00 | 27 testes aprovados; 1 warning |
| frontend-inicial.log | 2026-11-15T21:21:58.4948951-03:00 | 167 instâncias, 121 aprovadas e 46 falhas; inclui novo teste de cores |
| backend-novos.log | 2026-11-15T21:20:03.8622392-03:00 | 11 instâncias; 10 aprovadas e uma falha de produto |
| python-novos.log | 2026-11-15T21:20:03.6698678-03:00 | 18 instâncias novas aprovadas |
| frontend-reteste-formulario.log | 2026-11-15T21:25:53.8218711-03:00 | Reteste intermediário: 3 aprovados/3 falhas getByLabel, defeito no reparo do teste |
| frontend-reteste-formulario-2.log | 2026-11-15T21:27:37.6099841-03:00 | Reteste após getByLabelText: 6/6 aprovados |
| backend-final.log | 2026-11-15T21:26:21.4861895-03:00 | Regressão: 104 instâncias, 103 aprovadas/uma falha; 625 asserções; 1 deprecation |
| python-final.log | 2026-11-15T21:26:32.1333734-03:00 | Regressão: 45/45 aprovados; 1 warning |
| frontend-final.log | 2026-11-15T21:27:58.9848037-03:00 | Regressão final: consultar contagem estruturada consolidada na seção 5.1 |
| sistema-inicial.log | 2026-11-15T21:22:10.4088666-03:00 | Fluxo E2E real aprovado |
| sistema-final.log | 2026-11-15T21:27:58.9551836-03:00 | Reexecução E2E real aprovada |
| smoke-backend.log | 2026-11-15T21:27:59.0158970-03:00 | 5 testes/109 asserções aprovados; deprecation preservada |
| frontend-build-final.log | 2026-11-15T21:29:05.8095984-03:00 | Build e TypeScript aprovados; aviso de tamanho |
| frontend-lint-final.log | 2026-11-15T21:38:24.8223992-03:00 | Zero erros; um aviso |
| docker.log | 2026-11-15T21:29:25.7029726-03:00 | Pré-condição bloqueada, comando indisponível, código 127 |
| desempenho.log | 2026-11-15T21:24:21.7538086-03:00 | 20 respostas válidas; latência exploratória sem SLA |

## 4. RELATÓRIO DE INCIDENTE

Os incidentes distinguem produto, testes, dependência, documentação e ambiente. Falhas de seleção em templates não são automaticamente defeitos de funcionalidade em produção. Os IDs agregam a mesma causa por módulo; cada método reprovado continua identificável no inventário. Não se converte o número de incidentes em número de testes.

| ID | Natureza | Resumo | Caso | Severidade | Prioridade | Status |
| --- | --- | --- | --- | --- | --- | --- |
| INC-001 | Produto | Alertas distintos são sobrescritos | CT-005 | alta | alta | aberto |
| INC-002 | Infraestrutura de testes | Seis testes de missão desatualizados e sem QueryClient | CT-030 | média | alta | fechado |
| INC-003 | Testes herdados | Busca usa placeholder e textos antigos | CT-030 | média | média | aberto |
| INC-004 | Testes herdados | Diálogos do template de usuários divergem dos testes | CT-030 | média | média | aberto |
| INC-005 | Testes herdados | Cópia legada de usuários possui expectativas obsoletas | CT-030 | média | média | aberto |
| INC-006 | Testes herdados | Descrição da exclusão múltipla de tarefas mudou | CT-030 | média | média | aberto |
| INC-007 | Testes herdados | Formulário legado de cadastro usa seletores antigos | CT-030 | média | média | aberto |
| INC-008 | Compatibilidade | Constante PDO depreciada no PHP 8.5 | CT-027 | baixa | baixa | aberto |
| INC-009 | Dependência de testes | TestClient alerta sobre httpx depreciado | CT-023/027 | baixa | baixa | aberto |
| INC-010 | Empacotamento | Chunk principal acima do aviso de 500 kB | CT-013 | baixa | média | aberto |
| INC-011 | Análise estática | Aviso de Fast Refresh | CT-014 | baixa | baixa | aberto |
| INC-012 | Documentação | Documentos anteriores descrevem versões e funções divergentes | CT-028 | média | média | aberto |
| INC-013 | Ambiente | Docker indisponível para validar MariaDB | CT-029 | média | alta | aberto |
| INC-014 | Preparação dos testes | Ferramentas fora do PATH, ZIP e política de scripts | CT-028 | baixa | média | fechado |

### INC-001 — Alertas distintos são sobrescritos

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Produto. Caso: CT-005. Severidade: alta; prioridade: alta; estado: aberto.

Arquivo/módulo: `backend/app/Services/TelemetryRecorder.php::record`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Criar satélite isolado; gravar na mesma transação alertas HIGH_ANGULAR_VELOCITY para gyroscope_x e gyroscope_y.

Resultado esperado e obtido: Esperado: dois parâmetros preservados. Obtido: só gyroscope_y.

Causa identificada ou hipótese: Chave de updateOrCreate usa satellite_id, code e resolved; omite parameter (causa identificada).

Impacto: Histórico perde uma falha simultânea; contagem/diagnóstico podem divergir da leitura.

Evidência: backend-novos.log; backend-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-002 — Seis testes de missão desatualizados e sem QueryClient

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Infraestrutura de testes. Caso: CT-030. Severidade: média; prioridade: alta; estado: fechado.

Arquivo/módulo: `frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar arquivo original no commit base: falta QueryClient; após fornecer contexto, seletores de Task e showSubmittedData divergem da missão atual.

Resultado esperado e obtido: Antes: 6 falhas. Reteste intermediário: 3 passaram/3 falharam por getByLabel inexistente introduzido no reparo. Após getByLabelText: 6/6 aprovados.

Causa identificada ou hipótese: Contexto ausente e fixtures/contrato antigos. Correção apenas no teste: QueryClient por render, listSatellites/saveMission controlados, seletores atuais.

Impacto: Impedia validar formulário. Preservadas seis intenções originais; envio confirma serviço mockado, não persistência real.

Evidência: frontend-inicial.log; frontend-reteste-formulario.log; frontend-reteste-formulario-2.log; frontend-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-003 — Busca usa placeholder e textos antigos

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/context/search-provider.test.tsx; components/command-menu.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: npm test -- src/context/search-provider.test.tsx; abrir paleta pelos atalhos definidos.

Resultado esperado e obtido: 7 falhas/8: timeout; placeholder esperado Type a command or search... difere de Digite uma palavra para pesquisar.

Causa identificada ou hipótese: Divergência textual comprovada; demais seletores precisam revisão, não há prova de defeito do produto em todos os cenários.

Impacto: Reduz confiabilidade da regressão da busca.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-004 — Diálogos do template de usuários divergem dos testes

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/users/components/users-{action,invite,multi-delete}-dialog.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar os três arquivos com npm test -- caminho.

Resultado esperado e obtido: 11 falhas: action=3, invite=3, multi-delete=5; seletores/textos não encontrados.

Causa identificada ou hipótese: Textos e fixtures antigos; mensagens traduzidas; fluxos são template, não CRUD oficial. Conferir cada falha no inventário.

Impacto: Regressão de template incompleta; não implica falha do cadastro oficial por gerente.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-005 — Cópia legada de usuários possui expectativas obsoletas

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/userscopy/components/users-{action,invite,multi-delete}-dialog.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar os três arquivos userscopy com npm test -- caminho.

Resultado esperado e obtido: 17 falhas: action=9, invite=3, multi-delete=5.

Causa identificada ou hipótese: Seletores de campos/textos da versão anterior divergem dos componentes; hipótese de demais erros encobertos por timeouts.

Impacto: Testes de componentes legados falham; página oficial usa management.tsx, cuja criação foi validada no E2E.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-006 — Descrição da exclusão múltipla de tarefas mudou

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar arquivo; conferir teste de título/descrição/input/botões.

Resultado esperado e obtido: 1 falha/6; texto esperado não localizado.

Causa identificada ou hipótese: Expectativa de apresentação antiga; outros cinco cenários passam.

Impacto: Ruído na regressão de exclusão múltipla.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-007 — Formulário legado de cadastro usa seletores antigos

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/auth/sign-up/components/sign-up-form.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar arquivo; localizar Create Account e Password.

Resultado esperado e obtido: 4 falhas/4; componente tem Criar conta e Senha.

Causa identificada ou hipótese: Seletores obsoletos. Componente legado simula criação; rota pública oficial orienta solicitar acesso.

Impacto: Falsos negativos de template; não comprova cadastro de usuário no backend.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-008 — Constante PDO depreciada no PHP 8.5

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Compatibilidade. Caso: CT-027. Severidade: baixa; prioridade: baixa; estado: aberto.

Arquivo/módulo: `backend/config/database.php:62`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar PHPUnit com --display-deprecations --filter EnvironmentTest no PHP 8.5.12.

Resultado esperado e obtido: Testes aprovam, mas PDO::MYSQL_ATTR_SSL_CA gera deprecation.

Causa identificada ou hipótese: Mudança da API do PHP 8.5; não alterada configuração de produção nesta sprint.

Impacto: Dívida de compatibilidade; aviso não contado como falha funcional.

Evidência: php-avisos.log; backend-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-009 — TestClient alerta sobre httpx depreciado

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Dependência de testes. Caso: CT-023/027. Severidade: baixa; prioridade: baixa; estado: aberto.

Arquivo/módulo: `python-api/requirements.txt; .venv/Lib/site-packages/fastapi/testclient.py`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar pytest com dependências fixadas.

Resultado esperado e obtido: 45 testes aprovam; warning StarletteDeprecationWarning recomenda httpx2.

Causa identificada ou hipótese: Dependências de teste atuais ainda usam httpx; atualização exige validação própria.

Impacto: Risco futuro na infraestrutura; nenhum pacote de produção foi alterado.

Evidência: python-inicial.log; python-final.log; desempenho.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-010 — Chunk principal acima do aviso de 500 kB

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Empacotamento. Caso: CT-013. Severidade: baixa; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/vite.config.ts; frontend/src`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: npm run build.

Resultado esperado e obtido: Build e tipos aprovam; Vite emite aviso de chunk grande.

Causa identificada ou hipótese: Dependências/empacotamento concentrados; análise de distribuição não realizada.

Impacto: Possível impacto no carregamento; não houve medição de rede que quantifique esse efeito.

Evidência: frontend-build-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-011 — Aviso de Fast Refresh

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Análise estática. Caso: CT-014. Severidade: baixa; prioridade: baixa; estado: aberto.

Arquivo/módulo: `frontend/src/features/tasks/components/tasks-columns.tsx:11`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: npm run lint.

Resultado esperado e obtido: Zero erros e um aviso react-refresh/only-export-components.

Causa identificada ou hipótese: Exportação de componente com outros símbolos no mesmo módulo.

Impacto: Aviso de desenvolvimento; sem falha funcional demonstrada.

Evidência: frontend-lint-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-012 — Documentos anteriores descrevem versões e funções divergentes

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Documentação. Caso: CT-028. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `docs/telemetry-units.md; docs/integration-baseline.md; README.md`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Comparar composer.lock/manifests/rotas com documentos: catálogo cita Laravel 8/PHP 8.2; baseline afirma frontend ausente; README menciona MySQL/Socket.IO/N2YO.

Resultado esperado e obtido: Atual: Laravel 12, React integrado, MariaDB configurado, sem serviço Socket.IO ou integração N2YO localizada.

Causa identificada ou hipótese: Documentos de épocas distintas sem atualização consolidada; esta sprint registra ressalvas sem reescrevê-los.

Impacto: Instruções antigas podem preparar ambiente incorreto ou sugerir recursos inexistentes.

Evidência: auditoria.json; rotas.log; matriz neste relatório. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-013 — Docker indisponível para validar MariaDB

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Ambiente. Caso: CT-029. Severidade: média; prioridade: alta; estado: aberto.

Arquivo/módulo: `Ambiente Windows; compose.yaml`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar docker version.

Resultado esperado e obtido: Comando não localizado; CT-029 bloqueado antes da inicialização.

Causa identificada ou hipótese: Executável Docker não disponível na sessão; não se conclui que o daemon exista ou funcione.

Impacto: Sem comprovação das migrations e restrições no mecanismo configurado para implantação.

Evidência: docker.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-014 — Ferramentas fora do PATH, ZIP e política de scripts

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Preparação dos testes. Caso: CT-028. Severidade: baixa; prioridade: média; estado: fechado.

Arquivo/módulo: `Ambiente local; .tools ignorado; docs/sprint-6/Executar-Com-Evidencia.ps1`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Composer inicial sem ZIP; node/docker ausentes do PATH; python era alias sem acesso; uv tentou cache sem escrita; PowerShell recusou ps1.

Resultado esperado e obtido: Preparação resolvida para PHP/Python/Node/Chromium; Docker continua em INC-013. Extração PDF teve erro de aspas e depois de saída cp1252; arquivo UTF-8 foi gravado e lido. Consulta CIM de SO recebeu acesso negado; versão não inferida dessa consulta.

Causa identificada ou hipótese: Habilitado ZIP só no comando Composer; Python existente em .venv; Node portátil oficial com SHA256; cache no workspace; execução de scripts liberada só no processo.

Impacto: Atraso de preparação; sem alteração global de configuração. Tentativas anteriores ao capturador têm apenas transcrição, não logs completos.

Evidência: preparacao.md; npm-ci.log; chromium-install.log; ambiente.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

## 5. RELATÓRIO DE CONCLUSÃO

A aplicação possui integração funcional efetiva e o fluxo principal passou duas vezes com serviços reais e SQLite isolado. Isso não satisfaz os critérios de liberação: a persistência de alertas perde parâmetros simultâneos (INC-001), a regressão frontend mantém falhas e MariaDB/Docker não foi validado. Não houve alteração de funcionalidades para obter aprovação. Os testes anteriores foram preservados, com adaptação pontual de seis cenários do formulário atual e adição de 35 instâncias distribuídas nas três camadas (11 PHP, 18 Python, seis frontend).

### 5.1 MÉTRICAS


| Métrica | Valor | Denominador/critério |
| --- | --- | --- |
| Casos planejados | 35 | CT-001 a CT-035; cada cenário conta uma vez |
| Casos executados | 30 | Somente passou + falhou; bloqueados e não executados excluídos |
| Percentual executado | 85.71% | 30 / 35 planejados |
| Casos aprovados | 28 | Cenários sem instância reprovada |
| Casos reprovados | 2 | CT-005 e CT-030 |
| Casos bloqueados | 1 | CT-029, ambiente Docker |
| Casos não executados | 4 | CT-031/032/033/034 |
| Taxa de aprovação entre executados | 93.33% | 28 / 30 casos com veredito |
| Instâncias de frameworks executadas | 316 | PHPUnit + pytest + Vitest, somente execução final de cada suíte |
| Instâncias aprovadas/reprovadas | 275 / 41 | Parametrizações contam como instâncias; não como novos CT |
| Testes automatizados distintos executados | 317 | 316 instâncias + um cenário E2E; smoke/retestes já contidos não somados |
| Taxa de aprovação automatizada | 87.07% | 276 / 317; benchmark/build/lint/revisão fora deste denominador |
| Incidentes | 14 | 1 produto alto; restante discriminado por natureza na seção 4 |
| Incidentes por severidade | {'alta': 1, 'média': 8, 'baixa': 5} | Unidade é incidente, não teste |
| Incidentes abertos | 12 | INC-002 e INC-014 fechados; demais abertos |
| Cobertura de código | Não medida | Nenhum percentual de instruções/decisões inferido |
| Histórias com cobertura técnica parcial | 11 / 20 (55,00%) | US02/03/04/05/07/09/12/13/17/19/20; ao menos um cenário pertinente executado, inclusive falhas |
| Histórias sem cobertura executada | 9 / 20 (45,00%) | US01/06/08/10/11/14/15/16/18; CT-033 planejado não conta como executado |
| Aceites formais | 0 | Não houve aceite humano ou aprovação institucional |

Contagem não implica certificação funcional de cada história: US05 cobre cálculo e não rota planejada; US12 usa sensores simulados; US20 cobre orçamento e não custos efetivos. O benchmark forneceu observações locais (mediana 1,142 ms; p95 1,333 ms), sem requisito de tempo, rede ou carga; esses valores não comprovam desempenho em implantação.

### 5.2 AVALIAÇÃO DOS CRITÉRIOS DE CONCLUSÃO


| Critério | Situação | Justificativa |
| --- | --- | --- |
| Todos os testes críticos executados e aprovados | Não atendido | CT-005 reprovado; MariaDB bloqueado; aceite formal pendente |
| Sem incidente crítico em aberto | Não atendido | INC-001, severidade alta, compromete integridade dos alertas |
| Execuções com evidência e origem rastreável | Atendido no escopo executado | Logs e relatórios finais, SHA base e inventário de arquivos; tentativas pré-capturador identificadas como transcrições |
| Suítes viáveis e smoke reexecutados | Atendido com falhas registradas | Regressões completas, smoke e E2E executados; não equivalem a regressão toda aprovada |
| Ambiente isolado e dados fictícios | Atendido | SQLite :memory: no PHPUnit e temporário no E2E; sem migrations no banco real |
| Sem mudança indevida de produção | Atendido | Apenas testes, capturador, medição, docs e regra de ignore para ferramentas locais |
| Aceite acadêmico/usuário documentado | Não atendido | CT-034 não executado; ausência de Word original e critérios formais explicitada |

### 5.3 DESVIOS DO PLANO

Docker/MariaDB bloqueou antes da inicialização. Testes com serviços públicos ao vivo não foram realizados, para preservar independência de rede e não usar credenciais reais. Foram utilizados mocks somente nas fronteiras explicitadas, além de uma integração real local separada. Apenas Chromium desktop foi preparado; Firefox, móvel e sessão humana de usabilidade permanecem não executados. Não houve teste de carga/pentest/cobertura instrumental, pois exigem escopo e configuração próprios. Não foi possível preencher campos desconhecidos do Word ausente; todos os títulos enviados pelo usuário foram preenchidos neste relatório. Sprints 2–5 não estavam disponíveis. Preparação precisou de Node portátil e localização do Python, sem instalar ferramentas globalmente. O reteste intermediário do formulário introduziu um seletor incompatível; a falha foi preservada e corrigida em nova execução.

### 5.4 RISCOS RESIDUAIS

Permanecem perda de alertas, regressão incompleta dos templates, diferenças SQLite/MariaDB (incluindo ALTER TABLE específico), dependências e avisos de compatibilidade, arquivos históricos contraditórios, APIs externas não verificadas ao vivo e telas sem funções de gestão completas. A política de missões e ordens aceita usuários autenticados sem granularidade adicional no código; isso exige requisito claro antes de mudar a regra. Tokens existentes não são revogados automaticamente por mudança de estado/senha; essa observação estática requer teste específico e decisão de segurança posterior. Exclusão de satélite/missão referenciada pode resultar em erro interno por FK restrict; não houve validação dinâmica de sua resposta nesta sprint. Não há alegação de segurança, acessibilidade ou desempenho para produção a partir desta execução.

### 5.5 LIÇÕES APRENDIDAS

O estado do código e os locks são fontes mais confiáveis para preparar a execução do que documentos de sprints antigas. Mocks permitem tratar indisponibilidade, mas só um fluxo separado com processos reais demonstra a comunicação local entre camadas. Aprovar sensores e algoritmos isoladamente não garante integridade da persistência: o caso de alertas simultâneos encontrou perda não coberta pela suíte anterior. Testes herdados devem acompanhar a tradução das telas, os providers e o contrato de persistência; uma expectativa antiga não deve levar à alteração da aplicação apenas para obter aprovação. Métricas com denominadores distintos evitam contabilizar parametrizações e retestes como novos cenários de negócio.

### 5.6 RECOMENDAÇÃO

**Não liberar esta versão como pronta para operação ou entrega sem ressalvas.** O material acadêmico e os testes estão prontos para revisão, com falhas explicitadas. Corrigir INC-001 mediante revisão de produto, retestar a persistência de alertas e suas resoluções, revisar as 40 falhas de testes herdados e executar regressão em ambiente MariaDB de teste separado antes de uma nova avaliação. Pactuar critérios de aceite com a equipe e registrar a decisão real. O sucesso do fluxo E2E demonstra viabilidade do núcleo, mas não substitui esses critérios.

## 6. TESTES AUTOMATIZADOS


| Ferramenta | Local no repositório | Como executar | Última execução |
| --- | --- | --- | --- |
| PHPUnit 11.5.57 | backend/tests/Unit; backend/tests/Feature | cd backend; php vendor/phpunit/phpunit/phpunit --colors=never | 2026-11-15T21:26:21.4861895-03:00; 104 testes, 103 aprovados, uma falha, 625 asserções; 1 deprecation |
| pytest 8.4.2 | python-api/tests | cd python-api; .venv/Scripts/python.exe -m pytest -v | 2026-11-15T21:26:32.1333734-03:00; 45 aprovados; 1 warning |
| Vitest/Chromium | frontend/src/**/*.test.ts(x) | cd frontend; npm test | 2026-11-15T21:27:58.9848037-03:00; 167 testes; 127 aprovados; 40 falhas |
| Playwright + serviços reais | frontend/scripts/integration-smoke.mjs | cd frontend; npm run test:integration | 2026-11-15T21:27:58.9551836-03:00; cenário E2E aprovado |
| Vite/TypeScript e ESLint | frontend/package.json | cd frontend; npm run build; npm run lint | Aprovados com avisos registrados; não contam como instâncias de framework |
| Observação de latência | docs/sprint-6/medir_telemetria.py | python-api/.venv/Scripts/python.exe docs/sprint-6/medir_telemetria.py | 20 respostas válidas; sem SLA e sem cobertura de código |

Cada linha abaixo identifica uma instância efetivamente executada e a relaciona ao cenário detalhado na seção 2. Ferramenta, comando, pré-condições, esperado, obtido e incidente também estão expandidos em `INVENTARIO_AUTOMATIZADO.csv`. Nomes técnicos de métodos e descrições originais do framework são preservados como identificadores, embora o texto analítico do relatório seja em português. Não houve cobertura de código medida.

| CT | Ferramenta | Arquivo | Método/dataset/descrição original | Resultado | Evidência estruturada |
| --- | --- | --- | --- | --- | --- |
| CT-027 | PHPUnit | backend/tests/Unit/ExampleTest.php | test_example | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_catalog_contains_exactly_the_expected_unique_identifiers | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "latitude" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "longitude" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "altitude" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "velocity" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "temperature" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "power_consumption" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "battery" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "pitch" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "roll" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "yaw" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "signal" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "data_rate" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "snr" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "latency" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_units_symbols_and_types_are_correct with data set "communication_status" | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_every_definition_has_only_the_required_metadata | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Unit/TelemetryUnitCatalogTest.php | test_communication_status_describes_the_two_categories_without_a_unit | passou | backend-final.xml |
| CT-018 | PHPUnit | backend/tests/Feature/AuthAccessTest.php | test_login_issues_a_working_token_and_logout_revokes_it | passou | backend-final.xml |
| CT-018 | PHPUnit | backend/tests/Feature/AuthAccessTest.php | test_inactive_users_cannot_login | passou | backend-final.xml |
| CT-018 | PHPUnit | backend/tests/Feature/AuthAccessTest.php | test_only_managers_can_create_users | passou | backend-final.xml |
| CT-018 | PHPUnit | backend/tests/Feature/AuthAccessTest.php | test_development_password_tokens_are_unavailable_in_production | passou | backend-final.xml |
| CT-027 | PHPUnit | backend/tests/Feature/EnvironmentTest.php | test_tests_use_an_isolated_database | passou | backend-final.xml |
| CT-027 | PHPUnit | backend/tests/Feature/EnvironmentTest.php | test_api_returns_401_without_a_json_accept_header | passou | backend-final.xml |
| CT-027 | PHPUnit | backend/tests/Feature/EnvironmentTest.php | test_sanctum_token_can_authenticate_a_user | passou | backend-final.xml |
| CT-027 | PHPUnit | backend/tests/Feature/ExampleTest.php | test_example | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_create_list_and_update_a_mission | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_invalid_status_is_rejected | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_missions_are_listed_by_increasing_id | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_comments_belong_to_one_mission | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_bulk_updates_and_deletion_preserve_other_missions | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_deleting_one_mission_deletes_its_comments | passou | backend-final.xml |
| CT-017 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_finished_missions_require_confirmation_individually_and_in_bulk | passou | backend-final.xml |
| CT-017 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_period_and_lifecycle_actions_are_recorded | passou | backend-final.xml |
| CT-017 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_bulk_status_changes_also_update_actual_dates | passou | backend-final.xml |
| CT-017 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_deletion_of_completed_missions_requires_confirmation | passou | backend-final.xml |
| CT-016 | PHPUnit | backend/tests/Feature/MissionApiTest.php | test_budget_is_preserved_and_invalid_values_are_rejected | passou | backend-final.xml |
| CT-026 | PHPUnit | backend/tests/Feature/MissionPersistenceTest.php | test_mission_fields_and_status_changes_are_persisted | passou | backend-final.xml |
| CT-021 | PHPUnit | backend/tests/Feature/NasaIntegrationTest.php | test_all_event_routes_forward_validated_dates | passou | backend-final.xml |
| CT-021 | PHPUnit | backend/tests/Feature/NasaIntegrationTest.php | test_invalid_dates_do_not_reach_nasa_and_upstream_failure_returns_502 | passou | backend-final.xml |
| CT-021 | PHPUnit | backend/tests/Feature/NasaIntegrationTest.php | test_mission_and_integration_routes_require_authentication | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/OrbitControllerTest.php | test_authenticated_user_can_get_satellite_position | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/OrbitControllerTest.php | test_unauthenticated_user_cannot_get_satellite_position | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/OrbitControllerTest.php | test_invalid_calculation_time_is_rejected | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/OrbitControllerTest.php | test_python_api_connection_failure_returns_503 | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/OrbitControllerTest.php | test_invalid_python_response_returns_502 | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/OrbitControllerTest.php | test_calculation_time_is_forwarded_to_python_api | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_requires_authentication | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_operator_can_create_manual_satellite | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_manual_satellite_requires_name_and_orbit | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_manual_orbit_limits_are_validated | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_celestrak_satellite_gets_name_from_celestrak | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_celestrak_satellite_requires_norad_and_rejects_orbit | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_duplicate_norad_is_rejected | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_celestrak_failure_without_name_returns_502_but_name_allows_save | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_analyst_cannot_write_and_operator_cannot_delete | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_user_without_role_cannot_write | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_update_manual_satellite_changes_orbit_and_resets_epoch | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_update_rejects_identity_changes_and_invalid_values | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_manager_deletes_satellite_with_history | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteCrudTest.php | test_index_filters_and_show | passou | backend-final.xml |
| CT-026 | PHPUnit | backend/tests/Feature/SatelliteMissionMigrationTest.php | test_link_migration_reuses_and_preserves_the_satellite_catalog | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_manual_position_uses_simulation_endpoint | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_celestrak_position_uses_norad_endpoint | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_position_propagates_python_errors | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_position_returns_503_when_python_is_down | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_manual_telemetry_returns_position_and_persists_everything | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_telemetry_is_kept_when_position_fails | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_telemetry_python_failures | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_sensors_for_manual_satellite | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_positions_of_active_satellites_isolates_failures | passou | backend-final.xml |
| CT-020 | PHPUnit | backend/tests/Feature/SatelliteMonitoringTest.php | test_unknown_satellite_returns_404 | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteSensorControllerTest.php | test_sensor_proxy_preserves_the_python_response | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteSensorControllerTest.php | test_sensor_proxy_handles_upstream_errors_and_invalid_payloads | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteSensorControllerTest.php | test_sensor_proxy_requires_authentication | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_returns_telemetry_and_persists_satellite_reading_and_alert | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_does_not_duplicate_satellite_when_telemetry_is_requested_again | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_marks_alert_as_resolved_when_it_is_no_longer_returned | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_returns_bad_gateway_when_python_response_is_invalid | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_returns_bad_gateway_when_python_returns_http_error | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_returns_service_unavailable_when_python_connection_fails | passou | backend-final.xml |
| CT-019 | PHPUnit | backend/tests/Feature/SatelliteTelemetryControllerTest.php | test_it_continues_saving_telemetry_if_celestrak_fails | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_import_and_required_mission_relationship | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_source_failure_does_not_create_satellite | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_search_returns_matches_without_storing_them | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_search_handles_missing_results | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_search_handles_source_errors | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_orbital_data_is_returned_for_registered_satellite | passou | backend-final.xml |
| CT-015 | PHPUnit | backend/tests/Feature/SatelliteTest.php | test_orbital_data_rejects_mismatched_satellite | passou | backend-final.xml |
| CT-025 | PHPUnit | backend/tests/Feature/ServiceOrderTest.php | test_order_crud_and_mission_satellite_consistency | passou | backend-final.xml |
| CT-001 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct001_altitude_limits with data set #0 | passou | backend-final.xml |
| CT-001 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct001_altitude_limits with data set #1 | passou | backend-final.xml |
| CT-001 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct001_altitude_limits with data set #2 | passou | backend-final.xml |
| CT-001 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct001_altitude_limits with data set #3 | passou | backend-final.xml |
| CT-002 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct002_pagination_limits with data set #0 | passou | backend-final.xml |
| CT-002 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct002_pagination_limits with data set #1 | passou | backend-final.xml |
| CT-002 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct002_pagination_limits with data set #2 | passou | backend-final.xml |
| CT-002 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct002_pagination_limits with data set #3 | passou | backend-final.xml |
| CT-003 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct003_missing_records_return_404 | passou | backend-final.xml |
| CT-004 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct004_invalid_bulk_is_atomic | passou | backend-final.xml |
| CT-005 | PHPUnit | backend/tests/Feature/SprintSixTest.php | test_ct005_alerts_with_same_code_preserve_each_parameter | falhou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Feature/TelemetryUnitsTest.php | test_units_endpoint_returns_all_definitions_without_authentication | passou | backend-final.xml |
| CT-024 | PHPUnit | backend/tests/Feature/TelemetryUnitsTest.php | test_existing_user_endpoint_still_requires_authentication | passou | backend-final.xml |
| CT-023 | pytest | python-api/tests/test_alerts.py | test_low_battery_generates_alert | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_alerts.py | test_offline_communication_generates_critical_alert | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_alerts.py | test_normal_telemetry_returns_no_alerts | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_alerts.py | test_missing_sensor_generates_sensor_failure_alert | passou | python-final.xml |
| CT-027 | pytest | python-api/tests/test_health.py | test_root | passou | python-final.xml |
| CT-027 | pytest | python-api/tests/test_health.py | test_health_check | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_sgp4_position_has_geodetic_values | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_simulated_orbit_altitude_speed_and_latitude_limit | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_simulated_orbit_is_periodic_in_inertial_frame | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_equatorial_orbit_stays_on_equator | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_polar_orbit_reaches_the_pole | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_endpoint_simulate_ok | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbit_simulation.py | test_endpoint_simulate_validation | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_calculate_satellite_position | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_calculation_time_requires_timezone | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_calculate_position_using_norad_id | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_calculate_position_rejects_datetime_without_timezone | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_satellite_not_found | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_orbital_data_source_unavailable | passou | python-final.xml |
| CT-022 | pytest | python-api/tests/test_orbits.py | test_invalid_omm_record_returns_422 | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_get_satellite_sensors_returns_success | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_sensor_response_has_expected_structure | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_sensor_values_are_within_simulated_ranges | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_invalid_satellite_id_is_rejected | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_sensor_response_contains_new_telemetry_fields | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_new_telemetry_values_are_within_expected_ranges | passou | python-final.xml |
| CT-023 | pytest | python-api/tests/test_sensors.py | test_communication_status_has_consistent_status | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[battery_level-19.99-LOW_BATTERY-True] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[battery_level-20-LOW_BATTERY-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[battery_level-20.01-LOW_BATTERY-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[internal_temperature-39.99-HIGH_INTERNAL_TEMPERATURE-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[internal_temperature-40-HIGH_INTERNAL_TEMPERATURE-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[internal_temperature-40.01-HIGH_INTERNAL_TEMPERATURE-True] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[voltage-24.99-LOW_VOLTAGE-True] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[voltage-25-LOW_VOLTAGE-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[voltage-31-HIGH_VOLTAGE-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[voltage-31.01-HIGH_VOLTAGE-True] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[gyroscope_x--4.51-HIGH_ANGULAR_VELOCITY-True] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[gyroscope_x--4.5-HIGH_ANGULAR_VELOCITY-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[gyroscope_x-4.5-HIGH_ANGULAR_VELOCITY-False] | passou | python-final.xml |
| CT-006 | pytest | python-api/tests/test_sprint6.py | test_ct006_alert_boundaries[gyroscope_x-4.51-HIGH_ANGULAR_VELOCITY-True] | passou | python-final.xml |
| CT-007 | pytest | python-api/tests/test_sprint6.py | test_ct007_telemetry_alerts_match_returned_sensors | passou | python-final.xml |
| CT-008 | pytest | python-api/tests/test_sprint6.py | test_ct008_communication_decision_table[online-None] | passou | python-final.xml |
| CT-008 | pytest | python-api/tests/test_sprint6.py | test_ct008_communication_decision_table[offline-COMMUNICATION_LOST] | passou | python-final.xml |
| CT-008 | pytest | python-api/tests/test_sprint6.py | test_ct008_communication_decision_table[unknown-SENSOR_FAILURE] | passou | python-final.xml |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) opens the drawer and renders the sections | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) theme preference applies light theme to <html> and cookie | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) theme preference applies dark theme to <html> and cookie | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) theme preference applies system theme: stores cookie and applies a resolved light or dark class | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) sidebar variant selecting floating updates layout_variant cookie | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) sidebar variant selecting sidebar updates layout_variant cookie | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) sidebar variant selecting inset updates layout_variant cookie after another variant | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) selecting full layout sets collapsible to offcanvas and closes sidebar | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) section reset buttons resets theme via section control after choosing dark | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) section reset buttons resets direction via section control after choosing RTL | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) section reset buttons resets sidebar style via section control after choosing floating | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) section reset buttons resets layout via section control after choosing compact | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) changes direction and applies it to <html dir> | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) updates layout: selecting non-default closes sidebar and changes layout cookie | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/config-drawer.test.tsx | ConfigDrawer (integration) reset restores defaults across sidebar/theme/layout/direction | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog renders title, description, and default buttons | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog calls handleConfirm when the confirm button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog disables confirm when disabled is true | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog when isLoading is true, disables cancel and confirm | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog supports custom button texts | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog renders confirm as submit button linked to desc form when `form` is set | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog submits the desc form when confirm is clicked (form prop, no handleConfirm) | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog submits the form when Enter key is pressed | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/confirm-dialog.test.tsx | ConfirmDialog does not submit the form when confirm is disabled (typed confirmation mismatch) | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/password-input.test.tsx | PasswordInput renders the password input correctly | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/password-input.test.tsx | PasswordInput toggles the password visibility when the show password button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/password-input.test.tsx | PasswordInput disables the show password button when the password input is disabled | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/components/password-input.test.tsx | PasswordInput works with FormLabel and react-hook-form field spread | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/components/sign-out-dialog.test.tsx | Laravel logout revokes the server token and clears the session and cache | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/components/sign-out-dialog.test.tsx | Laravel logout does not revoke the token when cancelled | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu renders the command palette when the palette is open | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu does not show the dialog content when search is closed | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu opens the command menu when Ctrl + K is pressed | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu opens the command menu when Cmd + K is pressed | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu navigates to a top-level route and closes the palette when a nav item is selected | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu navigates for nested sidebar items (group with sub-items) | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu applies theme and closes the palette when a theme command is chosen | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/context/search-provider.test.tsx | SearchProvider and CommandMenu shows empty state when the filter matches nothing | falhou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts reads every satellite page and sends the current Bearer token | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts uses the login and user envelopes and restores the real role | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts maps the mission array and preserves save and transition payloads | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts handles HTTP 401 without silently succeeding | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts handles HTTP 403 without silently succeeding | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts handles HTTP 404 without silently succeeding | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts handles HTTP 422 without silently succeeding | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts handles HTTP 500 without silently succeeding | passou | frontend-final.json |
| CT-011 | Vitest/Chromium | frontend/src/lib/api.test.ts | Laravel API contracts rejects redirects to external origins | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/cookies.test.ts | cookies stores a value that can be read back | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/cookies.test.ts | cookies clears a value so it is no longer readable | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError shows a generic message when the error is not recognised | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError maps a plain object with status 204 to the no-content message | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError prefers the API title when the error is an Axios error with response data | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError falls back to the generic message when Axios response has no data.title | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError falls back to the generic message when Axios data.title is an empty string | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError logs the error to the console in development | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/handle-server-error.test.ts | handleServerError does not log the error to the console in production | passou | frontend-final.json |
| CT-009 | Vitest/Chromium | frontend/src/lib/meter-color.test.ts | CT-009: semáforo de telemetria valor 0 recebe #ff5263 | passou | frontend-final.json |
| CT-009 | Vitest/Chromium | frontend/src/lib/meter-color.test.ts | CT-009: semáforo de telemetria valor 29.99 recebe #ff5263 | passou | frontend-final.json |
| CT-009 | Vitest/Chromium | frontend/src/lib/meter-color.test.ts | CT-009: semáforo de telemetria valor 30 recebe #fbbf24 | passou | frontend-final.json |
| CT-009 | Vitest/Chromium | frontend/src/lib/meter-color.test.ts | CT-009: semáforo de telemetria valor 69.99 recebe #fbbf24 | passou | frontend-final.json |
| CT-009 | Vitest/Chromium | frontend/src/lib/meter-color.test.ts | CT-009: semáforo de telemetria valor 70 recebe #10dba4 | passou | frontend-final.json |
| CT-009 | Vitest/Chromium | frontend/src/lib/meter-color.test.ts | CT-009: semáforo de telemetria valor 100 recebe #10dba4 | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/utils.test.ts | getPageNumbers returns all pages when total is at most 5 | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/utils.test.ts | getPageNumbers shows ellipsis near the beginning | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/utils.test.ts | getPageNumbers shows ellipsis near the end | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/utils.test.ts | getPageNumbers shows ellipsis on both side in the middle | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/lib/utils.test.ts | getPageNumbers handles current page greater than total pages | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/stores/auth-store.test.ts | useAuthStore starts with an empty access token when nothing is persisted | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/stores/auth-store.test.ts | useAuthStore persists access token so a new store instance reads it back | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/stores/auth-store.test.ts | useAuthStore clears persisted access token when resetAccessToken is used | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/stores/auth-store.test.ts | useAuthStore updates the signed-in user via setUser | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/stores/auth-store.test.ts | useAuthStore reset clears user and access token and drops persistence | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState derives pagination from search with defaults | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState uses default page and pageSize when search omits them | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState clamps negative effective page via pageIndex | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState onPaginationChange omits page and pageSize from search when they match defaults | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState onPaginationChange writes non-default page and pageSize | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState supports custom pagination search keys | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState reads globalFilter from search and onGlobalFilterChange updates URL and clears page | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState clears filter key in URL when global filter becomes empty after trim | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState does not trim global filter when trim is false | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState omits globalFilter and onGlobalFilterChange when global filter is disabled | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState builds array column filters from search | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState builds string column filters from search | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState onColumnFiltersChange merges serialized filters into search and clears page | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState ensurePageInRange navigates with replace when current page exceeds pageCount | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState ensurePageInRange resets to last page when resetTo is last | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState ensurePageInRange does not navigate when page is in range | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/hooks/use-table-url-state.test.ts | useTableUrlState uses custom serialize and deserialize for column filters | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-import-dialog.test.tsx | TasksImportDialog renders the dialog with the correct title, description, file input and buttons | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-import-dialog.test.tsx | TasksImportDialog shows validation when submitting without a file | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-import-dialog.test.tsx | TasksImportDialog calls showSubmittedData and closes when a CSV file is imported | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-import-dialog.test.tsx | TasksImportDialog closes the dialog when Close is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx | TasksMultiDeleteDialog renders the dialog with the correct title, description, input and buttons | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx | TasksMultiDeleteDialog keeps the delete button disabled until the confirm delete input is filled correctly | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx | TasksMultiDeleteDialog closes the dialog when the cancel button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx | TasksMultiDeleteDialog resets the confirm delete input when the dialog is closed and reopened | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx | TasksMultiDeleteDialog shows the submitted data when deleted successfully | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx | TasksMultiDeleteDialog deletes successfully when press Enter key on the confirm delete input | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx | CT-030: formulário de missão apresenta título e descrição de criação | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx | CT-030: formulário de missão apresenta edição com os valores recebidos | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx | CT-030: formulário de missão rejeita os campos obrigatórios vazios sem salvar | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx | CT-030: formulário de missão envia a missão válida e fecha após a confirmação do serviço | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx | CT-030: formulário de missão fecha pelo botão Fechar | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx | CT-030: formulário de missão limpa o título de rascunho ao fechar e reabrir | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog add user renders title and description | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog add user shows validation messages when the form is submitted with empty fields | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog add user keeps confirm password disabled until password field is touched | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog add user shows password validation messages when password is invalid | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog add user shows the submitted data when the form is submitted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog edit user renders title and description | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog edit user submits without password changes | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog edit user requires confirm password when password is changed | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-action-dialog.test.tsx | UsersActionDialog edit user shows the submitted data when the form is submitted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-delete-dialog.test.tsx | UsersDeleteDialog renders the dialog with the correct title, description, input and buttons | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-delete-dialog.test.tsx | UsersDeleteDialog keeps the delete button disabled until the username input is filled correctly | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-delete-dialog.test.tsx | UsersDeleteDialog closes the dialog when the cancel button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-delete-dialog.test.tsx | UsersDeleteDialog resets the username input when the dialog is closed and reopened | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-delete-dialog.test.tsx | UsersDeleteDialog shows the submitted data when deleted successfully | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-delete-dialog.test.tsx | UsersDeleteDialog deletes successfully when press Enter key on the username input | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-invite-dialog.test.tsx | UsersInviteDialog renders the dialog title and description | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-invite-dialog.test.tsx | UsersInviteDialog closes when the dialog close button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-invite-dialog.test.tsx | UsersInviteDialog closes when Cancel is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-invite-dialog.test.tsx | UsersInviteDialog shows error messages when submitting empty form, and clears them as fields are filled | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-invite-dialog.test.tsx | UsersInviteDialog resets entered values when the dialog is closed and reopened | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-invite-dialog.test.tsx | UsersInviteDialog shows submitted data when the form is submitted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog renders the dialog with the correct title, description, input and buttons | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog keeps the delete button disabled until the confirm delete input is filled correctly | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog closes the dialog when the cancel button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog resets the confirm delete input when the dialog is closed and reopened | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog shows the submitted data when deleted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/userscopy/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog deletes successfully when press Enter key on the confirm delete input | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog add user renders title and description | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog add user shows validation messages when the form is submitted with empty fields | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog add user keeps confirm password disabled until password field is touched | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog add user shows password validation messages when password is invalid | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog add user shows the submitted data when the form is submitted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog edit user renders title and description | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog edit user submits without password changes | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog edit user requires confirm password when password is changed | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-action-dialog.test.tsx | UsersActionDialog edit user shows the submitted data when the form is submitted successfully | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-delete-dialog.test.tsx | UsersDeleteDialog renders the dialog with the correct title, description, input and buttons | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-delete-dialog.test.tsx | UsersDeleteDialog keeps the delete button disabled until the username input is filled correctly | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-delete-dialog.test.tsx | UsersDeleteDialog closes the dialog when the cancel button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-delete-dialog.test.tsx | UsersDeleteDialog resets the username input when the dialog is closed and reopened | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-delete-dialog.test.tsx | UsersDeleteDialog shows the submitted data when deleted successfully | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-delete-dialog.test.tsx | UsersDeleteDialog deletes successfully when press Enter key on the username input | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-invite-dialog.test.tsx | UsersInviteDialog renders the dialog title and description | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-invite-dialog.test.tsx | UsersInviteDialog closes when the dialog close button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-invite-dialog.test.tsx | UsersInviteDialog closes when Cancel is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-invite-dialog.test.tsx | UsersInviteDialog shows error messages when submitting empty form, and clears them as fields are filled | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-invite-dialog.test.tsx | UsersInviteDialog resets entered values when the dialog is closed and reopened | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-invite-dialog.test.tsx | UsersInviteDialog shows submitted data when the form is submitted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog renders the dialog with the correct title, description, input and buttons | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog keeps the delete button disabled until the confirm delete input is filled correctly | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog closes the dialog when the cancel button is clicked | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog resets the confirm delete input when the dialog is closed and reopened | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog shows the submitted data when deleted successfully | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/users/components/users-multi-delete-dialog.test.tsx | UsersMultiDeleteDialog deletes successfully when press Enter key on the confirm delete input | falhou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/features/auth/forgot-password/components/forgot-password-form.test.tsx | Development password recovery shows the server development token | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/features/auth/forgot-password/components/forgot-password-form.test.tsx | Development password recovery shows the failure without a token | passou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/auth/sign-up/components/sign-up-form.test.tsx | SignUpForm renders fields and submit button | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/auth/sign-up/components/sign-up-form.test.tsx | SignUpForm shows validation messages when submitting empty form | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/auth/sign-up/components/sign-up-form.test.tsx | SignUpForm shows a mismatch error when passwords do not match | falhou | frontend-final.json |
| CT-030 | Vitest/Chromium | frontend/src/features/auth/sign-up/components/sign-up-form.test.tsx | SignUpForm disables submit while submitting and re-enables after timeout | falhou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/features/auth/sign-in/components/user-auth-form.test.tsx | Laravel login form submits credentials and navigates after the login service succeeds | passou | frontend-final.json |
| CT-012 | Vitest/Chromium | frontend/src/features/auth/sign-in/components/user-auth-form.test.tsx | Laravel login form keeps the user on the login page after failure | passou | frontend-final.json |


Conferência final dos entregáveis: `validar_entregaveis.py` verifica títulos, campos dos 35 CT, evidências, rastreabilidade, contagens dos frameworks, percentuais e ausência de alteração de produção. A aprovação desse verificador é documental e não converte testes reprovados em aprovados. O histórico preserva uma falha inicial da própria regra documental e a correção explicada em `evidencias/preparacao.md`.

Estado Git conferido em `evidencias/git-final.log`: branch de trabalho da Sprint 6, HEAD inicial/final `3799ff303c9158f36bcb28bf89103baba899d087`, sem novo commit, merge ou push; arquivos permanecem prontos para revisão e commit. O inventário `INTEGRIDADE_SHA256.csv` registra SHA256 dos documentos, testes e evidências entregues, excluindo a si próprio e `evidencias/validacao-final.log`, que é produzido após o inventário para evitar referência circular.

Capturas reais complementares: `evidencias/captura-busca.png` e `evidencias/captura-cadastro-legado.png`, geradas pelo Vitest/Chromium nos cenários reprovados. `evidencias/capturas.json` informa origem e hash; são cópias sem edição. As demais falhas permanecem integralmente rastreáveis por logs e relatórios estruturados, sem exigir que imagens ignoradas do diretório frontend sejam versionadas.
