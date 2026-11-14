import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const project = `mission-control-compose-test-${randomBytes(5).toString('hex')}`
const directory = mkdtempSync(path.join(tmpdir(), 'mission-control-compose-test-'))
const file = path.join(directory, 'compose.json')
const password = randomBytes(20).toString('hex')
const env = { ...process.env, DB_PASSWORD: password, DB_ROOT_PASSWORD: password, DB_DATABASE: 'mission_control_compose_smoke', DB_USERNAME: 'mission_smoke' }
let configured = false
let browser
function docker(args, timeout = 240000) {
  const result = spawnSync('docker', args, { cwd: root, env, encoding: 'utf8', windowsHide: true, timeout })
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || result.stdout)
  return result.stdout
}
const compose = (args) => docker(['compose', '-p', project, '-f', file, ...args])
function request(url, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null
    const request = http.request(url, { method: body ? 'POST' : 'GET', headers: { Accept: url.endsWith('/') ? 'text/html' : 'application/json', ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}) } }, (response) => {
      let data = ''; response.on('data', (chunk) => { data += chunk }); response.on('end', () => resolve({ status: response.statusCode, data }))
    })
    request.on('error', reject); request.setTimeout(20000, () => request.destroy(new Error(`HTTP timeout: ${url}`)))
    request.end(body)
  })
}
try {
  const config = JSON.parse(docker(['compose', 'config', '--format', 'json']))
  delete config.name
  for (const service of Object.values(config.services)) { delete service.container_name; service.ports = [] }
  for (const volume of Object.values(config.volumes)) { assert.ok(!volume.external, 'Test refuses external volumes'); delete volume.name }
  for (const network of Object.values(config.networks)) delete network.name
  config.services.app.image = 'mission-control-plataform-app:latest'
  config.services['python-api'].image = 'mission-control-plataform-python-api:latest'
  Object.assign(config.services.app.environment, { APP_ENV: 'testing', APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', CACHE_DRIVER: 'array', SESSION_DRIVER: 'array', DB_URL: '', DATABASE_URL: '' })
  config.services.frontend.ports = [{ target: 5173, published: '15174', host_ip: '127.0.0.1', protocol: 'tcp' }]
  writeFileSync(file, JSON.stringify(config))
  configured = true
  compose(['up', '-d', '--no-build'])
  const guard = "require 'vendor/autoload.php'; $app = require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); if (!app()->environment('testing') || config('database.default') !== 'mysql' || config('database.connections.mysql.database') !== 'mission_control_compose_smoke' || config('database.connections.mysql.host') !== 'db') { fwrite(STDERR, 'Refusing non-isolated database'); exit(1); }"
  compose(['exec', '-T', 'app', 'php', '-r', guard])
  compose(['exec', '-T', 'app', 'php', 'artisan', 'migrate', '--force'])
  compose(['exec', '-T', '-e', `DEMO_PASSWORD=${password}`, 'app', 'php', 'artisan', 'db:seed', '--class=DemoSeeder', '--force'])
  let available = false
  for (let attempt = 0; attempt < 120; attempt++) {
    try { if ((await request('http://127.0.0.1:15174/api/user')).status === 401) { available = true; break } } catch { /* aguardar npm ci/Vite */ }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  assert.ok(available, 'Compose frontend/proxy did not become ready')
  assert.equal((await request('http://127.0.0.1:15174/')).status, 200, 'Frontend HTML response')
  const login = await request('http://127.0.0.1:15174/api/login', { email: 'demo.manager@example.test', password })
  assert.equal(login.status, 200, 'Sanctum login through the Vite proxy')
  assert.equal(JSON.parse(login.data).user.role, 'gerente')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setDefaultTimeout(60000)
  const browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('http://127.0.0.1:15174/')
  await page.getByLabel('Email', { exact: true }).fill('demo.manager@example.test')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.getByText('Painel de Controle da Missão', { exact: true }).waitFor()
  await page.getByRole('link', { name: 'Monitoramento', exact: true }).click()
  await page.getByRole('button', { name: 'Adicionar satélite à frota', exact: true }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Compose Manual Satellite')
  const initialPosition = page.waitForResponse((response) => response.url().includes('/monitoring/position'))
  await page.getByRole('button', { name: 'Cadastrar manual', exact: true }).click()
  assert.equal((await initialPosition).status(), 200, 'Official FastAPI simulation route')
  await page.getByText('Simulação ·', { exact: false }).waitFor()
  assert.deepEqual(browserErrors, [])
  console.log(compose(['exec', '-T', 'app', 'php', 'vendor/phpunit/phpunit/phpunit', '--no-progress']).trim())
  console.log(compose(['exec', '-T', 'python-api', 'python', '-m', 'pytest', '-q', '-p', 'no:cacheprovider', '/tests']).trim())
  console.log('PASS: five Compose services, migrations, DemoSeeder, browser login/dashboard/manual satellite/FastAPI telemetry, Docker PHPUnit and pytest. Only isolated project resources were used.')
} catch (error) {
  if (configured) console.error(compose(['logs', '--tail', '12', 'app', 'nginx', 'frontend']))
  console.error(error.message); process.exitCode = 1
} finally {
  await browser?.close()
  if (configured) {
    assert.ok(project.startsWith('mission-control-compose-test-'))
    compose(['down', '--volumes', '--remove-orphans'])
  }
  assert.equal(path.dirname(directory), path.resolve(tmpdir()))
  assert.ok(path.basename(directory).startsWith('mission-control-compose-test-'))
  rmSync(directory, { recursive: true, force: true })
}
