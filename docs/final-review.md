# Revisão final para merge acadêmico

Branch proposta: `integration/final-mission-control` → `main`.
Base remota revisada: `3799ff303c9158f36bcb28bf89103baba899d087`.
Código funcional revisado: `6f1718e`; esta revisão acrescenta somente documentação.

## Git e escopo

- `git fetch --all --prune` executado. A `origin/main` não recebeu novos commits
  desde a estabilização anterior. A `main` local foi preservada em `5cabd72`.
- A base remota é ancestral da integração. Não há arquivos não mesclados no índice.
- Revisados os 44 arquivos do diff `origin/main...HEAD`, antes deste relatório:
  comunicação, telemetria, CRUD de satélites, autenticação, integridade, testes,
  Compose e documentação. O frontend seletivo já está na `main` remota.
- Um único frontend oficial, em `frontend/`. Backend Laravel, módulos de missões,
  usuários, satélites, unidades, ordens de serviço e integrações preservados.
- Nenhuma substituição por uma aplicação antiga, novo merge de históricos,
  modificação da `main`, exclusão de branches ou force push.

## Checklist mínimo da entrega

| Critério | Resultado e evidência |
| --- | --- |
| Iniciar sem erro impeditivo | Compose de cinco serviços aprovado, incluindo healthchecks do banco e Python. |
| Acesso à interface | Chromium acessou a aplicação, autenticou e abriu o dashboard. |
| Comunicação com backend | Login pelo proxy Vite → Nginx → Laravel; posição e telemetria via Laravel → FastAPI. |
| Operações de missões | Cadastro, listagem, detalhes, comentário, edição, transição e atualização em lote aprovados no E2E. |
| Operações de satélites | Cadastro manual, edição e exclusão aprovados; cadastro vinculado preservado com resposta 409. |
| Monitoramento | Posição manual calculada, sensores simulados identificados e gráfico das leituras recebidas. |
| Comunicação | Console demonstrativo integrado: nota, PING/ACK, navegação com retenção de mensagens; nenhuma transmissão externa. |
| Persistência | MariaDB e serviços reiniciados; missão, descrição, comentário e sessão consultados novamente. |
| Instalação pelo README | Aprovada em cópia limpa dos arquivos versionados, com Composer, node_modules, configuração e volume MariaDB novos; login e dashboard no Chromium. |

## Testes repetidos nesta revisão

| Execução | Resultado real |
| --- | --- |
| `npm run build` | Aprovado, inclusive TypeScript; aviso de chunk acima de 500 kB. |
| `npm run lint` | Aprovado: zero erros, um aviso herdado de Fast Refresh. |
| `npm test -- --reporter=json --outputFile=.vitest-results.json` | Código de saída 1: 168 testes, 122 aprovados, 46 falhas, nenhum pendente. |
| `npm run test:compose` | Aprovado: cinco serviços, migrations, DemoSeeder, login no navegador, satélite manual e telemetria. |
| PHPUnit dentro do Compose isolado | 98 testes e 621 assertions aprovados, SQLite em memória. |
| pytest dentro do Compose isolado | 28 aprovados; um aviso de depreciação Starlette/httpx. |
| `SMOKE_DATABASE=mysql npm run test:integration` | Cenários A–E aprovados com MariaDB 11.4.13, incluindo reinício real do banco e navegação SPA. No PowerShell, definir `$env:SMOKE_DATABASE = 'mysql'` e os executáveis conforme o relatório de estabilização. |
| `git diff --check origin/main...HEAD` | Aprovado. |

Para validar o README, foi extraído `git archive HEAD` em diretório temporário,
sem copiar `.env`, vendor ou node_modules do ambiente atual. A sequência executou
build das imagens, subida das dependências, `composer install`, geração de
APP_KEY inicialmente vazia, `migrate:status`, `migrate`, seeders e inicialização
de Nginx/Vite. O frontend executou seu próprio `npm ci`. O navegador abriu a
interface e autenticou pelo proxy, sem erros JavaScript impeditivos. Apenas
nomes de projeto/recursos e portas publicadas foram alterados para isolar o
teste. Em banco novo, `migrate:status` informa ausência da tabela de migrations;
o comando seguinte, `migrate`, cria essa estrutura normalmente. Os recursos
descartáveis foram removidos ao terminar, sem tocar no banco do ambiente.

As 46 falhas repetem os mesmos dez arquivos registrados na estabilização:
busca (7), diálogos antigos de usuários (11), cópias desses diálogos (17),
diálogos de missões (7) e cadastro público legado (4). Incluem textos antigos,
fixtures e QueryClientProvider ausente no teste do drawer. Nenhum teste foi
apagado, desativado ou marcado como aprovado. O E2E verifica os fluxos atuais,
mas não substitui a manutenção dessa suíte.

## Arquivos e credenciais

Foram examinados os 495 arquivos versionados anteriores a este relatório.
Não foram encontrados `.env` reais, ZIPs, node_modules, vendor, builds, ambientes
Python, bytecode, logs, bancos SQLite ou caches gerados na árvore versionada.
Os `.gitignore` de diretórios de storage/cache são estruturais e necessários.
O PDF de sprint é material acadêmico preservado, não um artefato de execução.

A varredura de padrões de chaves privadas e tokens não encontrou ocorrências.
Os únicos arquivos de ambiente são os três `.env.example`; campos de senha e
APP_KEY estão vazios. NASA `DEMO_KEY`, a chave pública de testes e as senhas
explicitamente demonstrativas são exemplos, não credenciais reais. O seeder de
demonstração exige execução opt-in em local/testing. A varredura da árvore atual
não é uma auditoria de todo o histórico Git nem substitui rotação de um segredo
que eventualmente tenha sido publicado no passado.

Os testes usaram somente bancos, projetos, volumes e credenciais descartáveis.
Scripts auxiliares desta revisão são removidos antes do commit. Os relatórios
locais de testes e artefatos gerados permanecem ignorados pelo Git.

## Pendências e decisão

- Corrigir as 46 falhas legadas do frontend e manter cobertura dos componentes atuais.
- Comunicações e estações são demonstrações locais; sensores são simulados e
  posições calculadas. Não há backend de comandos/canais nem transmissão real.
- Listagem geral, edição e exclusão de usuários e consulta de telemetria por
  período não possuem endpoints. Cadastro de usuário por gerente está operacional.
- Autorização granular de missões/ordens e fluxo completo de recuperação de
  senha com e-mail permanecem limitados, conforme a documentação existente.
- NASA/CelesTrak/SatNOGS ao vivo e implantação pública não foram executados nesta
  revisão. Usar satélite manual para a apresentação não depender dessas fontes.
- Bancos antigos com usuários órfãos ou missões sem satélite exigem revisão dos
  vínculos antes de migrar; nenhum saneamento arbitrário de dados foi realizado.

**Recomendação: APTO para merge do MVP acadêmico**, dentro dos fluxos mínimos
validados e com as limitações acima explícitas. Não é uma suíte inteiramente
aprovada nem uma declaração de prontidão de produção. Nenhum bloqueio aos
critérios mínimos foi encontrado nesta execução.
Nenhum merge ou auto-merge é autorizado por este relatório; a aprovação é da equipe.

## Commits funcionais incluídos em relação à main remota

- `42418eb` — integração de comunicação e acompanhamento.
- `7a3f2dc` — tokens e integridade do banco.
- `44cec78` — simulação orbital no FastAPI oficial.
- `97d7a94` — CRUD de satélites e E2E persistente.
- `b39dacd` — validação dos cinco serviços.
- `6f1718e` — documentação de execução e apresentação.

Instalação: [README](../README.md). Detalhes e roteiro:
[estabilização final](final-stabilization.md).
