# Incidentes — Sprint 6

## 4. RELATÓRIO DE INCIDENTE

Os incidentes distinguem produto, testes, dependência, documentação e ambiente. Falhas de seleção em templates não são automaticamente defeitos de funcionalidade em produção. Os IDs agregam a mesma causa por módulo; cada método reprovado continua identificável no inventário. Não se converte o número de incidentes em número de testes.

| ID | Natureza | Resumo | Caso | Severidade | Prioridade | Status |
| --- | --- | --- | --- | --- | --- | --- |
| INC-001 | Produto | Alertas distintos são sobrescritos | CT-005 | alta | alta | aberto |
| INC-002 | Infraestrutura de testes | Seis testes de missão desatualizados e sem QueryClient | CT-030 | média | alta | fechado |
| INC-003 | Testes herdados | Busca usa placeholder e textos antigos | CT-030 | média | média | aberto |
| INC-004 | Testes herdados | Diálogos do template de usuários divergem dos testes | CT-030 | média | média | aberto |
| INC-005 | Testes herdados | Cópia legada de usuários possui expectativas obsoletas | CT-030 | média | média | aberto |
| INC-006 | Testes herdados | Descrição da exclusão múltipla de tarefas mudou | CT-030 | média | média | aberto |
| INC-007 | Testes herdados | Formulário legado de cadastro usa seletores antigos | CT-030 | média | média | aberto |
| INC-008 | Compatibilidade | Constante PDO depreciada no PHP 8.5 | CT-027 | baixa | baixa | aberto |
| INC-009 | Dependência de testes | TestClient alerta sobre httpx depreciado | CT-023/027 | baixa | baixa | aberto |
| INC-010 | Empacotamento | Chunk principal acima do aviso de 500 kB | CT-013 | baixa | média | aberto |
| INC-011 | Análise estática | Aviso de Fast Refresh | CT-014 | baixa | baixa | aberto |
| INC-012 | Documentação | Documentos anteriores descrevem versões e funções divergentes | CT-028 | média | média | aberto |
| INC-013 | Ambiente | Docker indisponível para validar MariaDB | CT-029 | média | alta | aberto |
| INC-014 | Preparação dos testes | Ferramentas fora do PATH, ZIP e política de scripts | CT-028 | baixa | média | fechado |

### INC-001 — Alertas distintos são sobrescritos

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Produto. Caso: CT-005. Severidade: alta; prioridade: alta; estado: aberto.

Arquivo/módulo: `backend/app/Services/TelemetryRecorder.php::record`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Criar satélite isolado; gravar na mesma transação alertas HIGH_ANGULAR_VELOCITY para gyroscope_x e gyroscope_y.

Resultado esperado e obtido: Esperado: dois parâmetros preservados. Obtido: só gyroscope_y.

Causa identificada ou hipótese: Chave de updateOrCreate usa satellite_id, code e resolved; omite parameter (causa identificada).

Impacto: Histórico perde uma falha simultânea; contagem/diagnóstico podem divergir da leitura.

Evidência: backend-novos.log; backend-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-002 — Seis testes de missão desatualizados e sem QueryClient

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Infraestrutura de testes. Caso: CT-030. Severidade: média; prioridade: alta; estado: fechado.

Arquivo/módulo: `frontend/src/features/tasks/components/tasks-mutate-drawer.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar arquivo original no commit base: falta QueryClient; após fornecer contexto, seletores de Task e showSubmittedData divergem da missão atual.

Resultado esperado e obtido: Antes: 6 falhas. Reteste intermediário: 3 passaram/3 falharam por getByLabel inexistente introduzido no reparo. Após getByLabelText: 6/6 aprovados.

Causa identificada ou hipótese: Contexto ausente e fixtures/contrato antigos. Correção apenas no teste: QueryClient por render, listSatellites/saveMission controlados, seletores atuais.

Impacto: Impedia validar formulário. Preservadas seis intenções originais; envio confirma serviço mockado, não persistência real.

Evidência: frontend-inicial.log; frontend-reteste-formulario.log; frontend-reteste-formulario-2.log; frontend-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-003 — Busca usa placeholder e textos antigos

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/context/search-provider.test.tsx; components/command-menu.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: npm test -- src/context/search-provider.test.tsx; abrir paleta pelos atalhos definidos.

Resultado esperado e obtido: 7 falhas/8: timeout; placeholder esperado Type a command or search... difere de Digite uma palavra para pesquisar.

Causa identificada ou hipótese: Divergência textual comprovada; demais seletores precisam revisão, não há prova de defeito do produto em todos os cenários.

Impacto: Reduz confiabilidade da regressão da busca.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-004 — Diálogos do template de usuários divergem dos testes

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/users/components/users-{action,invite,multi-delete}-dialog.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar os três arquivos com npm test -- caminho.

Resultado esperado e obtido: 11 falhas: action=3, invite=3, multi-delete=5; seletores/textos não encontrados.

Causa identificada ou hipótese: Textos e fixtures antigos; mensagens traduzidas; fluxos são template, não CRUD oficial. Conferir cada falha no inventário.

Impacto: Regressão de template incompleta; não implica falha do cadastro oficial por gerente.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-005 — Cópia legada de usuários possui expectativas obsoletas

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/userscopy/components/users-{action,invite,multi-delete}-dialog.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar os três arquivos userscopy com npm test -- caminho.

Resultado esperado e obtido: 17 falhas: action=9, invite=3, multi-delete=5.

Causa identificada ou hipótese: Seletores de campos/textos da versão anterior divergem dos componentes; hipótese de demais erros encobertos por timeouts.

Impacto: Testes de componentes legados falham; página oficial usa management.tsx, cuja criação foi validada no E2E.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-006 — Descrição da exclusão múltipla de tarefas mudou

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/tasks/components/tasks-multi-delete-dialog.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar arquivo; conferir teste de título/descrição/input/botões.

Resultado esperado e obtido: 1 falha/6; texto esperado não localizado.

Causa identificada ou hipótese: Expectativa de apresentação antiga; outros cinco cenários passam.

Impacto: Ruído na regressão de exclusão múltipla.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-007 — Formulário legado de cadastro usa seletores antigos

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Testes herdados. Caso: CT-030. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/src/features/auth/sign-up/components/sign-up-form.test.tsx`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar arquivo; localizar Create Account e Password.

Resultado esperado e obtido: 4 falhas/4; componente tem Criar conta e Senha.

Causa identificada ou hipótese: Seletores obsoletos. Componente legado simula criação; rota pública oficial orienta solicitar acesso.

Impacto: Falsos negativos de template; não comprova cadastro de usuário no backend.

Evidência: frontend-final.log; frontend-final.json. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-008 — Constante PDO depreciada no PHP 8.5

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Compatibilidade. Caso: CT-027. Severidade: baixa; prioridade: baixa; estado: aberto.

Arquivo/módulo: `backend/config/database.php:62`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar PHPUnit com --display-deprecations --filter EnvironmentTest no PHP 8.5.12.

Resultado esperado e obtido: Testes aprovam, mas PDO::MYSQL_ATTR_SSL_CA gera deprecation.

Causa identificada ou hipótese: Mudança da API do PHP 8.5; não alterada configuração de produção nesta sprint.

Impacto: Dívida de compatibilidade; aviso não contado como falha funcional.

Evidência: php-avisos.log; backend-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-009 — TestClient alerta sobre httpx depreciado

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Dependência de testes. Caso: CT-023/027. Severidade: baixa; prioridade: baixa; estado: aberto.

Arquivo/módulo: `python-api/requirements.txt; .venv/Lib/site-packages/fastapi/testclient.py`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar pytest com dependências fixadas.

Resultado esperado e obtido: 45 testes aprovam; warning StarletteDeprecationWarning recomenda httpx2.

Causa identificada ou hipótese: Dependências de teste atuais ainda usam httpx; atualização exige validação própria.

Impacto: Risco futuro na infraestrutura; nenhum pacote de produção foi alterado.

Evidência: python-inicial.log; python-final.log; desempenho.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-010 — Chunk principal acima do aviso de 500 kB

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Empacotamento. Caso: CT-013. Severidade: baixa; prioridade: média; estado: aberto.

Arquivo/módulo: `frontend/vite.config.ts; frontend/src`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: npm run build.

Resultado esperado e obtido: Build e tipos aprovam; Vite emite aviso de chunk grande.

Causa identificada ou hipótese: Dependências/empacotamento concentrados; análise de distribuição não realizada.

Impacto: Possível impacto no carregamento; não houve medição de rede que quantifique esse efeito.

Evidência: frontend-build-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-011 — Aviso de Fast Refresh

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Análise estática. Caso: CT-014. Severidade: baixa; prioridade: baixa; estado: aberto.

Arquivo/módulo: `frontend/src/features/tasks/components/tasks-columns.tsx:11`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: npm run lint.

Resultado esperado e obtido: Zero erros e um aviso react-refresh/only-export-components.

Causa identificada ou hipótese: Exportação de componente com outros símbolos no mesmo módulo.

Impacto: Aviso de desenvolvimento; sem falha funcional demonstrada.

Evidência: frontend-lint-final.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-012 — Documentos anteriores descrevem versões e funções divergentes

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Documentação. Caso: CT-028. Severidade: média; prioridade: média; estado: aberto.

Arquivo/módulo: `docs/telemetry-units.md; docs/integration-baseline.md; README.md`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Comparar composer.lock/manifests/rotas com documentos: catálogo cita Laravel 8/PHP 8.2; baseline afirma frontend ausente; README menciona MySQL/Socket.IO/N2YO.

Resultado esperado e obtido: Atual: Laravel 12, React integrado, MariaDB configurado, sem serviço Socket.IO ou integração N2YO localizada.

Causa identificada ou hipótese: Documentos de épocas distintas sem atualização consolidada; esta sprint registra ressalvas sem reescrevê-los.

Impacto: Instruções antigas podem preparar ambiente incorreto ou sugerir recursos inexistentes.

Evidência: auditoria.json; rotas.log; matriz neste relatório. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-013 — Docker indisponível para validar MariaDB

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Ambiente. Caso: CT-029. Severidade: média; prioridade: alta; estado: aberto.

Arquivo/módulo: `Ambiente Windows; compose.yaml`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Executar docker version.

Resultado esperado e obtido: Comando não localizado; CT-029 bloqueado antes da inicialização.

Causa identificada ou hipótese: Executável Docker não disponível na sessão; não se conclui que o daemon exista ou funcione.

Impacto: Sem comprovação das migrations e restrições no mecanismo configurado para implantação.

Evidência: docker.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

### INC-014 — Ferramentas fora do PATH, ZIP e política de scripts

Data: 15/11/2026. Commit base: `3799ff303c9158f36bcb28bf89103baba899d087`; árvore de trabalho da Sprint 6. Natureza: Preparação dos testes. Caso: CT-028. Severidade: baixa; prioridade: média; estado: fechado.

Arquivo/módulo: `Ambiente local; .tools ignorado; docs/sprint-6/Executar-Com-Evidencia.ps1`. Pré-condição: dependências e isolamento descritos no caso; para bloqueios, a pré-condição ausente é parte do incidente.

Reprodução: Composer inicial sem ZIP; node/docker ausentes do PATH; python era alias sem acesso; uv tentou cache sem escrita; PowerShell recusou ps1.

Resultado esperado e obtido: Preparação resolvida para PHP/Python/Node/Chromium; Docker continua em INC-013. Extração PDF teve erro de aspas e depois de saída cp1252; arquivo UTF-8 foi gravado e lido. Consulta CIM de SO recebeu acesso negado; versão não inferida dessa consulta.

Causa identificada ou hipótese: Habilitado ZIP só no comando Composer; Python existente em .venv; Node portátil oficial com SHA256; cache no workspace; execução de scripts liberada só no processo.

Impacto: Atraso de preparação; sem alteração global de configuração. Tentativas anteriores ao capturador têm apenas transcrição, não logs completos.

Evidência: preparacao.md; npm-ci.log; chromium-install.log; ambiente.log. Sem correção de produto; somente INC-002 e a preparação INC-014 foram corrigidos/retestados.

