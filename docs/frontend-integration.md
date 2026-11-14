# Incorporação do frontend — 14/11/2026

## Git e origem dos arquivos

- Branch de trabalho: `integration/final-mission-control`, inicialmente limpa.
- `git fetch --all --prune` executado antes da cópia.
- Base anterior preservada no commit `e504023` e na tag
  `backup/pre-frontend-integration`.
- Origem: `origin/frontend`, commit `8eb9104`, com histórico independente.
- Cópia via `git archive` com seleção explícita, sem merge ou cherry-pick.
- Importados 290 arquivos originais: `src/`, `public/`, arquivos TypeScript,
  Vite, ESLint, Prettier, `components.json`, `knip.config.ts`, `index.html`,
  `package.json`, `package-lock.json` e `.gitignore`.
- Não importados: `backend/` da branch fonte (incluía vendor e caches),
  `pnpm-lock.yaml`, configurações pessoais de VS Code, deploy Netlify,
  `node_modules`, `.env`, builds e o gerado `routeTree.gen.ts`.
- Nenhum arquivo de `backend/`, `python-api/` ou `compose.yaml` foi alterado
  nesta etapa. A branch de comunicação não foi mesclada. Nenhum push foi feito.

## Adaptações

- Cliente Axios único em `frontend/src/lib/api.ts`: origem por ambiente,
  `Accept: application/json`, Bearer token e expiração por 401 em consultas e
  mutações. Logout revoga token e limpa sessão/cache; novo login limpa dados
  da conta anterior. Redirecionamentos externos após login são rejeitados.
- Login real substitui o token fictício. O guard de rotas carrega `/api/user`
  para restaurar nome e papel após recarregar a aplicação. Perfil e sidebar
  mostram o usuário autenticado.
- `listSatellites` percorre `data` e `last_page`, com até 100 itens por página,
  usando o mesmo contrato no painel, monitoramento e formulário de missão.
  Não usa URLs internas do paginator como destino de chamadas.
- Mantidos mapeamentos de missões (`name`→`title`, `operator_name`→`Operador`,
  orçamento decimal, datas e relação de satélite), edição, comentários,
  operações em lote, exclusão e confirmação de reabertura.
- Cadastro manual conectado ao CRUD oficial, respeitando papel de gerente ou
  operador. Mantidas busca/importação CelesTrak. O botão de adicionar também
  existe quando a frota está vazia.
- Satélites manuais usam `/monitoring/position`; satélites CelesTrak mantêm
  propagação SGP4 com satellite.js a partir dos elementos da API.
- Telemetria e alertas do FastAPI são exibidos como **sensores simulados**.
  Bateria e temperatura usam os valores recebidos. Não são medições físicas.
  O diagrama orbital continua identificado como ilustrativo.
- Gestão de usuários usa cadastro real por gerente e mostra os criados nesta
  sessão. Não apresenta uma lista fictícia como se fosse o cadastro do banco.
- Cadastro público foi substituído por orientação para solicitar acesso.
  Recuperação chama o endpoint existente e informa que ele apenas gera token
  de desenvolvimento; não afirma que houve envio de e-mail.
- Comunicacões e painel legado de alertas foram preservados e marcados como
  demonstração. Não há envio de comandos reais nem Socket.IO implementado.
- Corrigidos testes de login, logout e recuperação para os fluxos reais.
  Adicionados testes de contratos e runner de integração com serviços reais.

## Endpoints usados

Todos os caminhos são relativos à origem Laravel, não à origem FastAPI.

| Área | Endpoints e contrato utilizado |
| --- | --- |
| Sessão | `POST /api/login` → `token` e `user`; `GET /api/user` → `{user}`; `POST /api/logout`. |
| Missões | `GET/POST /api/missions`, `PUT /api/missions/{id}`, `GET /api/missions/{id}`, `POST /api/missions/{id}/comments`, `POST /api/missions/{id}/transition`, `POST /api/missions/bulk`. Listagem é array; formulário envia os nomes reais dos campos. |
| Satélites | `GET /api/satellites` → paginator `{data,last_page,total,...}`; `POST /api/satellites` → `{satellite,...}` para cadastro manual; busca `/api/satellites/search` → `{data,truncated}`; `POST /api/satellites/import` → objeto com `id`. |
| Orbital | `GET /api/satellites/{id}/orbit` → `elements` OMM, `retrieved_at`; `GET /api/satellites/{id}/monitoring/position` → `orbital_position` com `latitude`, `longitude`, `altitude_km`, `orbital_speed_km_s`. |
| Sensores | `GET /api/satellites/{id}/monitoring/telemetry` → `simulated`, `timestamp`, `sensors`, `alerts`, `orbital_position`; o backend persiste a leitura. |
| Recepção | `GET /api/satellites/{id}/reception` → `signal` e `observation` públicos SatNOGS; consulta não é feita para satélites sem NORAD. |
| Usuários | `POST /api/users` com `name`, `email`, `password`, `password_confirmation`, `role_id`; somente gerente. |
| Recuperação | `POST /api/forgot-password`, disponível apenas em local/testing. Redefinição por `/api/reset-password` existe no backend, mas ainda não tem formulário nesta etapa. |

401 limpa sessão e redireciona; 403 mantém a sessão e indica falta de permissão;
404 indica registro ausente; 422 expõe mensagens de validação no formulário de
missão/cadastro; 500 e falhas de serviço apresentam erro sem inventar sucesso.
Esses códigos estão cobertos pelos testes do cliente HTTP. Telas legadas podem
manter mensagens genéricas para falhas de operações em lote e comentários.

## Telas

| Tela | Resultado |
| --- | --- |
| Login/logout e sessão | Operacionais com Sanctum; testados com Laravel real. |
| Dashboard | Frota, missões, orçamento e avisos derivados de dados reais. Validado com frota manual; CelesTrak/SatNOGS dependem de disponibilidade externa. |
| Missões | Lista, criação, edição, transição e comentários conectados. Criação/edição/início testados no navegador; restante coberto por contratos e PHPUnit. |
| Satélites | Listagem e cadastro manual operacionais; busca/importação mantidas e autenticadas. Consulta de CelesTrak ao vivo não foi usada no smoke test. |
| Monitoramento | Posição manual e telemetria FastAPI validadas em execução real. Propagação satellite.js mantida para OMM real. Globo permanece ilustrativo. |
| Gestão e dados | Seu acesso e criação por gerente operacionais. Sem listagem geral, edição, exclusão ou convite por ausência de endpoints. Código de perfil precisa ser informado pelo administrador. |
| Recuperação | Geração de token de desenvolvimento conectada; envio de e-mail e formulário de redefinição pendentes. |
| Cadastro público | Informa a restrição de acesso; não simula criação de conta. |
| Comunicações | Demonstração trazida pela própria branch frontend, preservada para a próxima etapa; nenhuma integração com a outra branch. |
| Alertas/manutenção legado, chats, apps, configurações de conta | Componentes de demonstração/template preservados. Telemetria conectada fica no monitoramento; não confundir tabelas legadas com dados persistidos. |

## Resultados reais

| Verificação | Resultado |
| --- | --- |
| `npm ci` | Sucesso com o lock importado e novamente com o lock final: 462 pacotes. |
| `npm run build` | Sucesso, incluindo TypeScript. Aviso de chunk principal acima de 500 kB. |
| `npm run lint` | Sucesso: zero erros e um aviso de Fast Refresh em `tasks-columns.tsx`. |
| Testes de autenticação adaptados | 6/6 aprovados, em Chromium. |
| Novos testes `src/lib/api.test.ts` | 9/9 aprovados: Bearer, paginação, envelopes, payloads, 401/403/404/422/500 e redirect seguro. |
| Suíte completa Vitest | **115 aprovados, 46 falhas, 161 testes**; 15 arquivos passaram e 10 falharam. A suíte completa não está verde. Nenhum teste herdado foi excluído da execução para ocultar falhas. |
| `npm run test:integration` | Sucesso em Chromium com Laravel, FastAPI e SQLite temporário: guard, login, cadastro manual, telemetria, criação/edição/início de missão, dashboard, restauração após reload, cadastro por gerente e logout. |
| PHPUnit backend | **93 testes, 607 assertions, sucesso**, PHP 8.4.27 e SQLite em memória. |
| `npm audit` | Inicialmente 20 alertas: 18 moderados e 2 altos. Atualizações compatíveis de zod e follow-redirects removeram os altos. Restam **18 moderados**, sem alertas altos/críticos; dependências de ferramentas e seroval ainda precisam de revisão. Não foi aplicado `audit fix --force`. |

As falhas remanescentes estão em testes herdados: menu de busca (7), diálogos
de usuários do template (11), diálogos da cópia legada de usuários (17), exclusão
múltipla antiga de tarefas (1), drawer de missão sem QueryClientProvider (6) e
formulário público de cadastro antigo, fora do fluxo oficial (4). Há seletores
de textos antigos, caracteres corrompidos e expectativas do template. A suíte
original já contém divergências entre esses testes e seus componentes; não foi
executada uma segunda instalação intocada da branch fonte para quantificar uma
baseline independente. O fluxo oficial foi validado separadamente conforme acima.

Uma tentativa inicial de build/lint ocorreu enquanto `npm ci` ainda estava em
execução e falhou por ausência dos executáveis. A primeira suíte completa teve
100 aprovações/55 falhas; os testes de autenticação foram então adaptados. A
primeira tentativa do smoke runner encontrou falha interna do fetch do Node;
foi substituído por `node:http` e as execuções posteriores passaram.

## Próxima etapa e limites

- Nenhum endpoint ou tabela foi inventado para acomodar formatos do React.
  Listagem/edição de usuários e consulta de perfis precisam de trabalho backend
  específico. O formulário aceita `role_id` existente, validado pelo Laravel.
- O operador de missão ainda é texto livre no backend; o formulário legado
  oferece os nomes predefinidos da branch de origem, sem vínculo com usuários.
- Algumas telas legadas de template ainda usam fixtures; permanecem fora do
  fluxo oficial de gestão de usuários e o painel de alertas está sinalizado.
- Revisar os 46 testes herdados, os 18 alertas moderados e o tamanho dos chunks
  antes de tratar esta branch como pronta para publicação.
- Docker/MariaDB, implantação estática, APIs externas ao vivo e autenticação SPA
  por cookies não foram validados nesta etapa. O fluxo oficial usa Bearer.
- Seguem válidas as pendências de banco com dados antigos e permissões descritas
  em `integration-baseline.md`.
- Para a comunicação, manter `src/features/communications` e
  `src/routes/_authenticated/comunicacoes` como pontos de integração. Seu estado
  atual é demonstração, sem mistura de histórico da branch restante.
