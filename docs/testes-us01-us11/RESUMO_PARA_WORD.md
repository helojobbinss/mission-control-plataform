# Resumo para documentação acadêmica — US01 e US11

**Projeto:** Mission Control Platform. **Data:** 16/11/2026, America/Sao_Paulo. Branch main, referência f84d2f0bf298a3b8418998c34b45da15d9f28851, incluindo alterações ainda não commitadas. Não houve commit, push ou merge desta validação.

## Funcionalidades testadas

A US01 permite baixar CSV de missões, satélites e histórico de telemetria persistido, com filtros e autenticação. A US11 permite configurar limites de temperatura interna, bateria e tensão na tela existente de monitoramento. Os limites são armazenados por satélite e aplicados à classificação e aos alertas antes de salvar as leituras. Os sensores continuam simulados.

## Metodologia

Foram realizados inspeção de código/documentação, testes de feature PHPUnit com SQLite isolado, testes de componentes em Chromium/Vitest, fluxo E2E real React/Laravel/FastAPI com banco temporário, regressão Python, build TypeScript/Vite e lint. Um parser independente leu os três CSVs baixados. Capturas de tela, registros HTTP sem tokens e snapshots de integridade foram preservados.

## Quantidades e resultados

| Medida | Resultado |
| --- | --- |
| CTs de negócio solicitados | 18 executados: 8 US01 e 10 US11 |
| CTs de negócio aprovados ao final | 18 |
| CTs de negócio reprovados ao final | 0 |
| CTs de negócio bloqueados/não executados | 0 |
| PHPUnit completo | 126 aprovados; 830 assertions |
| Vitest completo | 174 aprovados; 2 reprovados; 176 testes |
| Pytest completo | 46 aprovados; 1 aviso de depreciação |
| Total das três suítes gerais | 346 aprovados, 2 reprovados, 0 bloqueados, em 348 testes |
| E2E integrado, separado | 1 fluxo aprovado |
| Arquivos CSV lidos pelo parser, separado | 3 válidos |

CTs de negócio, métodos automatizados, arquivos e fluxos E2E são contagens diferentes. Retestes e o conjunto focal de 26 testes não foram somados novamente ao total das suítes.

## Defeitos e correções

**D-US11-01 (médio):** após salvar, o cache frontend ainda conservava o limite anterior. O teste inicial comprovou a falha. Foi corrigida a atualização do cache pela resposta PUT, preservando a confirmação no componente pai. Retestes focal, completo e E2E confirmaram o funcionamento.

**R-REG-01 (médio, aberto):** dois testes preexistentes do formulário de missão falham ao tratar saveMission como spy. A falha se reproduziu na suíte completa e no arquivo isolado. O módulo não foi alterado por esta validação, e não se afirma ter executado uma comparação com checkout limpo anterior. O fluxo real de missão passou no E2E. Cabe à equipe investigar o mock antes de declarar regressão geral aprovada.

**Limitações do ambiente:** Google Fonts foi bloqueado pela rede do navegador; as capturas reais utilizam fontes de fallback. Há um aviso Starlette/httpx na suíte Python, sem falha. Nenhuma biblioteca foi instalada ou atualizada.

## Veredito final

- **US01: aprovada tecnicamente**, no escopo testado, com extração real, filtros, segurança de acesso e integridade comprovados.
- **US11: aprovada tecnicamente**, no escopo dos três sensores configuráveis, após correção do cache e comprovação de persistência/aplicação dos limites.
- **Regressão geral: não integralmente aprovada**, pelas duas falhas de testes de missão ainda abertas.

Não se trata de aceite formal da equipe/professor. Excel desktop, grandes volumes, testes de carga, outros navegadores e repetição integral em MariaDB isolado não foram executados; estão fora da contagem dos 18 CTs. Nenhum dado/volume principal foi apagado, nem foi realizada interrupção destrutiva dos serviços existentes.

## Referências às evidências

Na pasta `docs/testes-us01-us11/evidencias/`:

- backend-final.log/xml: suíte de 126 testes e asserções de US01/US11.
- frontend-focal.log: 26 testes selecionados aprovados; us11-inicial.log: defeito inicialmente reproduzido.
- frontend-completo.log e regressao-missoes.log: duas falhas abertas.
- e2e.log e http-e2e.json: downloads/configuração/seleção/reload reais.
- export-missions.csv, export-satellites.csv, export-telemetry.csv e csv-validacao.json: arquivos baixados e validação de estrutura/BOM.
- integridade-banco.json: comparação before/after, equal=true, somente fixtures isoladas.
- us11-salvo.png, us11-recarregado.png, us11-independencia.png e us01-sem-registros.png: capturas reais.
- browser-errors.json: fontes bloqueadas, 404 esperado e abortos de navegação; não foi ocultada a existência de mensagens de console.
- build.log, lint.log, python-regressao.log e arquivos de versão: ambiente e verificações complementares.
- manifesto-sha256.json: identificação verificável de evidências/fontes selecionadas.

Roteiros, comandos, rastreabilidade por método e os 18 casos completos estão em `RELATORIO_TESTES_US01_US11.md`. Nenhum documento Word foi criado nesta etapa.
