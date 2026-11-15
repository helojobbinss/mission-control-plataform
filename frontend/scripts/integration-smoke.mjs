import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import http from 'node:http'
import net from 'node:net'
import { randomBytes } from 'node:crypto'
import { chromium } from 'playwright'

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.dirname(frontend)
const temporary = mkdtempSync(path.join(tmpdir(), 'mission-control-smoke-'))
const database = path.join(temporary, 'test.sqlite')
writeFileSync(database, '')
const php = process.env.PHP_BINARY || 'php'
const python = process.env.PYTHON_BINARY || path.join(root, 'python-api', '.venv-integration', 'Scripts', 'python.exe')
const env = {
  ...process.env, APP_ENV: 'testing', APP_DEBUG: 'false',
  APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '', DATABASE_URL: '',
  CACHE_DRIVER: 'array', SESSION_DRIVER: 'array', QUEUE_CONNECTION: 'sync', MAIL_MAILER: 'array',
  PYTHON_API_URL: 'http://127.0.0.1:18001',
  API_PROXY_TARGET: 'http://127.0.0.1:18000', VITE_API_URL: '',
}
const children = []
let browser
const logs = []
const useMariaDB = process.env.SMOKE_DATABASE === 'mysql'
const databaseContainer = `mission-control-smoke-${randomBytes(6).toString('hex')}`
let databaseStarted = false
const scenarios = { A: 'NÃO EXECUTADO', B: 'NÃO EXECUTADO', C: 'NÃO EXECUTADO', D: 'NÃO EXECUTADO', E: 'NÃO EXECUTADO' }
let currentScenario = 'A'
function docker(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8', windowsHide: true, timeout: 180000 })
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'Docker command failed')
  return result.stdout
}
async function databaseReady() {
  for (let attempt = 0; attempt < 60; attempt++) {
    const status = spawnSync('docker', ['exec', databaseContainer, 'healthcheck.sh', '--connect', '--innodb_initialized'], { windowsHide: true, stdio: 'ignore' })
    if (status.status === 0) return
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error('Disposable MariaDB did not become ready')
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  await new Promise((resolve) => { child.once('exit', resolve); child.kill() })
}
async function startServices() {
  const servers = [
    start(php, ['-S', '127.0.0.1:18000', '-t', 'public', 'server.php'], path.join(root, 'backend')),
    start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '18001'], path.join(root, 'python-api')),
    start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '15173', '--strictPort'], frontend),
  ]
  await Promise.all([ready('http://127.0.0.1:18000'), ready('http://127.0.0.1:18001/api/v1/health'), ready('http://127.0.0.1:15173')])
  return servers
}
async function requireFreePort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', () => reject(new Error(`Port ${port} is occupied; refusing to use an existing service.`)))
    server.listen(port, '127.0.0.1', () => server.close(resolve))
  })
}
function start(command, args, cwd) {
  const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  children.push(child)
  child.stdout.on('data', (value) => logs.push(String(value)))
  child.stderr.on('data', (value) => logs.push(String(value)))
  child.on('error', (error) => logs.push(error.message))
  return child
}
async function ready(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const ok = await new Promise((resolve) => {
      const request = http.get(url, (response) => { response.resume(); resolve(response.statusCode === 200) })
      request.on('error', () => resolve(false))
      request.setTimeout(1000, () => { request.destroy(); resolve(false) })
    })
    if (ok) return
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Service not ready: ${url}`)
}
try {
  await Promise.all([18000, 18001, 15173].map(requireFreePort))
  if (useMariaDB) {
    await requireFreePort(13317)
    const password = randomBytes(20).toString('hex')
    docker(['run', '--detach', '--rm', '--name', databaseContainer, '--publish', '127.0.0.1:13317:3306', '--env', `MARIADB_ROOT_PASSWORD=${password}`, '--env', 'MARIADB_DATABASE=mission_control_smoke', 'mariadb:11.4'])
    databaseStarted = true
    Object.assign(env, { DB_CONNECTION: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: '13317', DB_DATABASE: 'mission_control_smoke', DB_USERNAME: 'root', DB_PASSWORD: password })
    await databaseReady()
  }
  const fixture = spawnSync(php, [path.join(frontend, 'scripts/seed-integration.php')], { cwd: path.join(root, 'backend'), env, encoding: 'utf8', windowsHide: true })
  if (fixture.status !== 0) throw new Error(fixture.stderr || fixture.stdout || fixture.error?.message)
  console.log(fixture.stdout.trim())
  let servers = await startServices()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.waitForURL('**/sign-in**')
  await page.getByLabel('Email', { exact: true }).fill('manager@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('integration-test-password')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL('**/tasks')
  currentScenario = 'B'
  await page.goto('http://127.0.0.1:15173/monitoramento')
  await page.getByRole('button', { name: 'Adicionar satélite à frota', exact: true }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Smoke Manual')
  const initialPosition = page.waitForResponse((response) => response.url().includes('/monitoring/position'))
  await page.getByRole('button', { name: 'Cadastrar manual', exact: true }).click()
  const positionResult = await initialPosition
  assert.equal(positionResult.status(), 200, 'Official FastAPI simulation route must be operational')
  assert.equal(typeof (await positionResult.json()).orbital_position.latitude, 'number')
  await page.getByRole('button', { name: /Smoke Manual/ }).waitFor()
  await page.getByRole('button', { name: 'Editar satélite selecionado', exact: true }).click()
  await page.getByLabel('Nome do satélite', { exact: true }).fill('Smoke Manual')
  await page.getByLabel('Altitude orbital (km)', { exact: true }).fill('550')
  const satelliteUpdate = page.waitForResponse((response) => response.url().match(/\/api\/satellites\/\d+$/) && response.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Salvar satélite', exact: true }).click()
  assert.equal((await satelliteUpdate).status(), 200)
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  scenarios.B = 'APROVADO'
  currentScenario = 'C'
  await page.getByText('Simulação ·', { exact: false }).waitFor({ timeout: 20000 })
  scenarios.C = 'APROVADO'
  currentScenario = 'A'
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.getByRole('button', { name: 'Nova Missão' }).click()
  await page.getByLabel('Título', { exact: true }).fill('Smoke Mission')
  await page.getByLabel('Satélite *', { exact: true }).selectOption({ label: 'Smoke Manual (NORAD )' })
  await page.getByRole('combobox').filter({ hasText: 'Selecione um status' }).click()
  await page.getByRole('option', { name: 'Agendada', exact: true }).click()
  await page.getByRole('radio', { name: 'Monitoramento', exact: true }).click()
  await page.getByRole('radio', { name: 'Gabriel', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByRole('button', { name: 'Smoke Mission', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Smoke Mission', exact: true }).click()
  await page.getByLabel('Seu nome', { exact: true }).fill('Integration Manager')
  await page.getByLabel('Comentário', { exact: true }).fill('Mission comment persisted by Laravel')
  await page.getByRole('button', { name: 'Adicionar comentário', exact: true }).click()
  await page.getByText('Mission comment persisted by Laravel', { exact: true }).waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  scenarios.A = 'APROVADO'
  await page.goto('http://127.0.0.1:15173/monitoramento')
  await page.getByRole('button', { name: 'Excluir satélite selecionado', exact: true }).click()
  const linkedDelete = page.waitForResponse((response) => response.url().match(/\/api\/satellites\/\d+$/) && response.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Confirmar exclusão do satélite', exact: true }).click()
  assert.equal((await linkedDelete).status(), 409)
  await page.getByRole('dialog').getByRole('alert').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Adicionar satélite à frota', exact: true }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Temporary Satellite')
  await page.getByRole('button', { name: 'Cadastrar manual', exact: true }).click()
  await page.getByRole('button', { name: /Temporary Satellite/ }).click()
  await page.getByRole('button', { name: 'Excluir satélite selecionado', exact: true }).click()
  const allowedDelete = page.waitForResponse((response) => response.url().match(/\/api\/satellites\/\d+$/) && response.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Confirmar exclusão do satélite', exact: true }).click()
  assert.equal((await allowedDelete).status(), 200)
  await page.getByRole('button', { name: /Temporary Satellite/ }).waitFor({ state: 'hidden' })
  await page.goto('http://127.0.0.1:15173/tasks')
  const row = page.getByRole('row').filter({ hasText: 'Smoke Mission' })
  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Editar', exact: true }).click()
  await page.getByLabel('Descrição', { exact: true }).fill('Mission edited through React')
  const updateResponse = page.waitForResponse((response) => response.url().includes('/api/missions/') && response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  assert.equal((await updateResponse).status(), 200)
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Iniciar missão' }).click()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await row.getByText('Ativa', { exact: true }).waitFor()
  await row.getByRole('checkbox', { name: 'Selecionar missão', exact: true }).check()
  await page.getByRole('button', { name: 'Update status', exact: true }).click()
  const bulkUpdate = page.waitForResponse((response) => response.url().endsWith('/api/missions/bulk'))
  await page.getByRole('menuitem', { name: 'Agendada', exact: true }).click()
  assert.equal((await bulkUpdate).status(), 200)
  await row.getByText('Agendada', { exact: true }).waitFor()
  await page.goto('http://127.0.0.1:15173/')
  await page.getByText('Painel de Controle da Missão', { exact: true }).waitFor()
  await page.getByText('Smoke Manual', { exact: true }).waitFor()
  await page.reload()
  await page.getByText('Smoke Manual', { exact: true }).waitFor()
  await page.goto('http://127.0.0.1:15173/userscopy')
  await page.getByLabel('Nome', { exact: true }).fill('Smoke Operator')
  await page.getByLabel('E-mail', { exact: true }).fill('operator@example.test')
  await page.getByLabel('Código do perfil').fill('2')
  await page.getByLabel('Senha', { exact: true }).fill('integration-test-password')
  await page.getByLabel('Confirmação da senha').fill('integration-test-password')
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click()
  await page.getByText('Usuário cadastrado.', { exact: true }).waitFor()

  // Usar links SPA: uma propriedade JS desapareceria se houvesse reload.
  const navigationMarker = `navigation-${Date.now()}`
  await page.evaluate((value) => Reflect.set(window, 'mission-smoke-marker', value), navigationMarker)
  const navigate = async (name, suffix) => {
    await page.getByRole('link', { name, exact: true }).click()
    await page.waitForURL((url) => url.pathname === suffix)
    assert.equal(await page.evaluate(() => Reflect.get(window, 'mission-smoke-marker')), navigationMarker, 'Navigation reloaded the application')
  }
  const communicationRequests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/') && /comm|channel|command/.test(new URL(request.url()).pathname)) communicationRequests.push(request.url())
  })
  await navigate('Comunicações', '/comunicacoes')
  currentScenario = 'D'
  await page.getByRole('region', { name: 'Console de comunicação simulada' }).waitFor()
  await page.getByRole('button', { name: 'Nota', exact: true }).click()
  await page.getByRole('textbox', { name: 'Texto da nota' }).fill('SPA session communication note')
  await page.getByRole('button', { name: 'Registrar nota local' }).click()
  await page.getByText('SPA session communication note', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Telecomando', exact: true }).click()
  await page.getByRole('button', { name: 'Simular envio', exact: true }).click()
  await page.getByText('PING → PONG · RTT nominal', { exact: true }).waitFor()
  scenarios.D = 'APROVADO'
  await navigate('Monitoramento', '/monitoramento')
  await page.getByRole('region', { name: 'Histórico de telemetria desta sessão' }).waitFor()
  const refreshTelemetry = page.waitForResponse((response) => response.url().includes('/monitoring/telemetry'))
  await page.getByRole('button', { name: 'Atualizar leitura', exact: true }).click()
  assert.equal((await refreshTelemetry).status(), 200)
  await navigate('Missões', '/tasks')
  await page.getByRole('button', { name: 'Smoke Mission', exact: true }).waitFor()
  await navigate('Painel Geral', '/')
  await page.getByText('Smoke Manual', { exact: true }).waitFor()
  await navigate('Gestão e dados', '/userscopy')
  await page.getByText('Seu acesso', { exact: true }).waitFor()
  await navigate('Comunicações', '/comunicacoes')
  await page.getByText('SPA session communication note', { exact: true }).waitFor()
  assert.deepEqual(communicationRequests, [], 'Demonstration sent a communication request')
  currentScenario = 'E'
  await Promise.all(servers.map(stop))
  if (useMariaDB) { docker(['restart', databaseContainer]); await databaseReady() }
  servers = await startServices()
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.getByRole('button', { name: 'Smoke Mission', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Smoke Mission', exact: true }).click()
  await page.getByText('Mission comment persisted by Laravel', { exact: true }).waitFor()
  await page.getByRole('dialog').getByText('Mission edited through React', { exact: true }).waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  scenarios.E = 'APROVADO'
  await page.getByRole('button', { name: 'Abrir perfil', exact: true }).click()
  await page.getByRole('menuitem', { name: /^Sign out/ }).click()
  const logoutResponse = page.waitForResponse((response) => response.url().endsWith('/api/logout'))
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  assert.equal((await logoutResponse).status(), 200)
  await page.waitForURL('**/sign-in**')
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.waitForURL('**/sign-in**')
  currentScenario = 'A'
  await page.getByLabel('Email', { exact: true }).fill('operator@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.getByText('E-mail ou senha inválidos.', { exact: true }).waitFor()
  await page.getByLabel('Senha', { exact: true }).fill('integration-test-password')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL('**/tasks')
  await page.goto('http://127.0.0.1:15173/userscopy')
  await page.getByText('Apenas gerentes podem cadastrar usuários.', { exact: true }).waitFor()
  const expiration = spawnSync(php, [path.join(frontend, 'scripts/seed-integration.php'), '--expire-tokens'], { cwd: path.join(root, 'backend'), env, encoding: 'utf8', windowsHide: true })
  assert.equal(expiration.status, 0, expiration.stderr)
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.waitForURL('**/sign-in**')
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(', ')}`)
  console.log('PASS: prior integrated flows, SPA navigation across dashboard/missions/satellites/monitoring/communications/users, session telemetry chart, simulated PING, note retention and logout. No communication API requests.')
} catch (error) {
  scenarios[currentScenario] = 'FALHOU'
  console.error(error.message)
  console.error(logs.slice(-15).join('\n'))
  process.exitCode = 1
} finally {
  await browser?.close()
  await Promise.all(children.map(stop))
  if (databaseStarted) {
    assert.ok(databaseContainer.startsWith('mission-control-smoke-'))
    docker(['rm', '--force', '--volumes', databaseContainer])
  }
  console.log(JSON.stringify({ database: useMariaDB ? 'MariaDB 11.4' : 'SQLite', scenarios }))
  // Remover apenas o diretório temporário que este runner criou.
  assert.equal(path.dirname(temporary), path.resolve(tmpdir()))
  assert.ok(path.basename(temporary).startsWith('mission-control-smoke-'))
  rmSync(temporary, { recursive: true, force: true })
}
