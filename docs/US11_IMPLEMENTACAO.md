# US11 — Configurar parâmetros de monitoramento

História oficial: “Como engenheiro de sistemas, quero poder configurar os parâmetros de monitoramento, para acompanhar as condições dos equipamentos.” Prioridade alta. Implementação validada em 16/11/2026; alterações deixadas no workspace, sem commit, push ou merge.

## Estrutura identificada e decisão

A tela oficial é frontend/src/features/monitoring/index.tsx. A seleção usa selectedId e o satélite da lista persistida. LiveTelemetry e useTelemetry consultam /api/satellites/{id}/monitoring/telemetry. SatelliteMonitoringService recebe sensores e alertas do Python, calcula posição complementar e chama TelemetryRecorder em transação. Este grava telemetry_readings e sincroniza satellite_alerts por código e parâmetro. O endpoint legado por NORAD também usa TelemetryRecorder.

Foram examinados modelos, migrations, rotas autenticadas, controllers de sensores/telemetria, SatelliteMonitoringService, TelemetryRecorder, sensor_service.py, alert_service.py e testes existentes. Não havia persistência de limites por satélite. Os padrões fixos Python incluem temperatura interna >40 °C, bateria <20% e tensão fora de 25–31 V, além de regras para outros sensores.

US11 torna configuráveis **temperatura interna, bateria e tensão**. Esses sensores já existem e têm unidades e regras bem definidas. Não foram criados sensores ou limites arbitrários para altitude. Os outros sensores e regras de comunicação/falha permanecem sob a avaliação existente do Python. Não há novo sistema de notificações.

## Backend e persistência

A migration 2026_11_16_000001_add_monitoring_limits_to_satellites adiciona uma coluna JSON nullable, monitoring_limits, em satellites. Não há backfill, remoção ou substituição de registros. A migration foi aplicada ao ambiente local com `php artisan migrate --force`. Não foram apagados dados ou volumes.

Cada satélite recebe seu próprio objeto com os três sensores e quatro limites por sensor:

```json
{
  "internal_temperature": {"min": null, "max": 40, "critical_min": null, "critical_max": null},
  "battery_level": {"min": 20, "max": null, "critical_min": null, "critical_max": null},
  "voltage": {"min": 25, "max": 31, "critical_min": null, "critical_max": null}
}
```

Os valores padrão vêm das regras existentes. Limites críticos não existiam para esses sensores: permanecem desativados por padrão. null desativa um limite. Antes do primeiro salvamento, nenhuma configuração é gravada por uma consulta e a telemetria legada é preservada integralmente.

Endpoints protegidos por auth:sanctum:

- `GET /api/satellites/{satellite}/monitoring/limits`: retorna configuração própria ou padrões.
- `PUT /api/satellites/{satellite}/monitoring/limits`: recebe `{"limits": {...}}`, substitui o objeto completo após validação e retorna o objeto salvo.

Leitura segue o acesso autenticado existente. Escrita exige conta ativa com papel gerente ou operador, os mesmos papéis de edição de satélites. Não foi inventado um papel novo de engenheiro. Sem autenticação: 401; sem papel permitido: 403; satélite inexistente: 404; configuração inválida: 422.

Validação definitiva no Laravel: três parâmetros conhecidos, quatro campos presentes por parâmetro, números ou null, ordem `critical_min ≤ min ≤ max ≤ critical_max` ignorando valores desativados; bateria entre 0 e 100; tensão não negativa; temperatura não inferior ao zero absoluto (-273,15 °C). Temperatura e tensão têm teto técnico de entrada 1.000.000, não apresentado como limite de operação seguro do equipamento. Para configurar parcialmente, o cliente deve enviar os valores atuais dos outros campos.

## Aplicação dos limites

MonitoringLimits::apply é executado no SatelliteMonitoringService antes da gravação e resposta. Também é aplicado à telemetria legada por NORAD quando o satélite já está cadastrado. O frontend não replica fórmulas de avaliação.

Para cada sensor configurável com valor numérico finito:

1. Remove os alertas anteriores daquele parâmetro, preservando SENSOR_FAILURE.
2. Compara o valor aos limites configurados: fora de crítico → status critical; fora de mínimo/máximo → warning; dentro → normal.
3. Igualdade ao limite não dispara alerta. Crítico tem prioridade.
4. Insere alerta MONITORING_LIMIT com parâmetro, valor, unidade, threshold e severidade critical ou high.
5. Recalcula total_alerts. Alertas de outros sensores/comunicação permanecem presentes.

TelemetryRecorder recebe o resultado final: a classificação salva é a mesma apresentada pela API e os alertas seguem a sincronização existente. Alterar configurações não reescreve leituras históricas nem gera telemetria por si só. Na tela, o salvamento invalida a consulta da telemetria do satélite correspondente para obter a próxima leitura. Como os sensores são aleatórios/simulados, não se promete que o valor medido permaneça igual ao atualizar.

## Frontend

**Monitoramento → selecionar satélite → Configurações de Monitoramento**, logo abaixo do cartão de detalhes atuais e antes das seções de passagens/eventos. URL: http://localhost:5173/monitoramento. Não há página nova.

O formulário mostra unidades, valores persistidos, limites mínimos/máximos e críticos opcionais; permite salvar e exibe confirmação/erros. Usuários sem papel de edição veem campos desabilitados. O backend também exige autorização.

As queries usam chave por satélite e AbortSignal. O componente e o formulário são recriados com chave específica ao trocar a seleção: alterações não salvas são descartadas, e o formulário não reutiliza limites de outro satélite. Uma gravação já enviada permanece vinculada ao ID original, inclusive na invalidação de cache. Não se utiliza localStorage para persistir limites.

## Arquivos da US11

Criados:

- backend/database/migrations/2026_11_16_000001_add_monitoring_limits_to_satellites.php
- backend/app/Http/Controllers/MonitoringLimitsController.php
- backend/app/Services/MonitoringLimits.php
- backend/tests/Feature/MonitoringLimitsTest.php
- frontend/src/features/monitoring/components/monitoring-limits.tsx
- docs/US11_IMPLEMENTACAO.md

Alterados:

- backend/app/Models/Satellite.php (cast JSON)
- backend/routes/api.php (GET/PUT)
- backend/app/Services/SatelliteMonitoringService.php (avaliação antes de persistir)
- backend/app/Http/Controllers/SatelliteTelemetryController.php (compatibilidade por NORAD)
- frontend/src/features/monitoring/index.tsx (seção integrada)
- frontend/src/features/monitoring/components/live-telemetry.tsx (chaves de lista para alertas do mesmo código)
- frontend/scripts/integration-smoke.mjs (salvar/recarregar configurações)

Os arquivos da US01 já presentes no workspace foram preservados; seu download integrado continua coberto pelo smoke.

## Testes e evidências executados

| Caso | Esperado | Procedimento e resultado obtido | Status |
| --- | --- | --- | --- |
| CT-US11-001 | Consultar padrões/próprios | GET retorna 40 °C e 20%, sem gravar defaults; ID inexistente retorna 404 | Aprovado |
| CT-US11-002 | Salvar autorizado | PUT de operador grava JSON; resposta e modelo fresh conferidos | Aprovado |
| CT-US11-003 | Rejeitar limites inconsistentes | Cinco cenários: bateria 101%, tensão mínima maior que máxima, temperatura abaixo de zero absoluto, texto, crítico máximo abaixo de alerta; 422 sem escrita parcial | Aprovado |
| CT-US11-004 | Independência por satélite | Salvar 75 °C em A mantém B em 40 °C | Aprovado |
| CT-US11-005 | Aplicar classificação e alertas | Mesmo payload de 72 °C com limites diferentes resulta warning, normal e critical no endpoint e na leitura persistida; alerta crítico confirmado no banco isolado | Aprovado |
| CT-US11-006 | Persistência após recarregar | Chromium salva 75 °C pelo formulário real e confirma o valor após reload; GET e modelo fresh também conferidos | Aprovado |
| CT-US11-007 | Controle de acesso | Sem login: GET/PUT 401; visitante lê mas recebe 403 ao gravar | Aprovado |
| CT-US11-008 | Regressão | 124 testes backend; smoke real de login, cadastro manual, FastAPI, missões, dashboard, US01, usuários e logout; payload sem configuração preservado | Aprovado |

Comandos na raiz:

```powershell
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php vendor/phpunit/phpunit/phpunit --no-progress
# OK (124 tests, 821 assertions)
```

Para executar apenas os seis métodos novos (vários cobrem mais de um CT), acrescente `--filter MonitoringLimitsTest` ao comando PHPUnit. A suíte completa foi executada em SQLite isolado; nenhum teste usou o banco MariaDB do usuário como banco descartável.

Em frontend:

```powershell
npm run build
# Vite e TypeScript: exit code 0
npm run lint
# ESLint: exit code 0
$env:PHP_BINARY = 'C:\Users\willc\AppData\Local\Temp\mission-control-php84\php.exe'
npm run test:integration
```

O caminho PHP acima é específico desta máquina. O runner exige PHP >=8.4.1 com SQLite, Python com dependências instaladas e Chromium. Ele utiliza banco temporário e portas 15173/18000/18001, sem apagar volumes existentes. Saídas reais:

```text
PASS US11: monitoring configuration saved through React and persisted after reload.
PASS US01: navigation, authenticated real CSV downloads for three datasets, UTF-8 BOM and empty date filter feedback.
PASS: route guard, login, manual satellite, FastAPI telemetry, mission creation/edit/transition, dashboard, session reload, manager user creation and logout.
```

## Teste manual

1. Inicie a infraestrutura com `docker compose up -d`. A migration já foi aplicada localmente; em outra instalação, execute `docker compose exec app php artisan migrate`.
2. Em frontend, execute `npm run dev` e abra http://localhost:5173/monitoramento com uma conta existente de gerente/operador.
3. Selecione o satélite, localize a seção abaixo dos detalhes e ajuste temperatura máxima para 60 e crítica máxima para 80, por exemplo. Clique em Salvar configurações.
4. Recarregue: os valores permanecem. Troque de satélite: cada um tem suas configurações.
5. Use Atualizar leitura em Telemetria e alertas para conferir classificação e alertas. Os valores são simulados; para provocar alerta de temperatura nos dados gerados habitualmente (10–45 °C), use um máximo menor que a leitura atual.
6. Envie mínimo maior que máximo para verificar validação. Teste com usuário sem papel de edição para verificar acesso somente leitura.

## Limitações

- Apenas os três sensores indicados são configuráveis nesta entrega. Altitude e demais sensores mantêm a lógica anterior; não há base histórica suficiente para inventar um limite orbital padrão universal.
- Endpoints diretos de sensores e API Python independente continuam exibindo avaliações padrão Python; a configuração persistida é aplicada aos endpoints Laravel de telemetria que alimentam a tela oficial e o histórico. Nenhum contrato desses serviços independentes foi alterado.
- Sensores são simulados; as configurações não controlam equipamento físico.
- A cobertura integrada prova salvar/recarregar; não foi realizado um ensaio automatizado de rede lenta para todas as ordens de respostas. O isolamento por chave/ID e cancelamento está implementado.
- Sem auditoria de alterações ou controle de concorrência entre dois editores simultâneos; o último salvamento válido prevalece.
- Não se declara a suíte completa herdada de frontend aprovada. Foram executados build, lint e smoke integrado para esta entrega, além da suíte completa do backend.
