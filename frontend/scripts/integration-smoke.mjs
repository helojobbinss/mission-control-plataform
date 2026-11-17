import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
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
const evidence = process.env.US_VALIDATION_EVIDENCE
if (evidence) mkdirSync(evidence, { recursive: true })
const httpEvidence = []
const browserEvidence = []
async function screenshot(page, name) {
  if (evidence) await page.screenshot({ path: path.join(evidence, name), fullPage: true })
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
  const fixture = spawnSync(php, [path.join(frontend, 'scripts/seed-integration.php')], { cwd: path.join(root, 'backend'), env, encoding: 'utf8', windowsHide: true })
  if (fixture.status !== 0) throw new Error(fixture.stderr || fixture.stdout || fixture.error?.message)
  start(php, ['-S', '127.0.0.1:18000', '-t', 'public', 'server.php'], path.join(root, 'backend'))
  start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '18001'], path.join(root, 'python-api'))
  start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '15173', '--strictPort'], frontend)
  await Promise.all([ready('http://127.0.0.1:18000'), ready('http://127.0.0.1:18001/api/v1/health'), ready('http://127.0.0.1:15173')])
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname === '/api/exports' || url.pathname.endsWith('/monitoring/limits')) httpEvidence.push({ method: response.request().method(), path: url.pathname + url.search, status: response.status() })
  })
  page.on('console', (message) => { if (message.type() === 'error') browserEvidence.push({ type: 'console', text: message.text(), url: message.location().url }) })
  page.on('requestfailed', (request) => browserEvidence.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText }))
  page.on('pageerror', (error) => browserEvidence.push({ type: 'pageerror', text: error.message }))
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
  // US11: salvar limites pelo formulário real e conferir após recarregar.
  const temperatureSettings = page.getByRole('group', { name: 'Temperatura interna (°C)' })
  await temperatureSettings.getByLabel('Máximo', { exact: true }).fill('75')
  await page.getByRole('button', { name: 'Salvar configurações', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Configurações salvas' }).waitFor()
  await screenshot(page, 'us11-salvo.png')
  await page.reload()
  assert.equal(await temperatureSettings.getByLabel('Máximo', { exact: true }).inputValue(), '75')
  await screenshot(page, 'us11-recarregado.png')
  // Independência pela interface: B mantém padrões; A mantém o valor salvo.
  await page.getByRole('button', { name: 'Adicionar satélite à frota', exact: true }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Smoke B')
  await page.getByRole('button', { name: 'Cadastrar manual', exact: true }).click()
  await page.getByRole('button', { name: /Smoke B/ }).click()
  await page.waitForFunction(() => document.querySelector('input[id$="internal_temperature-max"]')?.value === '40')
  await page.getByRole('button', { name: /Smoke Manual/ }).click()
  await page.waitForFunction(() => document.querySelector('input[id$="internal_temperature-max"]')?.value === '75')
  await screenshot(page, 'us11-independencia.png')
  console.log('PASS US11: monitoring configuration saved through React and persisted after reload.')
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
  // US01: download real pelo React, passando pelo proxy e pelo Laravel/SQLite.
  await page.getByRole('link', { name: 'Extrair dados', exact: true }).click()
  await page.waitForURL('**/extrair-dados')
  for (const [label, dataset, expected] of [
    ['Missões cadastradas', 'missions', 'Smoke Mission'],
    ['Satélites cadastrados', 'satellites', 'Smoke Manual'],
    ['Histórico de telemetria', 'telemetry', 'recorded_at'],
  ]) {
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: label, exact: true }).click()
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click()
    const download = await downloadEvent
    assert.equal(download.suggestedFilename(), `export-${dataset}.csv`)
    const chunks = []
    for await (const chunk of await download.createReadStream()) chunks.push(chunk)
    const csv = Buffer.concat(chunks)
    assert.equal(csv.subarray(0, 3).toString('hex'), 'efbbbf')
    assert.ok(csv.toString('utf8').includes(expected))
    if (evidence) writeFileSync(path.join(evidence, `export-${dataset}.csv`), csv)
  }
  await page.getByLabel('Data inicial', { exact: true }).fill('1900-01-01')
  await page.getByLabel('Data final (inclusive)', { exact: true }).fill('1900-01-02')
  await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Nenhum registro encontrado' }).waitFor()
  await screenshot(page, 'us01-sem-registros.png')
  console.log('PASS US01: navigation, authenticated real CSV downloads for three datasets, UTF-8 BOM and empty date filter feedback.')
  await page.goto('http://127.0.0.1:15173/userscopy')
  await page.getByLabel('Nome', { exact: true }).fill('Smoke Operator')
  await page.getByLabel('E-mail', { exact: true }).fill('operator@example.test')
  await page.getByLabel('Código do perfil').fill('2')
  await page.getByLabel('Senha', { exact: true }).fill('integration-test-password')
  await page.getByLabel('Confirmação da senha').fill('integration-test-password')
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click()
  await page.getByText('Usuário cadastrado.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Abrir perfil', exact: true }).click()
  await page.getByRole('menuitem', { name: /^Sign out/ }).click()
  const logoutResponse = page.waitForResponse((response) => response.url().endsWith('/api/logout'))
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  assert.equal((await logoutResponse).status(), 200)
  await page.waitForURL('**/sign-in**')
  await page.goto('http://127.0.0.1:15173/tasks')
  await page.waitForURL('**/sign-in**')
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(', ')}`)
  console.log('PASS: route guard, login, manual satellite, FastAPI telemetry, mission creation/edit/transition, dashboard, session reload, manager user creation and logout.')
} catch (error) {
  console.error(error.message)
  console.error(logs.slice(-15).join('\n'))
  process.exitCode = 1
} finally {
  if (evidence) {
    writeFileSync(path.join(evidence, 'http-e2e.json'), JSON.stringify(httpEvidence, null, 2))
    writeFileSync(path.join(evidence, 'browser-errors.json'), JSON.stringify(browserEvidence, null, 2))
  }
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
