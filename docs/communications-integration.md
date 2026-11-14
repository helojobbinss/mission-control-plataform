# Comunicação e acompanhamento — integração seletiva

Branch de trabalho: `integration/final-mission-control`.
Base preservada: `3799ff3`, também marcada como `backup/pre-communications-integration`.
Fonte comparada: `origin/feature/telas-comunicacao-acompanhamento`, commit
`8e0e12f`, aplicação em `telas-cumunicação-acompanhamento/`.

O fetch foi executado com a árvore limpa. A referência remota `origin/main` já
apontava para `3799ff3` nesta execução; a `main` local permaneceu em `5cabd72`.
Esta etapa não modifica nenhuma delas, não faz merge convencional nem push.

## Matriz de decisão

Os caminhos da coluna fonte são relativos à aplicação da branch de comunicação;
os caminhos oficiais são relativos a `frontend/`. A comparação foi feita antes
de qualquer alteração de implementação.

| Arquivo oficial | Arquivo da fonte | Diferença e funcionalidade adicional | Risco de substituir | Decisão |
| --- | --- | --- | --- | --- |
| `src/features/communications/components/comms-console.tsx` | Mesmo caminho | Idêntico; já chegou via frontend. Seleção de canais fixos, filtros, prioridade, notas e reenvio. | Duplicar o módulo sem adicionar comportamento. | Reutilizar e adaptar rótulos e operador autenticado. |
| `src/features/communications/data/messages.ts` | Mesmo caminho | Idêntico; exemplos, comandos e respostas locais. | Apresentar exemplos como tráfego real. | Preservar fixtures sob modo demonstrativo explícito. |
| `src/features/communications/hooks/use-comm-channel.ts` | Mesmo caminho | Idêntico; temporizadores para beacon e ACK/falha, sem transporte externo. | Perder mensagens ao trocar de rota e reintroduzir timers sem limite. | Manter o simulador, colocar seu ciclo de vida no layout autenticado e limitar memória. |
| `src/features/communications/index.tsx` | Mesmo caminho | Igual, exceto aviso demonstrativo já adicionado ao oficial. | Remover o aviso e manter o texto “AO VIVO”. | Consolidar como demonstração integrada, com pausa de beacons. |
| `src/features/monitoring/components/telemetry-chart.tsx` | Mesmo caminho | Idêntico, mas ainda sem uso no monitoramento oficial. Curvas geradas por `telemetryAt`. | Apresentar curva sintética como histórico recebido. | Incorporar ao monitoramento com amostras da API e preservar a interface de demonstração original. |
| `src/features/monitoring/components/orbit-view.tsx` | Mesmo caminho | Oficial recebe a frota por props; fonte importa sempre a frota fixa. | Perder a seleção dos satélites cadastrados. | Preservar o componente oficial. |
| `src/features/monitoring/data/fleet.ts` | Mesmo caminho | Idêntico; satélites, estações, passagens e parâmetros fictícios. | Misturar exemplos e cadastro oficial. | Usar apenas como catálogo demonstrativo/ilustração existente. |
| `src/features/monitoring/index.tsx` | Mesmo caminho | Fonte usa só fixtures e eventos/passagens fixos. Oficial usa Laravel, FastAPI, cadastro manual, OMM e satellite.js. | Alto: remover cadastro e fontes conectadas. | Não substituir a tela. Adaptar gráfico e lista de eventos às leituras recebidas. |
| `src/features/dashboard/index.tsx` | Mesmo caminho | Fonte tem indicadores estáticos; oficial consulta missões e frota. | Alto: trocar dados cadastrados por exemplos. | Preservar integralmente o dashboard oficial. |
| `src/features/auth/sign-in/components/user-auth-form.tsx` e `src/stores/auth-store.ts` | Mesmos caminhos | Fonte faz login fictício e não contém ajustes da integração. | Alto: remover Sanctum e restauração da sessão. | Preservar os arquivos oficiais. |
| `src/routes/_authenticated/route.tsx` | Mesmo caminho | Fonte não tem o guard Laravel existente. | Alto: expor navegação sem validar sessão. | Preservar o guard oficial. |
| `src/components/layout/data/sidebar-data.ts` | Mesmo caminho | Fonte tem entrada adicional de display e outra configuração de marca; os módulos pedidos já estão no oficial. | Substituição desnecessária de navegação e marca. | Preservar sidebar; validar seus links SPA. |
| Rotas `comunicacoes/index.tsx` e `monitoramento/index.tsx` | Mesmos caminhos em `src/routes/_authenticated/` | Idênticas. | Duplicação de rotas. | Reutilizar sem criar novos caminhos. |
| `package.json` | `package.json` | Mesmas faixas de React 19, Tailwind 4, React Query e Recharts. Fonte não contém satellite.js nem o runner integrado. | Remover dependências e scripts necessários. | Preservar manifesto e lock npm, sem novas dependências. |

Não se copiou uma segunda aplicação nem se removeram módulos oficiais.
“Descartado” nesta matriz significa **não sobrepor a versão oficial**, sem apagar
o arquivo da branch fonte ou componentes úteis já incorporados.

Os ZIPs `back-branch-users-role.zip`, `front-branch-frontend.zip` e `patches.zip`
foram identificados na árvore Git, mas não abertos nem copiados: os oito arquivos
de comunicação/monitoramento procurados existem completos no código, sem
evidência de funcionalidade faltante que justifique consultar versões compactadas.

## Funcionalidades consolidadas

- Console de demonstração com seis canais fixos por satélite de exemplo,
  filtros de uplink/downlink/notas, prioridade, simulação de envio, ACK/falha,
  fila local sem enlace e reenvio de comandos com falha.
- Novas notas e comandos usam o nome do usuário autenticado; os exemplos antigos
  continuam identificados pelo contexto demonstrativo.
- Mensagens permanecem ao navegar entre módulos autenticados. O provider é
  identificado pela conta e desmontado no logout; reload também reinicia a
  demonstração. Não há persistência no servidor ou em armazenamento local.
- Beacons automáticos podem ser pausados e retomados. Isso controla apenas os
  beacons, não congela a confirmação de comandos já simulados.
- Histórico do console limitado a 300 mensagens; timers concluídos são liberados
  e timers pendentes são cancelados ao desmontar a sessão.
- Gráfico de bateria, temperatura, tensão e corrente no monitoramento, com até
  40 timestamps distintos recebidos de `/api/satellites/{id}/monitoring/telemetry`.
  Valores ausentes/textuais/não finitos ficam sem ponto, nunca viram zero fictício.
- Histórico separado por id interno no cache React Query, preservado entre
  rotas e elegível para descarte após 30 minutos sem observadores. Não é uma
  consulta ao histórico persistido do Laravel; logout limpa o cache.
- Eventos com horário UTC, severidade e código derivados dos alertas das leituras
  recebidas. A lista anterior da leitura atual também foi preservada.
- O gráfico mantém a interface original para curva demonstrativa local, com
  identificação própria. A tela oficial usa a interface de amostras recebidas.

## O que é real e o que é simulado

| Camada | Implementação observada |
| --- | --- |
| Login, missões, cadastro e gestão por gerente | API Laravel/Sanctum existente, preservada. |
| Posição manual e telemetria no monitoramento | Chamadas reais Laravel → FastAPI. Os sensores do FastAPI são simulados, identificados como tal; a leitura é persistida pelo Laravel. |
| Satélites CelesTrak | Consulta de elementos e propagação satellite.js existentes, preservadas. |
| Console, canais e estações de comunicação | Fixtures e estado React na memória da sessão, sem vínculo com o cadastro real. |
| ACK, falha e fila de comandos | Simulação por `setTimeout`; não há transmissão nem garantia de entrega externa. Fila sem enlace não é processada automaticamente. |
| Beacons de comunicação | `setInterval` local a cada 12 segundos; não é polling de servidor. |
| Atualização da telemetria conectada | HTTP com React Query a cada 60 segundos e botão de atualização. Não é WebSocket. |

Não há endpoint, WebSocket, SSE, CRUD de canais ou cadastro de estações para o
console nos serviços inspecionados. Nenhuma infraestrutura de tempo real foi
introduzida. As confirmações do console nunca significam que um satélite real
executou um comando.

## Validação

O runner `frontend/scripts/integration-smoke.mjs` foi ampliado para navegar por
links entre painel, missões, monitoramento/cadastro de satélites, comunicação e
gestão de usuários. Ele verifica que uma propriedade da janela continua presente
durante as trocas de rota, detectando recarregamentos indevidos.

O fluxo cria uma nota local, simula PING/ACK, passa por outros módulos e verifica
que a nota continua no console. Também verifica ausência de requisições a API de
comunicação e mantém o fluxo anterior de cadastro manual, telemetria FastAPI,
criação/edição/início de missão, login, restauração da sessão e logout. Usa apenas
SQLite temporário e recusa portas ocupadas.

| Check | Resultado real |
| --- | --- |
| `npm run build` | Sucesso com Vite e TypeScript; permanece aviso de chunk principal acima de 500 kB. |
| `npm run lint` | Sucesso: zero erros, um aviso de Fast Refresh já existente em `tasks-columns.tsx`. |
| Testes novos | **7/7 aprovados**: ciclo de comando/ACK, fila offline, falha/reenvio/nota, pausa/cleanup, limite/ordenação de amostras, valores ausentes e timestamp inválido. |
| Regressão de autenticação/contratos + testes novos | **22/22 aprovados**, seis arquivos em Chromium. |
| Suíte completa | **168 testes: 122 aprovados e 46 falhas**, nos mesmos dez arquivos herdados da etapa anterior. Não é uma suíte verde. Os novos arquivos passaram e nenhum teste foi excluído da execução. |
| `npm run test:integration` | Sucesso em Chromium com Laravel, FastAPI e SQLite temporário. Módulos anteriores, gráfico e console demonstrativo validados; links SPA não recarregaram a aplicação. |
| `git diff --check` | Sucesso. |
| Compatibilidade | Manifesto e lockfile inalterados, nenhuma dependência instalada/adicionada nesta etapa. |

O primeiro build detectou uma tipagem de cache possivelmente indefinido e o lint
detectou um import usado só como tipo; ambos foram corrigidos. O teste inicial
de timers emitiu avisos de `act`, corrigidos no helper de avanço de tempo; a
reexecução dos sete testes passou sem esses avisos.

As 46 falhas herdadas seguem nos testes de busca, diálogos legados de usuários,
exclusão múltipla antiga de tarefas, drawer sem QueryClientProvider e cadastro
público antigo, conforme detalhado em `frontend-integration.md`. A primeira
execução da suíte completa desta etapa preservou as mesmas contagens de falhas;
a revisão final de formatação e do helper de timers foi validada pelos checks
direcionados e pelo smoke test, sem excluir os casos herdados.

## Pendências

- Comunicações continuam demonstrativas por ausência de backend; não há cadastro
  dinâmico de canais/estações nem histórico de mensagens compartilhado entre usuários.
- Passagens/eventos fixos da fonte não foram incorporados como previsões reais.
  Cálculos de passagem exigem estações com coordenadas e um contrato específico.
- Gráfico usa somente as leituras recebidas nesta sessão. Consulta histórica e
  paginação de telemetria persistida exigem endpoint backend próprio.
- Permanecem as limitações de usuários, permissões e banco documentadas nas etapas
  anteriores. APIs externas ao vivo e Docker/MariaDB não fazem parte do smoke
  isolado; o cenário validado usa um satélite manual e SQLite.
- Não se corrigiram nesta etapa os testes legados do template sem relação com as
  funcionalidades incorporadas. Os resultados reais da suíte completa são relatados.
