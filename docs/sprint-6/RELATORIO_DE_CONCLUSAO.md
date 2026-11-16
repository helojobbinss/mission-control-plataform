# Conclusão — Sprint 6

## 5. RELATÓRIO DE CONCLUSÃO

A aplicação possui integração funcional efetiva e o fluxo principal passou duas vezes com serviços reais e SQLite isolado. Isso não satisfaz os critérios de liberação: a persistência de alertas perde parâmetros simultâneos (INC-001), a regressão frontend mantém falhas e MariaDB/Docker não foi validado. Não houve alteração de funcionalidades para obter aprovação. Os testes anteriores foram preservados, com adaptação pontual de seis cenários do formulário atual e adição de 35 instâncias distribuídas nas três camadas (11 PHP, 18 Python, seis frontend).

### 5.1 MÉTRICAS


| Métrica | Valor | Denominador/critério |
| --- | --- | --- |
| Casos planejados | 35 | CT-001 a CT-035; cada cenário conta uma vez |
| Casos executados | 30 | Somente passou + falhou; bloqueados e não executados excluídos |
| Percentual executado | 85.71% | 30 / 35 planejados |
| Casos aprovados | 28 | Cenários sem instância reprovada |
| Casos reprovados | 2 | CT-005 e CT-030 |
| Casos bloqueados | 1 | CT-029, ambiente Docker |
| Casos não executados | 4 | CT-031/032/033/034 |
| Taxa de aprovação entre executados | 93.33% | 28 / 30 casos com veredito |
| Instâncias de frameworks executadas | 316 | PHPUnit + pytest + Vitest, somente execução final de cada suíte |
| Instâncias aprovadas/reprovadas | 275 / 41 | Parametrizações contam como instâncias; não como novos CT |
| Testes automatizados distintos executados | 317 | 316 instâncias + um cenário E2E; smoke/retestes já contidos não somados |
| Taxa de aprovação automatizada | 87.07% | 276 / 317; benchmark/build/lint/revisão fora deste denominador |
| Incidentes | 14 | 1 produto alto; restante discriminado por natureza na seção 4 |
| Incidentes por severidade | {'alta': 1, 'média': 8, 'baixa': 5} | Unidade é incidente, não teste |
| Incidentes abertos | 12 | INC-002 e INC-014 fechados; demais abertos |
| Cobertura de código | Não medida | Nenhum percentual de instruções/decisões inferido |
| Histórias com cobertura técnica parcial | 11 / 20 (55,00%) | US02/03/04/05/07/09/12/13/17/19/20; ao menos um cenário pertinente executado, inclusive falhas |
| Histórias sem cobertura executada | 9 / 20 (45,00%) | US01/06/08/10/11/14/15/16/18; CT-033 planejado não conta como executado |
| Aceites formais | 0 | Não houve aceite humano ou aprovação institucional |

Contagem não implica certificação funcional de cada história: US05 cobre cálculo e não rota planejada; US12 usa sensores simulados; US20 cobre orçamento e não custos efetivos. O benchmark forneceu observações locais (mediana 1,142 ms; p95 1,333 ms), sem requisito de tempo, rede ou carga; esses valores não comprovam desempenho em implantação.

### 5.2 AVALIAÇÃO DOS CRITÉRIOS DE CONCLUSÃO


| Critério | Situação | Justificativa |
| --- | --- | --- |
| Todos os testes críticos executados e aprovados | Não atendido | CT-005 reprovado; MariaDB bloqueado; aceite formal pendente |
| Sem incidente crítico em aberto | Não atendido | INC-001, severidade alta, compromete integridade dos alertas |
| Execuções com evidência e origem rastreável | Atendido no escopo executado | Logs e relatórios finais, SHA base e inventário de arquivos; tentativas pré-capturador identificadas como transcrições |
| Suítes viáveis e smoke reexecutados | Atendido com falhas registradas | Regressões completas, smoke e E2E executados; não equivalem a regressão toda aprovada |
| Ambiente isolado e dados fictícios | Atendido | SQLite :memory: no PHPUnit e temporário no E2E; sem migrations no banco real |
| Sem mudança indevida de produção | Atendido | Apenas testes, capturador, medição, docs e regra de ignore para ferramentas locais |
| Aceite acadêmico/usuário documentado | Não atendido | CT-034 não executado; ausência de Word original e critérios formais explicitada |

### 5.3 DESVIOS DO PLANO

Docker/MariaDB bloqueou antes da inicialização. Testes com serviços públicos ao vivo não foram realizados, para preservar independência de rede e não usar credenciais reais. Foram utilizados mocks somente nas fronteiras explicitadas, além de uma integração real local separada. Apenas Chromium desktop foi preparado; Firefox, móvel e sessão humana de usabilidade permanecem não executados. Não houve teste de carga/pentest/cobertura instrumental, pois exigem escopo e configuração próprios. Não foi possível preencher campos desconhecidos do Word ausente; todos os títulos enviados pelo usuário foram preenchidos neste relatório. Sprints 2–5 não estavam disponíveis. Preparação precisou de Node portátil e localização do Python, sem instalar ferramentas globalmente. O reteste intermediário do formulário introduziu um seletor incompatível; a falha foi preservada e corrigida em nova execução.

### 5.4 RISCOS RESIDUAIS

Permanecem perda de alertas, regressão incompleta dos templates, diferenças SQLite/MariaDB (incluindo ALTER TABLE específico), dependências e avisos de compatibilidade, arquivos históricos contraditórios, APIs externas não verificadas ao vivo e telas sem funções de gestão completas. A política de missões e ordens aceita usuários autenticados sem granularidade adicional no código; isso exige requisito claro antes de mudar a regra. Tokens existentes não são revogados automaticamente por mudança de estado/senha; essa observação estática requer teste específico e decisão de segurança posterior. Exclusão de satélite/missão referenciada pode resultar em erro interno por FK restrict; não houve validação dinâmica de sua resposta nesta sprint. Não há alegação de segurança, acessibilidade ou desempenho para produção a partir desta execução.

### 5.5 LIÇÕES APRENDIDAS

O estado do código e os locks são fontes mais confiáveis para preparar a execução do que documentos de sprints antigas. Mocks permitem tratar indisponibilidade, mas só um fluxo separado com processos reais demonstra a comunicação local entre camadas. Aprovar sensores e algoritmos isoladamente não garante integridade da persistência: o caso de alertas simultâneos encontrou perda não coberta pela suíte anterior. Testes herdados devem acompanhar a tradução das telas, os providers e o contrato de persistência; uma expectativa antiga não deve levar à alteração da aplicação apenas para obter aprovação. Métricas com denominadores distintos evitam contabilizar parametrizações e retestes como novos cenários de negócio.

### 5.6 RECOMENDAÇÃO

**Não liberar esta versão como pronta para operação ou entrega sem ressalvas.** O material acadêmico e os testes estão prontos para revisão, com falhas explicitadas. Corrigir INC-001 mediante revisão de produto, retestar a persistência de alertas e suas resoluções, revisar as 40 falhas de testes herdados e executar regressão em ambiente MariaDB de teste separado antes de uma nova avaliação. Pactuar critérios de aceite com a equipe e registrar a decisão real. O sucesso do fluxo E2E demonstra viabilidade do núcleo, mas não substitui esses critérios.

