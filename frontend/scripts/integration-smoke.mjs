import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import http from 'node:http'
import net from 'node:net'
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
  const fixture = spawnSync(php, [path.join(frontend, 'scripts/seed-integration.php')], { cwd: path.join(root, 'backend'), env, encoding: 'utf8', windowsHide: true })
  if (fixture.status !== 0) throw new Error(fixture.stderr || fixture.stdout || fixture.error?.message)
  start(php, ['-S', '127.0.0.1:18000', '-t', 'public', 'server.php'], path.join(root, 'backend'))
  start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '18001'], path.join(root, 'python-api'))
  start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '15173', '--strictPort'], frontend)
  await Promise.all([ready('http://127.0.0.1:18000'), ready('http://127.0.0.1:18001/api/v1/health'), ready('http://127.0.0.1:15173')])
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
  await page.goto('http://127.0.0.1:15173/monitoramento')
  await page.getByRole('button', { name: 'Adicionar satélite à frota', exact: true }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Smoke Manual')
  await page.getByRole('button', { name: 'Cadastrar manual', exact: true }).click()
  await page.getByRole('button', { name: /Smoke Manual/ }).waitFor()
  await page.getByText('Simulação ·', { exact: false }).waitFor({ timeout: 20000 })
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
  await page.getByRole('region', { name: 'Console de comunicação simulada' }).waitFor()
  await page.getByRole('button', { name: 'Nota', exact: true }).click()
  await page.getByRole('textbox', { name: 'Texto da nota' }).fill('SPA session communication note')
  await page.getByRole('button', { name: 'Registrar nota local' }).click()
  await page.getByText('SPA session communication note', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Telecomando', exact: true }).click()
  await page.getByRole('button', { name: 'Simular envio', exact: true }).click()
  await page.getByText('PING → PONG · RTT nominal', { exact: true }).waitFor()
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
  await page.getByRole('button', { name: 'Abrir perfil', exact: true }).click()
  await page.getByRole('menuitem', { name: /^Sign out/ }).click()
  const logoutResponse = page.waitForResponse((response) => response.url().endsWith('/api/logout'))
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  assert.equal((await logoutResponse).status(), 200)
  await page.waitForURL('**/sign-in**')
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.waitForURL('**/sign-in**')
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(', ')}`)
  console.log('PASS: prior integrated flows, SPA navigation across dashboard/missions/satellites/monitoring/communications/users, session telemetry chart, simulated PING, note retention and logout. No communication API requests.')
} catch (error) {
  console.error(error.message)
  console.error(logs.slice(-15).join('\n'))
  process.exitCode = 1
} finally {
  await browser?.close()
  await Promise.all(children.map((child) => new Promise((resolve) => {
    if (child.exitCode !== null) return resolve()
    child.once('exit', resolve)
    child.kill()
  })))
  // Remover apenas o diretório temporário que este runner criou.
  assert.equal(path.dirname(temporary), path.resolve(tmpdir()))
  assert.ok(path.basename(temporary).startsWith('mission-control-smoke-'))
  rmSync(temporary, { recursive: true, force: true })
}
