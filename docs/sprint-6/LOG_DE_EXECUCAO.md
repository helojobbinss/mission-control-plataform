# Log de execução — Sprint 6

## 3. LOG DE EXECUÇÃO

As datas abaixo são extraídas dos arquivos de evidência, sem atribuir horário de execução a casos não executados. Commit indicado é o HEAD base mais a árvore de trabalho; arquivos e hashes entregues constam no inventário.

| Caso | Data/hora da execução registrada | Commit base | Esperado | Obtido | Status | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| CT-001 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 422/201/201/422; nenhum registro nas rejeições | HTTP 422/201/201/422; nenhum registro nas rejeições | passou | backend-final.log |
| CT-002 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 422/200/200/422 | HTTP 422/200/200/422 | passou | backend-final.log |
| CT-003 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 404 nos três endpoints | HTTP 404 nos três endpoints | passou | backend-final.log |
| CT-004 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | HTTP 422; operator_name original permanece null | HTTP 422; operator_name original permanece null | passou | backend-final.log |
| CT-005 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Dois alertas abertos, um por eixo (critério de integridade proposto pela auditoria) | Somente gyroscope_y persistido; gyroscope_x foi sobrescrito | falhou | backend-final.log |
| CT-006 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Alerta somente nas partições fora dos limiares; 14 instâncias aprovadas | Alerta somente nas partições fora dos limiares; 14 instâncias aprovadas | passou | python-final.log |
| CT-007 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Mesma contagem, parâmetros, valores e timestamps ao reavaliar a leitura | Mesma contagem, parâmetros, valores e timestamps ao reavaliar a leitura | passou | python-final.log |
| CT-008 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Nenhum alerta de comunicação / COMMUNICATION_LOST / SENSOR_FAILURE | Nenhum alerta de comunicação / COMMUNICATION_LOST / SENSOR_FAILURE | passou | python-final.log |
| CT-009 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Vermelho/vermelho/amarelo/amarelo/verde/verde; seis instâncias | Vermelho/vermelho/amarelo/amarelo/verde/verde; seis instâncias | passou | frontend-final.log |
| CT-010 | 2026-11-15T21:27:58.9551836-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Guard redireciona; login; cadastro; telemetria FastAPI; criar/editar/iniciar missão; dashboard; restauração após recarga; criar operador; logout | Guard redireciona; login; cadastro; telemetria FastAPI; criar/editar/iniciar missão; dashboard; restauração após recarga; criar operador; logout | passou | sistema-final.log |
| CT-011 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Nove testes de contrato aprovados; sem alegar integração HTTP real | Nove testes de contrato aprovados; sem alegar integração HTTP real | passou | frontend-final.log |
| CT-012 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Todos os testes dos arquivos associados aprovados; recuperação não comprova envio de e-mail | Todos os testes dos arquivos associados aprovados; recuperação não comprova envio de e-mail | passou | frontend-final.log |
| CT-013 | 2026-11-15T21:29:05.8095984-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Código zero; build e tsc aprovados; aviso de chunk grande registrado | Código zero; build e tsc aprovados; aviso de chunk grande registrado | passou | frontend-build-final.log |
| CT-014 | 2026-11-15T21:38:24.8223992-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Zero erros; um aviso Fast Refresh registrado | Zero erros; um aviso Fast Refresh registrado | passou | frontend-lint-final.log |
| CT-015 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Cadastro/consulta/edição/exclusão permitidos; entradas inválidas e papéis inadequados rejeitados | Cadastro/consulta/edição/exclusão permitidos; entradas inválidas e papéis inadequados rejeitados | passou | backend-final.log |
| CT-016 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Persistência e envelopes corretos; entradas fora das regras recebem 422; comentários isolados | Persistência e envelopes corretos; entradas fora das regras recebem 422; comentários isolados | passou | backend-final.log |
| CT-017 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Transições e timestamps correspondem ao estado; confirmações exigidas pelo código | Transições e timestamps correspondem ao estado; confirmações exigidas pelo código | passou | backend-final.log |
| CT-018 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Token funciona; logout remove token; inativo não entra; apenas gerente cadastra; token de recuperação não exposto em produção | Token funciona; logout remove token; inativo não entra; apenas gerente cadastra; token de recuperação não exposto em produção | passou | backend-final.log |
| CT-019 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Dados persistem; alertas resolvem; 502/503 conforme código; falha orbital não impede leitura | Dados persistem; alertas resolvem; 502/503 conforme código; falha orbital não impede leitura | passou | backend-final.log |
| CT-020 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Fonte correta; 404/422/502/503 apropriados; telemetria mantida sem posição; demais satélites continuam | Fonte correta; 404/422/502/503 apropriados; telemetria mantida sem posição; demais satélites continuam | passou | backend-final.log |
| CT-021 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Datas encaminhadas; datas inválidas rejeitadas antes da chamada; erro upstream gera 502; rotas autenticadas | Datas encaminhadas; datas inválidas rejeitadas antes da chamada; erro upstream gera 502; rotas autenticadas | passou | backend-final.log |
| CT-022 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Coordenadas e velocidade dentro das tolerâncias explícitas; periodicidade; 422/404/502 de erro | Coordenadas e velocidade dentro das tolerâncias explícitas; periodicidade; 422/404/502 de erro | passou | python-final.log |
| CT-023 | 2026-11-15T21:26:32.1333734-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Faixas e unidades implementadas; simulated=true; 422 para ID zero; alertas previstos | Faixas e unidades implementadas; simulated=true; 422 para ID zero; alertas previstos | passou | python-final.log |
| CT-024 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | 15 chaves únicas; símbolos e tipos exatos; categoria com unit/symbol null; sem conversão matemática | 15 chaves únicas; símbolos e tipos exatos; categoria com unit/symbol null; sem conversão matemática | passou | backend-final.log |
| CT-025 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Criar/consultar/atualizar; vínculo incorreto rejeitado; exclusão lógica; consulta após exclusão recebe 404 | Criar/consultar/atualizar; vínculo incorreto rejeitado; exclusão lógica; consulta após exclusão recebe 404 | passou | backend-final.log |
| CT-026 | 2026-11-15T21:26:21.4861895-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Catálogo preservado; missão vinculada e atualização persistida | Catálogo preservado; missão vinculada e atualização persistida | passou | backend-final.log |
| CT-027 | 2026-11-15T21:27:59.0158970-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Cinco testes do smoke backend aprovados; health e exemplos aprovados nas suítes completas | Cinco testes do smoke backend aprovados; health e exemplos aprovados nas suítes completas | passou | smoke-backend.log; python-final.log |
| CT-028 | 2026-11-15T21:23:46.8373799-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Matriz completa e divergências explicitamente identificadas | Matriz completa e divergências explicitamente identificadas | passou | rotas.log; auditoria.json; sprint-1-extraida.txt |
| CT-029 | 2026-11-15T21:29:25.7029726-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Subir ambiente de teste separado e aprovar regressão sem tocar dados existentes | Docker não encontrado; nenhuma migration foi executada em MariaDB | bloqueado | docker.log |
| CT-030 | 2026-11-15T21:27:58.9848037-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Todos os casos dos componentes aprovados; seis testes de missão usam QueryClient e saveMission mockado | Seis testes de missão reparados e aprovados; 40 falhas persistem em nove arquivos herdados | falhou | frontend-final.log |
| CT-031 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Participante conclui tarefas; observações e dificuldades registradas, sem pressupor aceite | Não houve sessão observada com participante; automação não equivale a avaliação humana | não executado | — |
| CT-032 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Fluxo concluído sem erros; diferenças visuais anotadas | Apenas Chromium desktop foi utilizado; não houve preparação nem execução em Firefox/aparelho móvel | não executado | — |
| CT-033 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Respostas reais com fonte/data e tratamento de ausência/erro registrados | Execução de serviços externos ao vivo excluída para manter suíte independente de rede; nenhuma chave real utilizada | não executado | — |
| CT-034 | — | 3799ff303c9158f36bcb28bf89103baba899d087 | Ata ou assinatura de aceite real, com ressalvas e critérios verificados | Nenhum aceite formal foi realizado; critérios técnicos desta sprint são derivados do código, não critérios aprovados pela instituição | não executado | — |
| CT-035 | 2026-11-15T21:24:21.7538086-03:00 | 3799ff303c9158f36bcb28bf89103baba899d087 | Coleta com 20 respostas HTTP 200; total_alerts consistente; sem juízo de adequação a SLA | 20/20 respostas válidas; mediana 1,142 ms; p95 por posto 19 = 1,333 ms; sem rede, banco ou carga concorrente | passou | desempenho.log |

Histórico preservado (as repetições não aumentam o denominador final):

| Evidência | Data/hora inicial | Resultado |
| --- | --- | --- |
| backend-inicial.log | 2026-11-15T21:15:01.2552013-03:00 | Suíte anterior à adição: 93 testes/607 asserções aprovados, 1 deprecation |
| python-inicial.log | 2026-11-15T21:15:05.4337864-03:00 | 27 testes aprovados; 1 warning |
| frontend-inicial.log | 2026-11-15T21:21:58.4948951-03:00 | 167 instâncias, 121 aprovadas e 46 falhas; inclui novo teste de cores |
| backend-novos.log | 2026-11-15T21:20:03.8622392-03:00 | 11 instâncias; 10 aprovadas e uma falha de produto |
| python-novos.log | 2026-11-15T21:20:03.6698678-03:00 | 18 instâncias novas aprovadas |
| frontend-reteste-formulario.log | 2026-11-15T21:25:53.8218711-03:00 | Reteste intermediário: 3 aprovados/3 falhas getByLabel, defeito no reparo do teste |
| frontend-reteste-formulario-2.log | 2026-11-15T21:27:37.6099841-03:00 | Reteste após getByLabelText: 6/6 aprovados |
| backend-final.log | 2026-11-15T21:26:21.4861895-03:00 | Regressão: 104 instâncias, 103 aprovadas/uma falha; 625 asserções; 1 deprecation |
| python-final.log | 2026-11-15T21:26:32.1333734-03:00 | Regressão: 45/45 aprovados; 1 warning |
| frontend-final.log | 2026-11-15T21:27:58.9848037-03:00 | Regressão final: consultar contagem estruturada consolidada na seção 5.1 |
| sistema-inicial.log | 2026-11-15T21:22:10.4088666-03:00 | Fluxo E2E real aprovado |
| sistema-final.log | 2026-11-15T21:27:58.9551836-03:00 | Reexecução E2E real aprovada |
| smoke-backend.log | 2026-11-15T21:27:59.0158970-03:00 | 5 testes/109 asserções aprovados; deprecation preservada |
| frontend-build-final.log | 2026-11-15T21:29:05.8095984-03:00 | Build e TypeScript aprovados; aviso de tamanho |
| frontend-lint-final.log | 2026-11-15T21:38:24.8223992-03:00 | Zero erros; um aviso |
| docker.log | 2026-11-15T21:29:25.7029726-03:00 | Pré-condição bloqueada, comando indisponível, código 127 |
| desempenho.log | 2026-11-15T21:24:21.7538086-03:00 | 20 respostas válidas; latência exploratória sem SLA |


Conferência final dos entregáveis: `validar_entregaveis.py` verifica títulos, campos dos 35 CT, evidências, rastreabilidade, contagens dos frameworks, percentuais e ausência de alteração de produção. A aprovação desse verificador é documental e não converte testes reprovados em aprovados. O histórico preserva uma falha inicial da própria regra documental e a correção explicada em `evidencias/preparacao.md`.

Estado Git conferido em `evidencias/git-final.log`: branch de trabalho da Sprint 6, HEAD inicial/final `3799ff303c9158f36bcb28bf89103baba899d087`, sem novo commit, merge ou push; arquivos permanecem prontos para revisão e commit. O inventário `INTEGRIDADE_SHA256.csv` registra SHA256 dos documentos, testes e evidências entregues, excluindo a si próprio e `evidencias/validacao-final.log`, que é produzido após o inventário para evitar referência circular.

Capturas reais complementares: `evidencias/captura-busca.png` e `evidencias/captura-cadastro-legado.png`, geradas pelo Vitest/Chromium nos cenários reprovados. `evidencias/capturas.json` informa origem e hash; são cópias sem edição. As demais falhas permanecem integralmente rastreáveis por logs e relatórios estruturados, sem exigir que imagens ignoradas do diretório frontend sejam versionadas.
