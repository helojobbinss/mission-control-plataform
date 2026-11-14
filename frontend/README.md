# Mission Control — frontend

Execução final com cinco serviços, MariaDB e roteiro de apresentação:
[estabilização do MVP](../docs/final-stabilization.md).

Aplicação React/TypeScript incorporada seletivamente de `origin/frontend`
(`8eb9104`). O backend oficial permanece em `../backend`; não há backend nesta pasta.

## Desenvolvimento

Pré-requisitos: Node.js 22.12 ou superior, npm, Laravel configurado em
`http://127.0.0.1:8000`. Validado com Node 22.23.4 e npm 10.9.9.

```sh
cd frontend
npm ci
npm run dev
```

O Vite exibe a URL local, normalmente `http://localhost:5173`. Copie `.env.example`
para `.env` apenas se precisar alterar a origem do Laravel. Nunca substitua um
arquivo local já configurado. Não use o endereço interno `http://app` no navegador.

- `VITE_API_URL`: origem pública do Laravel, sem `/api`. Vazio usa a mesma origem.
- `API_PROXY_TARGET`: destino do proxy **de desenvolvimento**, padrão
  `http://127.0.0.1:8000`.
- Valores `VITE_*` são públicos: nunca colocar senhas ou chaves privadas neles.
- Produção: servir `dist` com fallback SPA e encaminhar `/api` ao Laravel, ou
  informar `VITE_API_URL` durante o build e configurar CORS no Laravel.
  O servidor de produção deve ter seu próprio encaminhamento de `/api`.

Login usa uma conta existente. O primeiro gerente deve ser provisionado conforme
`../docs/integration-baseline.md`. Não existe cadastro público: a tela de gestão
permite a um gerente cadastrar usuários pelo endpoint real. O código do perfil
deve ser informado pelo administrador, pois a API não expõe a consulta de perfis.

## Verificações

```sh
npm run build
npm run lint
npm exec playwright install chromium
npm test
npm run test:integration
```

O build gera as rotas do TanStack antes de verificar TypeScript. `routeTree.gen.ts`,
`dist`, caches, relatórios e capturas de teste ficam fora do Git. Há somente
`package-lock.json`; usar `npm ci`.

O smoke test exige PHP >= 8.4.1 com PDO SQLite, dependências do Composer e Python
3.11 com `python-api/requirements.txt`. Defina `PHP_BINARY` e `PYTHON_BINARY`
se os executáveis não estiverem nos caminhos esperados. No Windows, por exemplo:

```powershell
$env:PHP_BINARY = 'C:\caminho\php.exe'
$env:PYTHON_BINARY = 'C:\caminho\ambiente\Scripts\python.exe'
npm run test:integration
```

Ele cria SQLite e gerente de teste em diretório temporário, inicia Laravel,
FastAPI e Vite nas portas 18000, 18001 e 15173, e exercita a aplicação em Chromium.
Recusa portas ocupadas, não altera `.env` nem banco existente e encerra os serviços e
remove apenas seu diretório temporário ao terminar normalmente.

**A suíte herdada não está verde.** Consulte resultados reais, telas conectadas e
pendências em [docs/frontend-integration.md](../docs/frontend-integration.md).

A comunicação demonstrativa e os gráficos de acompanhamento estão integrados no
mesmo frontend. Consulte a [matriz de comparação e os limites da comunicação](../docs/communications-integration.md).
