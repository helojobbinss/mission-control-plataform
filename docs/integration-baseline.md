# Base de integração — 14/11/2026

Branch: `integration/final-mission-control`, criada de `origin/main` em
`5cabd7276c7dde6faf58f19d14d1a431be68dac2`, após `fetch --all --prune`.
A árvore inicial estava limpa. A `main` local e a remota apontavam ao mesmo commit.

## Histórico verificado

- `features/apis`, `feature/telemetry-units`, `feature/users-role` e `missoes`
  são ancestrais da `main` (`merge-base --is-ancestor`, saída 0).
- `frontend` não possui ancestral comum (`merge-base`, saída 1).
- `feature/telas-comunicacao-acompanhamento` tem ancestral comum `8eb8031`.
- Nenhuma dessas duas branches restantes foi integrada. Nenhum push foi feito.

## Diagnóstico e correções

| Módulo | Estado observado nesta etapa |
| --- | --- |
| Laravel | Framework 12.71.0 e Sanctum 4.3.3 no lock; bootstrap com Kernel e providers explícitos. Não é necessário recriar a estrutura. O lock exige PHP >= 8.4.1. |
| Autenticação | Login emite Bearer token, `/user` usa envelope `user`, logout remove o token, contas inativas não fazem login. Cadastro exige papel `gerente`. Testados. |
| Missões | CRUD, comentários, operações em lote, ciclo de vida, datas e orçamento. As rotas agora existem em todos os ambientes com `auth:sanctum`, inclusive no desenvolvimento. |
| Satélites | Mantida listagem paginada, CRUD com permissões e monitoramento por id interno ou NORAD. Removida rota duplicada. Adicionado relacionamento `missions` e sua inclusão na listagem. Importação usa `source=celestrak`, consistente com filtros e cadastro. |
| Telemetria | Catálogo público de 15 unidades; sensores simulados, persistência de leituras e sincronização de alertas. Integração Python testada com respostas simuladas. |
| Ordens de serviço | CRUD com exclusão lógica, associações de missão/satélite/alerta validadas. Fluxo básico e rejeição de satélite incompatível testados. |
| NASA | `self::queryNasaEvents` não tinha implementação e era chamado no escopo de closures de rotas. Substituído por controller com validação de datas, padrão UTC e resposta 502 para falhas externas; mantidos os três caminhos existentes. |
| FastAPI | Órbitas SGP4 e simulação circular, sensores, telemetria, alertas e health. Dependências originais instaladas sem alterar `requirements.txt`. Imagem Python 3.11 adicionada ao Compose. |
| Docker | PHP ajustado de 8.3 para 8.4, nome `dockerfile` corrigido para sistemas sensíveis a maiúsculas, SQLite disponível para testes. Laravel usa `db:3306` e `python-api:8001` na rede interna. MariaDB 11.4 e volume existente preservados. |

## Banco e migrations

A migration `2026_11_05_000006` tentava criar novamente `satellites`, já criada
em 01/11 e ampliada em 03/11. Ela agora apenas vincula missões ao catálogo
existente. Seu rollback remove apenas a chave de missões, preservando satélites.
Teste de regressão confirma preservação do catálogo no ciclo down/up.

As migrations completas passam em SQLite em memória. Relações observadas:
`missions.satellite_id` restringe exclusão; comentários são removidos em cascata;
leituras e alertas pertencem ao satélite com cascata; ordens restringem exclusão
de operador, missão e satélite e anulam o alerta quando ele é removido.

**Banco com dados anteriores:** a migration de vínculo continua recusando aplicar
se já existirem missões. É necessário preparar um mapeamento revisado das missões
para satélites e uma migração de dados antes de prosseguir nesse cenário. Não se
atribuiu satélite arbitrário nem se excluiu dado. Nenhuma migration foi executada
em banco existente nesta etapa.

## Configuração local sem credenciais versionadas

1. Copiar `.env.example` da raiz para `.env`. Preencher `DB_PASSWORD` e
   `DB_ROOT_PASSWORD` localmente. `DB_DATABASE` e `DB_USERNAME` têm os nomes de
   desenvolvimento já usados no projeto. Em volume MariaDB existente, usar as
   credenciais atuais: alterar variáveis não troca a senha de um banco inicializado.
2. Copiar `backend/.env.example` para `backend/.env`, caso ainda não exista.
   Nunca substituir um arquivo de colaborador já configurado.
3. Executar `docker compose build`, `docker compose up -d`,
   `docker compose exec app composer install` e
   `docker compose exec app php artisan key:generate` (apenas se `APP_KEY` estiver vazia).
4. Conferir `docker compose exec app php artisan migrate:status` e aplicar
   `docker compose exec app php artisan migrate` após revisar o cenário do banco.
   Não usar `migrate:fresh`, `db:wipe` nem remover volumes.
5. Executar `docker compose exec app php artisan db:seed --class=RoleSeeder`.
   O `DatabaseSeeder` não chama esse seeder. O primeiro gerente deve ser criado
   localmente por um responsável (por exemplo, via Tinker e `Hash::make`), pois
   não existe cadastro público nem conta padrão distribuída.

| Variável | Uso |
| --- | --- |
| `APP_ENV`, `APP_DEBUG`, `APP_URL` | Exemplo local: `local`, `true`, `http://127.0.0.1:8000`. Produção exige configuração própria. |
| `APP_KEY` | Gerada localmente; não versionar nem substituir chave de ambiente existente. |
| `DB_CONNECTION` | `mysql`, compatível com MariaDB. |
| `DB_HOST`, `DB_PORT` | Host: `127.0.0.1:3307`; Compose sobrescreve com `db:3306`. |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | No Compose são propagadas da raiz para Laravel e MariaDB; fora dele configurar também em `backend/.env`. |
| `DB_ROOT_PASSWORD` | Somente inicialização do MariaDB no Compose. |
| `PYTHON_API_URL` | Host: `http://127.0.0.1:8001`; Compose: `http://python-api:8001`. Serviço Python não publica porta no host. |
| `NASA_DONKI_BASE_URL`, `NASA_API_KEY` | URL oficial e `DEMO_KEY` no exemplo; chave própria é opcional e fica apenas no ambiente local. |
| `CELESTRAK_BASE_URL` | Base configurável do serviço de integração; alguns métodos legados de busca/importação ainda usam URL fixa. |
| `CACHE_DRIVER`, `SESSION_DRIVER`, `QUEUE_CONNECTION`, `MAIL_MAILER` | Desenvolvimento: `file`, `file`, `sync`, `log`. Recuperação por e-mail real ainda não implementada. |

Para rodar Python no host: usar Python 3.11, criar ambiente virtual, instalar
`python-api/requirements.txt` e executar, dentro de `python-api`,
`python -m uvicorn app.main:app --host 127.0.0.1 --port 8001`.

## Validação realizada

- `git status`, `branch -a`, `fetch --all --prune`, `log` e `merge-base`: executados.
- Composer: instalação original bloqueada pelo PHP global 8.2.12; instalação
  concluída com PHP 8.4.27 temporário oficial e SHA256 verificado, sem atualizar lock.
- PHPUnit 11.5.57: **93 testes, 607 assertions, sucesso**, com SQLite `:memory:`.
  Comando: `php vendor/phpunit/phpunit/phpunit --no-progress`, dentro de `backend`.
  Corrigidos provider não estático, chave ausente de testes, arquivo de sensores
  com controller no lugar de teste e expectativas antigas incompatíveis com os
  envelopes existentes. A chave pública em `phpunit.xml` é exclusiva dos testes.
- Python: tentativa inicial sem dependências falhou na coleta; Python global 3.14
  não instala o NumPy 2.2.6 sem compilação. Ambiente isolado Python 3.11.17 com
  requirements originais: **27 passed**, um aviso de depreciação Starlette/httpx.
  Comando: `python -m pytest -q`, dentro de `python-api`.
- `php artisan route:list --path=api -v --except-vendor`: **40 rotas**, missões,
  importação, busca e monitoramento protegidos por Sanctum.
- `docker compose config --quiet`: sucesso com placeholders de validação em
  variáveis do processo, sem salvar credenciais. O CLI avisou que seu arquivo de
  configuração do Docker não era acessível no sandbox.
- Docker build/up e execução contra MariaDB **não realizados**: daemon Docker
  indisponível (`docker info`: pipe `docker_engine` inexistente). SQLite não
  substitui a validação de DDL e FKs no MariaDB.
- NASA/CelesTrak ao vivo e tráfego Laravel→FastAPI em contêineres **não validados**;
  testes utilizam mocks/fixtures. Não dependeram de rede externa para passar.
- `git diff --check`: sucesso.

## Pendências e limites para a próxima etapa

- Inicializar Docker e validar build, migrations e fluxo completo no MariaDB.
- Missões antigas precisam de plano explícito de associação, conforme acima.
- `users.role_id` não tem FK no schema atual. Política por papel de missões e
  ordens ainda não é granular; a importação exige autenticação, mas não repete
  as restrições por papel do cadastro de satélites. Não foram inventadas regras.
- Exclusões de satélites/missões referenciados são bloqueadas por FKs, mas seus
  controllers ainda podem responder 500 em vez de um conflito de negócio.
- Desativar conta ou redefinir senha não revoga automaticamente tokens anteriores.
- Recuperação retorna token apenas em `local/testing`; fora desses ambientes
  responde 403 até existir entrega segura de e-mail. CORS permanece aberto para
  Bearer e não suporta sessão SPA com cookies; revisar na implantação.
- Nenhum `.env` real, vendor, node_modules, log, SQLite ou bytecode foi encontrado
  entre os arquivos versionados inspecionados. O cache gerado
  `backend/.phpunit.cache/test-results` estava versionado: retirado do índice e
  ignorado, preservando a cópia local. Senhas fixas de desenvolvimento
  estavam no Compose: removidas do estado atual, mas permanecem no histórico.
  Se utilizadas em ambiente real, precisam ser rotacionadas pelos responsáveis.
  Não houve reescrita de histórico nem auditoria exaustiva de todos os commits.
- O README descreve funcionalidades planejadas (React, Socket.IO, dashboards).
  Elas não estão implementadas na `main` inspecionada. Nenhum endpoint foi criado
  para fingir sua existência.

## Preparação para frontend

A base está pronta para iniciar a integração de código do frontend, com as
ressalvas de infraestrutura acima. Utilizar `/api/login` e enviar
`Authorization: Bearer <token>` nas rotas protegidas. Consumir `/api/user` pelo
campo `user` e `/api/satellites` pelo envelope paginado `data`/`total`; missões
continuam retornando lista. A inclusão de `missions` na listagem de satélites é
aditiva. As rotas NORAD e as rotas por id interno têm significados diferentes.
Compatibilidade das telas será verificada na etapa seguinte, sem merge de
históricos independentes nesta etapa.
