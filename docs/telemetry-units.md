# Unidades de telemetria

## Implementação e arquitetura

O backend está em `backend/`: Laravel `^8.75` no composer.json,
**8.83.29** no composer.lock, PHPUnit 9 e autoload PSR-4.
A referência a Laravel 12 no README não corresponde ao código atual.
O código segue a estrutura MVC do Laravel; ainda não havia catálogo ou serviço
de telemetria nesta branch. Não há conflito de rota com `GET /api/user`.

O catálogo é uma classe PHP simples, sem banco, migrations ou bibliotecas novas.
O container do Laravel injeta o catálogo no controller, sem registro adicional.
Ele também pode ser reutilizado com `(new TelemetryUnitCatalog())->all()`
ou injetado em futuros consumidores pelo container.

Arquivos:
- `backend/app/Telemetry/TelemetryUnitCatalog.php`: fonte central das definições.
- `backend/app/Http/Controllers/TelemetryUnitController.php`: resposta JSON.
- `backend/routes/api.php`: rota pública `GET /api/telemetry/units`.
- `backend/tests/Unit/TelemetryUnitCatalogTest.php`: contrato do catálogo.
- `backend/tests/Feature/TelemetryUnitsTest.php`: API e proteção da rota de usuário.

A API mantém os middlewares existentes, incluindo o limite de 60 requisições
por minuto. A rota `/api/user` continua protegida pelo Sanctum.

## Parâmetros e contrato

Cada item contém somente `key`, `name`, `unit`, `symbol`, `type` e
`description`. `unit` é o nome legível da unidade; `symbol` é sua representação
para exibição. Todos os parâmetros numéricos usam `type: "number"`.

| Identificador | Nome | Unidade | Símbolo |
| --- | --- | --- | --- |
| latitude | Latitude | Grau | ° |
| longitude | Longitude | Grau | ° |
| altitude | Altitude | Quilômetro | km |
| velocity | Velocidade orbital | Quilômetro por segundo | km/s |
| temperature | Temperatura interna | Celsius | °C |
| power_consumption | Consumo energético | Watt | W |
| battery | Nível da bateria | Porcentagem | % |
| pitch | Pitch | Grau | ° |
| roll | Roll | Grau | ° |
| yaw | Yaw | Grau | ° |
| signal | Qualidade do sinal simulada | Porcentagem | % |
| data_rate | Taxa de transmissão | Megabit por segundo | Mbps |
| snr | Relação sinal-ruído | Decibel | dB |
| latency | Latência | Milissegundo | ms |
| communication_status | Estado de comunicação | Sem unidade | null |

`communication_status` usa `type: "categorical"`, com `unit` e `symbol`
iguais a `null`. Suas categorias são as strings `conectado` e `desconectado`,
descritas no próprio item. O endpoint só descreve esse contrato: não retorna
um estado atual nem valida medições recebidas. `power_consumption` mantém o
identificador solicitado e representa potência em W, não energia acumulada.

## Executar localmente

Na raiz do repositório, com PHP e Composer compatíveis com o lock e suas extensões:

```powershell
cd backend
composer install --no-interaction --prefer-dist
# Apenas se .env ainda não existir:
Copy-Item .env.example .env
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

Não sobrescreva um `.env` existente nem regenere uma chave já utilizada.
O endpoint e os testes não precisam de banco, migrations ou frontend.
O Docker existente é opcional; sua imagem usa PHP 8.3, enquanto a validação local
desta entrega foi feita com PHP 8.2.12.

Em outro terminal:

```powershell
curl.exe -i -H "Accept: application/json" http://127.0.0.1:8000/api/telemetry/units
```

O retorno HTTP 200 contém os 15 itens dentro de `data`. Este é um recorte:

```json
{
  "data": [
    {
      "key": "temperature",
      "name": "Temperatura interna",
      "unit": "Celsius",
      "symbol": "°C",
      "type": "number",
      "description": "Temperatura interna do satélite."
    },
    {
      "key": "communication_status",
      "name": "Estado de comunicação",
      "unit": null,
      "symbol": null,
      "type": "categorical",
      "description": "Estado categórico da comunicação: conectado ou desconectado."
    }
  ]
}
```

## Testes e demonstração

Dentro de `backend/`, após preparar o ambiente:

```powershell
php artisan test
php artisan test --filter=Telemetry
php artisan route:list --path=api
```

Os testes verificam os 15 identificadores, sua unicidade, unidades e símbolos,
metadados obrigatórios, representação categórica, HTTP 200, conteúdo JSON exato
e HTTP 401 na rota de usuário sem autenticação. Os testes originais também
devem continuar passando. Nenhum teste de telemetria usa banco.

Para demonstrar: inicie o servidor, consulte a URL, mostre a temperatura em °C
e o estado categórico sem unidade e execute a suíte.

## Uso pelo frontend

Consulte o endpoint e indexe `data` por `key`. Use `name` como rótulo e
`symbol` para formatar futuros valores numéricos, evitando copiar unidades
para o frontend. Para `categorical`, mostre a categoria sem sufixo numérico.
As chaves devem permanecer estáveis entre backend e frontend.
Este catálogo não converte unidades nem fornece valores de medição.

## Escopo e revisão antes da integração

Não foram implementados simulador, armazenamento, ingestão ou validação de
medições, alertas, WebSockets, autenticação nova ou alterações de frontend.

A equipe deve validar os identificadores (especialmente `communication_status`),
os nomes das categorias e a convenção de unidades com o frontend.
Revisar compatibilidade ao integrar as branches separadas de usuários e frontend:
elas não fazem parte do código atual analisado. Conferir também o ambiente
de execução usado pela equipe; o Docker não foi executado nesta validação.
Não há commit, push ou merge automático.

## Resultado da validação desta entrega

- Ambiente: PHP 8.2.12, Laravel 8.83.29 e PHPUnit 9.6.38.
- Antes das alterações: 2 testes aprovados, após preparar o .env e a APP_KEY.
- Depois das alterações: 22 testes aprovados com php artisan test.
- php artisan route:list --path=api confirmou a nova rota e o Sanctum em /api/user.
- git diff --check não apontou problemas.
- Docker não foi executado porque o daemon local estava indisponível.
