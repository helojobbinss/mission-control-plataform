# Plano de testes — Sprint 6

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

