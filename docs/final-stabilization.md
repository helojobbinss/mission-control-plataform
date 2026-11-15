# Estabilização final do MVP — 14/11/2026

## Arquitetura e execução

Um frontend oficial: `frontend/`. O Compose contém `frontend` (Node 22/Vite,
porta 5173), `nginx` (porta 8000), `app` (PHP 8.4/FPM/Laravel 12), `db`
(MariaDB 11.4, volume persistente) e `python-api` (Python 3.11/FastAPI).

O navegador usa `/api` pelo proxy Vite → nginx → Laravel. Laravel acessa
`db:3306` e `python-api:8001`. Sanctum usa Bearer token; não se criou outro
sistema de autenticação. O Python tem healthcheck e a aplicação aguarda sua
prontidão e a do banco. O `frontend` tem volume próprio de node_modules e usa
`npm ci` do lockfile. A primeira inicialização pode levar alguns minutos.

Os comandos de instalação, configuração do banco, conta de demonstração e URLs
estão no início do README. O `.env` da raiz contém as credenciais do Compose;
`backend/.env` contém `APP_KEY`, `APP_ENV` e opções Laravel. Em execução fora do
Docker, configure também DB_HOST/PORT/PASSWORD em `backend/.env`; os valores
definidos pelo Compose prevalecem nos contêineres.

Variáveis externas opcionais: `NASA_API_KEY` (exemplo público DEMO_KEY),
`NASA_DONKI_BASE_URL`, `CELESTRAK_BASE_URL`. Nunca colocar credenciais em
`VITE_*`, pois essas variáveis são públicas no bundle.

## Correções desta etapa

- Edição de nome, estado e parâmetros manuais de satélite pela interface;
  exclusão por gerente com confirmação e tratamento do conflito de vínculos.
- Restrições de FK na exclusão respondem 409 com mensagem de negócio, sem SQL
  interno. Satélite associado a missão é preservado; a exclusão de cadastro sem
  vínculos continua removendo leituras/alertas em cascata.
- Importação CelesTrak agora respeita a mesma permissão de escrita do cadastro:
  gerente ou operador. Analista continua podendo consultar a frota.
- Tokens Sanctum expiram em 1440 minutos por padrão. Contas inativas não podem
  reutilizar tokens antigos; redefinição de senha revoga os tokens anteriores.
- Cookies do cliente têm SameSite=Lax e Secure quando usados em HTTPS. O Bearer
  continua acessível ao cliente JavaScript como no contrato existente; não é
  uma sessão SPA por cookie HttpOnly. Logout limpa token e cache.
- `DatabaseSeeder` chama `RoleSeeder` de forma idempotente. `DemoSeeder`, opt-in,
  cria um gerente apenas em local/testing e exige senha de pelo menos 12 caracteres.
  Conta existente não é sobrescrita. Não há credencial padrão ativada automaticamente.
- Nova FK nullable `users.role_id → roles.id`, com exclusão restrita. A migration
  se recusa a alterar banco com usuários órfãos, exigindo revisão dos vínculos.
- Runner ampliado para comentários, operações em lote, editar/excluir satélite,
  credenciais erradas, usuário operador, expiração e reinicialização de serviços.
- Router oficial FastAPI passou a registrar `/api/v1/orbits/simulate`. A versão
  anterior estava apenas no router legado usado por testes isolados. O módulo
  legado agora reexporta o router oficial, preservando os imports existentes.
  Foi adicionado teste da aplicação oficial e o E2E exige resposta 200 da posição.
- Bootstrap PHPUnit sincroniza os valores de testes em getenv, $_ENV e $_SERVER
  e recusa configurações fora de SQLite em memória antes de qualquer migration.
  Isso evita que variáveis do Docker ou configuração em cache direcionem testes
  destrutivos a banco existente. URLs de integrações dos testes são isoladas.

Nenhum banco existente foi apagado. Não foram usados `migrate:fresh`/`db:wipe`
em banco existente, reset Git ou force push. O RefreshDatabase do PHPUnit é
restrito a SQLite descartável em memória. A `main` não foi modificada nesta etapa.

## Validação isolada

`npm run test:integration` usa SQLite temporário por padrão. Para executar com
MariaDB 11.4 descartável, requer Docker, PHP >=8.4.1 com PDO MySQL/SQLite,
vendor do Composer, Python 3.11 com requirements e Chromium do Playwright:

```powershell
cd frontend
$env:PHP_BINARY = 'C:\caminho\php84\php.exe'
$env:PYTHON_BINARY = 'C:\caminho\ambiente-python\Scripts\python.exe'
$env:SMOKE_DATABASE = 'mysql'
npm run test:integration
```

Nesta sessão foram usados PHP 8.4.27 temporário oficial, o ambiente Python
`.venv-integration` e **MariaDB 11.4.13** no contêiner criado pelo runner.
O runner exige portas 18000, 18001, 15173 e 13317 livres, cria o banco
`mission_control_smoke` em contêiner de nome aleatório, verifica o destino antes
de migrar e remove apenas seus próprios recursos ao terminar. Credenciais do
banco são aleatórias e não são versionadas nem impressas.

`npm run test:compose` valida os cinco serviços por um Compose gerado em pasta
temporária, com projeto e volumes próprios. Requer as imagens `app` e
`python-api` construídas pelo comando do README, backend/vendor instalado e
porta 15174 livre. Não usa volumes externos ou o banco do ambiente principal.
O teste verifica o banco efetivo antes de migrar, cria a conta pelo DemoSeeder
e faz login atravessando o proxy Vite.

## Cenários E2E

| Cenário solicitado | Resultado e evidência |
| --- | --- |
| A — Login → painel → missão → consulta | **APROVADO** em MariaDB: missão, descrição e comentário são persistidos e consultados. Edição, início e atualização em lote também passaram. Credenciais erradas são rejeitadas; operador não recebe formulário de criação de usuários e token expirado retorna ao login. |
| B — Satélite → cadastro → dados → monitoramento | **APROVADO**: cadastro manual, edição de altitude, visualização e exclusão permitida. Excluir satélite com missão vinculada retorna 409 e preserva os registros. |
| C — Telemetria → indicadores | **APROVADO**: chamadas Laravel → FastAPI, sensores simulados identificados, leituras e gráficos. |
| D — Console de comunicação | **APROVADO COMO DEMONSTRAÇÃO**: nota local, PING/ACK por temporizador e aviso explícito. Nenhuma chamada a API de comunicação. |
| E — Reiniciar serviços → consultar persistência | **APROVADO**: Laravel, Python, Vite e MariaDB reiniciados; missão, descrição, comentário e sessão continuam disponíveis. Mensagens locais do console não têm persistência prometida após reload. |

O teste também verifica links SPA entre dashboard, missões, cadastro/monitoramento,
comunicação e usuários, sem reload durante a navegação normal. A reinicialização
do cenário E é explícita e separada dessa verificação.

## Resultado dos checks

- PHPUnit: **98 testes, 621 assertions, aprovados**, SQLite em memória; inclui
  expiração, conta inativa, reset de senha, integridade, importação e seeders.
- pytest: **28 aprovados**, um aviso de depreciação Starlette/httpx.
- Vitest completo: **168 testes: 122 aprovados e 46 falhas herdadas** nos mesmos
  dez arquivos já documentados. Nenhum teste foi excluído ou desativado para
  melhorar a contagem. As falhas são de busca e componentes legados do template,
  incluindo textos antigos, fixtures e provider ausente no teste do drawer.
- Vitest direcionado final: **29/29 aprovados**, cobrindo contratos, cookies,
  store de sessão, login/logout/recuperação, simulador e histórico de leituras.
- Build de produção: aprovado com TypeScript; aviso de chunk acima de 500 kB.
- Lint: aprovado, zero erros e um aviso de Fast Refresh herdado.
- Rotas Laravel: **40 rotas**, autenticação preservada nas APIs operacionais.
- Imagens Docker app/Python: construídas com sucesso.
- Compose de cinco serviços: **APROVADO** com guard de banco, migrations,
  DemoSeeder, navegador, posição manual e telemetria. PHPUnit dentro do contêiner:
  **98 testes/621 assertions**; pytest no contêiner: **28 aprovados**.
- `git diff --check`: aprovado na revisão final.

**NÃO EXECUTADO:** integração ao vivo com NASA/CelesTrak/SatNOGS (o E2E usa
cadastro manual e os testes de falha externa usam mocks); edição/listagem geral
de usuários e consulta histórica por período (endpoints ausentes); implantação
pública em produção (fora do escopo local). Isso não altera os resultados A–E
acima e não deve ser apresentado como funcionalidade já validada.

O Docker estava inicialmente parado e foi iniciado. A primeira checagem Compose
enviou Accept JSON à página HTML do Vite (404); o teste foi corrigido para
reproduzir navegação HTML. A carga inicial no Docker Desktop também ultrapassou
o timeout de três segundos; a checagem passou com espera de vinte segundos.
Essas tentativas não apagaram bancos existentes.

A execução completa detectou depois a rota de simulação ausente no app oficial
e nove falhas do PHPUnit causadas pela precedência de variáveis Docker em
$_SERVER. O router e o bootstrap foram corrigidos e os testes foram repetidos
com sucesso. Um SQLite local gerado por essa tentativa foi identificado como
artefato exclusivo do teste e removido; não entrou no Git. As execuções finais
recusam esse destino e usam somente memória ou volumes/projetos descartáveis.

## O que demonstrar

1. Iniciar o sistema e entrar com o gerente criado pelo seeder opt-in.
2. Mostrar o painel vazio ou os cadastros já persistidos, sem afirmar KPIs fictícios.
3. Em Monitoramento, adicionar satélite **manual** para não depender de APIs externas.
4. Editar a altitude e mostrar posição **calculada por simulação circular**.
5. Criar missão vinculada, abrir detalhes, comentar, editar e alterar estado.
6. Atualizar telemetria e mostrar sensores **simulados pelo FastAPI** e o gráfico
   das leituras recebidas nesta sessão. As leituras são gravadas no banco.
7. Abrir Comunicação, apontar o aviso demonstrativo, registrar nota e simular PING.
8. Mostrar cadastro de usuário por gerente e restrição de acesso por operador.
9. Parar/retornar serviços mantendo o volume e consultar novamente os registros.

## Limites e prontidão

**MVP apto para a apresentação dos fluxos validados**, com serviços previamente
iniciados e as simulações declaradas. Não é prontidão de produção nem uma suíte
inteiramente verde.

- Comunicações e estações são demonstração local, sem backend de canais/comandos.
- Sensores são simulados; posições são calculadas, não medições diretas de GPS.
  Globo é ilustrativo. CelesTrak/SatNOGS/NASA ao vivo não foram validados neste
  smoke; falhas externas têm testes com respostas simuladas. Usar cadastro manual
  como alternativa confiável na apresentação.
- Gráfico conserva até 40 leituras no cache da sessão; não consulta histórico
  persistido por período. O backend grava as leituras, mas não expõe essa consulta.
- Usuários: cadastro por gerente operacional; listagem geral, edição e exclusão
  ainda não têm endpoints. Código do papel é informado pelo administrador.
- Missões e ordens usam autenticação, mas não têm autorização granular por papel
  em todas as operações. Isso permanece explícito, sem inventar regras de negócio.
- Recuperação de senha é exclusiva de desenvolvimento e não envia e-mail; a API
  de reset foi testada, mas o formulário completo ainda não foi incorporado.
- Permanecem os 46 testes legados com falha, telas de template e avisos de bundle/
  Fast Refresh. A documentação acadêmica histórica foi preservada e separada
  destas instruções de execução.
- Banco com missões antigas sem satélite ou usuários órfãos exige plano de
  associação revisado. Não se fez migração de dados arbitrária ou destrutiva.
