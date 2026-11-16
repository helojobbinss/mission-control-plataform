# Como executar os testes — Sprint 6

Executar na raiz do repositório em PowerShell. PHP compatível com composer.lock e PDO SQLite; Node 24 e npm; Python 3.13 com venv. Não usar bancos de desenvolvimento. Nenhum .env pessoal precisa ser copiado para o PHPUnit.

Preparação reproduzindo este ambiente (caminhos locais podem variar):

```powershell
# Ajuste apenas o processo atual. Não modifica a política global.
Set-ExecutionPolicy -Scope Process Bypass -Force
$env:Path = (Resolve-Path '.tools/node-v24.22.3-win-x64').Path + ';' + $env:Path
$env:PLAYWRIGHT_BROWSERS_PATH = (Resolve-Path '.tools').Path + '/browsers'
$env:PYTHON_BINARY = (Resolve-Path 'python-api/.venv/Scripts/python.exe').Path
```

As pastas .tools, vendor, node_modules e .venv são locais ignoradas pelo Git. Em novo checkout, instalar os locks, sem composer update/npm update:

```powershell
cd backend
composer install --no-interaction --prefer-dist
# Neste ambiente ZIP estava disponível mas desabilitado; alternativa utilizada:
# php -d extension=zip C:/ProgramData/ComposerSetup/bin/composer.phar install --no-interaction --prefer-dist
cd ../frontend
npm ci --no-audit --no-fund
node node_modules/playwright/cli.js install chromium
cd ../python-api
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
cd ..
```

Aqui o venv foi criado/preparado pelo uv existente com os mesmos pins; não há obrigação de instalar pypdf para testar a aplicação. pypdf foi usado somente na auditoria do PDF da Sprint 1.

Execuções que preservam novas evidências sem sobrescrever os logs entregues:

```powershell
& ./docs/sprint-6/Executar-Com-Evidencia.ps1 -Nome backend-reproducao -Casos 'CT-001..005,CT-015..021,CT-024..027' -Diretorio backend -Executavel php -Argumentos @('vendor/phpunit/phpunit/phpunit','--colors=never','--log-junit','../docs/sprint-6/evidencias/backend-reproducao.xml')
& ./docs/sprint-6/Executar-Com-Evidencia.ps1 -Nome python-reproducao -Casos 'CT-006..008,CT-022..023,CT-027' -Diretorio python-api -Executavel .venv/Scripts/python.exe -Argumentos @('-m','pytest','-v','--junitxml=../docs/sprint-6/evidencias/python-reproducao.xml')
& ./docs/sprint-6/Executar-Com-Evidencia.ps1 -Nome frontend-reproducao -Casos 'CT-009,CT-011,CT-012,CT-030' -Diretorio frontend -Executavel npm.cmd -Argumentos @('test','--','--reporter=default','--reporter=json','--outputFile=../docs/sprint-6/evidencias/frontend-reproducao.json')
& ./docs/sprint-6/Executar-Com-Evidencia.ps1 -Nome sistema-reproducao -Casos CT-010 -Diretorio frontend -Executavel npm.cmd -Argumentos @('run','test:integration')
```

O capturador retorna código de erro para falhas/bloqueios. Comandos curtos equivalentes:

```powershell
cd backend
php vendor/phpunit/phpunit/phpunit --colors=never
php vendor/phpunit/phpunit/phpunit --filter 'TelemetryUnitsTest|EnvironmentTest'
php vendor/phpunit/phpunit/phpunit --filter test_ct005
cd ../python-api
.venv/Scripts/python.exe -m pytest -v
.venv/Scripts/python.exe -m pytest tests/test_health.py -v
cd ../frontend
npm test
npm test -- src/features/tasks/components/tasks-mutate-drawer.test.tsx
npm run test:integration
npm run build
npm run lint
cd ..
python-api/.venv/Scripts/python.exe docs/sprint-6/medir_telemetria.py
python-api/.venv/Scripts/python.exe docs/sprint-6/validar_entregaveis.py
git diff --check
```

Resultado conhecido esperado da regressão atual: PHP uma falha CT-005; Python aprovado; frontend 40 falhas herdadas; formulário de missão 6/6 e E2E aprovados. Não remover testes para obter verde. Para o E2E, portas 18000/18001/15173 precisam estar livres; o runner recusa serviço preexistente. Ele usa SQLite temporário e dados fictícios, sem chamadas externas para satélite manual.

Não executar `migrate:fresh` no Compose existente: ele usa volume persistente de desenvolvimento. MariaDB permanece bloqueado; preparar configuração e volume **exclusivos de teste** antes de qualquer execução futura. A configuração phpunit.xml atual força SQLite, portanto apontar só DB_DATABASE externamente não a converte em validação MariaDB. Nenhuma compatibilidade com MariaDB é inferida.

Roteiros manuais CT-031 a CT-034 estão completos no relatório principal/casos.json. Registre versão, dispositivo, data real e evidências ao executá-los; não altere retrospectivamente os vereditos desta sessão. Aceite humano depende dos responsáveis.

Conferência final dos entregáveis: `validar_entregaveis.py` verifica títulos, campos dos 35 CT, evidências, rastreabilidade, contagens dos frameworks, percentuais e ausência de alteração de produção. A aprovação desse verificador é documental e não converte testes reprovados em aprovados. O histórico preserva uma falha inicial da própria regra documental e a correção explicada em `evidencias/preparacao.md`.

Estado Git conferido em `evidencias/git-final.log`: branch de trabalho da Sprint 6, HEAD inicial/final `3799ff303c9158f36bcb28bf89103baba899d087`, sem novo commit, merge ou push; arquivos permanecem prontos para revisão e commit. O inventário `INTEGRIDADE_SHA256.csv` registra SHA256 dos documentos, testes e evidências entregues, excluindo a si próprio e `evidencias/validacao-final.log`, que é produzido após o inventário para evitar referência circular.

Capturas reais complementares: `evidencias/captura-busca.png` e `evidencias/captura-cadastro-legado.png`, geradas pelo Vitest/Chromium nos cenários reprovados. `evidencias/capturas.json` informa origem e hash; são cópias sem edição. As demais falhas permanecem integralmente rastreáveis por logs e relatórios estruturados, sem exigir que imagens ignoradas do diretório frontend sejam versionadas.
