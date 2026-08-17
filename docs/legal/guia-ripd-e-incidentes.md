# Guia prático — RIPD e resposta a incidentes da Urus FIDC

**Data:** 16 de agosto de 2026  
**Controlador:** URUS ASSESSORIA EMPRESARIAL LTDA, CNPJ 35.028.407/0001-01  
**Representante responsável pela aprovação:** José Antonio  
**Área de privacidade:** Departamento Jurídico  
**Canal de suporte, privacidade, jurídico e incidentes:** adm@uruscapital.com.br

Este guia traduz as recomendações da ANPD para a realidade da Plataforma. Ele deve virar dois documentos internos controlados por versão: um RIPD aprovado e um Procedimento de Resposta a Incidentes testado.

## Parte 1 — Como elaborar o RIPD

### 1. O que é e por que a Urus deve elaborar

O Relatório de Impacto à Proteção de Dados Pessoais descreve tratamentos capazes de gerar alto risco aos direitos dos titulares, os riscos identificados e as medidas usadas para reduzi-los. A responsabilidade pela elaboração é do controlador, com participação recomendada do encarregado.

Para a Urus, o RIPD é recomendável antes do uso comercial porque a jornada combina:

- documentos financeiros e societários de terceiros;
- possibilidade de dados sensíveis e dados de pessoas vulneráveis dentro de arquivos;
- efeitos econômicos relevantes na busca por crédito;
- matching e triagem por inteligência artificial;
- compartilhamento com FIDCs; e
- fornecedores e transferências internacionais.

### 2. Escopo recomendado

Elaborar um **RIPD principal da jornada de qualificação e distribuição de operações**, desde o cadastro da empresa até o envio ao FIDC. Usar anexos específicos para:

1. upload, armazenamento, antivírus e retenção documental;
2. matching e triagem por IA/OpenRouter;
3. distribuição e entrega segura a FIDCs; e
4. acesso administrativo, suporte e impersonação.

Cadastro de usuário e cobrança podem ficar no inventário geral e ser incorporados ao RIPD se a avaliação interna identificar risco elevado. Cada FIDC continua responsável por avaliar a necessidade de seu próprio RIPD para a análise que realiza após receber os dados.

### 3. Equipe e aprovações

Designar formalmente:

- **patrocinador:** José Antonio, representante responsável pela aprovação;
- **responsável pelo documento:** Departamento Jurídico;
- **produto/operações:** explica finalidade, jornada e decisões humanas;
- **tecnologia/segurança:** mapeia arquitetura, acessos, logs, backups e incidentes;
- **jurídico/compliance:** valida papéis, bases legais, contratos e regulação financeira; e
- **fornecedores/FIDCs:** fornecem informações de segurança, retenção, localização e subprocessadores.

A aprovação final deve registrar nome, função, data, versão, riscos aceitos, condicionantes e prazos.

### 4. Inventário e fluxo de dados

Documentar o ciclo completo, sem limitar a análise ao banco principal:

```text
Usuário/terceiro
  → cadastro e autenticação (Supabase)
  → dados da empresa e operação (Urus/Supabase)
  → consulta cadastral (BrasilAPI)
  → matching por regras (Urus)
  → upload privado (Supabase Storage)
  → validação e antivírus
  → triagem por IA (OpenRouter + provedor de modelo)
  → revisão humana (Urus)
  → confirmação da distribuição (usuário/Urus)
  → entrega segura (Resend + FIDC)
  → retenção, bloqueio legal e eliminação
```

Para cada etapa, registrar:

- finalidade específica;
- titular e fonte dos dados;
- categorias de dados, inclusive sensíveis e de menores;
- quantidade aproximada de titulares e arquivos;
- base legal por finalidade;
- quem decide a finalidade e quem apenas executa instruções;
- sistemas, pessoas e fornecedores que acessam;
- países e mecanismos de transferência;
- prazo e evento que inicia a retenção; e
- descarte, backup e trilha de auditoria.

### 5. Necessidade, proporcionalidade e bases legais

Para cada dado, responder:

1. É realmente necessário para o matching, checklist ou obrigação legal?
2. É possível usar dado agregado, tarja, pseudônimo ou campo menos invasivo?
3. O titular espera razoavelmente esse uso?
4. A finalidade pode ser alcançada sem enviar o arquivo inteiro à IA ou ao FIDC?
5. A base legal escolhida é adequada ao dado e à finalidade?
6. Se houver legítimo interesse, foi realizado e documentado o teste de finalidade, necessidade e balanceamento?
7. Se houver dado sensível, qual hipótese específica do artigo 11 da LGPD se aplica?

O aceite do Aviso de Privacidade não deve ser usado como consentimento genérico.

### 6. Avaliação de riscos

Usar uma metodologia simples e repetível:

- **probabilidade:** 1 (rara) a 5 (quase certa);
- **impacto ao titular:** 1 (baixo) a 5 (muito grave);
- **risco inerente:** probabilidade × impacto antes dos controles;
- **controles existentes e sua evidência**;
- **risco residual:** nova pontuação após os controles;
- **decisão:** aceitar, reduzir, evitar ou transferir contratualmente;
- **responsável e prazo** para cada ação.

Exemplos obrigatórios para a Urus:

| Risco | Possível dano | Mitigação esperada |
|---|---|---|
| Arquivo com malware | comprometimento do ambiente e do FIDC | quarentena e antivírus antes de abrir, analisar ou distribuir |
| Documento enviado ao FIDC errado | quebra de sigilo, fraude e dano reputacional | confirmação explícita do destinatário e manifesto imutável do pacote |
| Conta profissional comprometida | acesso a operações e documentos | MFA, alertas, sessões, rate limit e recuperação segura |
| Dados excessivos em documentos | exposição de sócios e terceiros | checklist mínimo, tarja orientada e recusa de conteúdo estranho à operação |
| Retenção indefinida | uso incompatível e ampliação do impacto | tabela de retenção aplicada por automação e verificada por auditoria |
| Uso ou retenção por provedor de IA | perda de controle e transferência irregular | DPA, zero data retention, modelos permitidos e mecanismo internacional válido |
| Erro ou viés da IA/matching | exclusão indevida ou decisão econômica incorreta | explicação, revisão humana, contestação e monitoramento de qualidade |
| Abuso de acesso administrativo | quebra de confidencialidade | menor privilégio, MFA, somente leitura, motivo, tempo limitado e revisão de logs |
| Dados sensíveis ou de menores | discriminação e violação de direitos | detecção/sinalização, acesso reforçado, base específica e melhor interesse |
| Falha de fornecedor | indisponibilidade, vazamento ou perda | due diligence, SLA de incidente, backup e plano de saída |

Riscos residuais altos não devem ser apenas “aceitos”. Exigem bloqueio do lançamento, redução adicional ou decisão formal e fundamentada da direção.

### 7. Plano de ação e evidências

Cada mitigação deve apontar uma evidência verificável, por exemplo:

- teste de antivírus e regra que impede distribuição sem resultado `clean`;
- tela e log de confirmação do FIDC e arquivos;
- DPA e cláusulas-padrão de transferência;
- teste de exclusão e restauração de backup;
- relatório de revisão de acessos administrativos;
- amostra de decisões de IA comparada com revisão humana;
- teste do canal de direitos; e
- simulado de incidente com ata e ações corretivas.

### 8. Fechamento e revisão

O RIPD não é um documento produzido uma única vez. Revisar, no mínimo, anualmente e sempre que houver:

- novo tipo de documento ou finalidade;
- novo FIDC, fornecedor, modelo de IA ou país;
- decisão automatizada com maior efeito;
- mudança relevante de volume ou público;
- incidente, auditoria ou reclamação relevante; ou
- mudança legal ou regulatória.

A versão interna deve ser detalhada. Uma síntese pública pode demonstrar transparência sem expor arquitetura, credenciais, vulnerabilidades ou segredo comercial.

## Parte 2 — Como elaborar o procedimento de incidentes

### 1. Objetivo e definição

O procedimento deve permitir detectar, conter, avaliar, comunicar e aprender com eventos que comprometam confidencialidade, integridade, disponibilidade ou autenticidade de dados pessoais. Exemplos: acesso indevido, envio ao destinatário errado, ransomware, perda de arquivo, indisponibilidade destrutiva, alteração não autorizada e exposição por fornecedor.

Uma vulnerabilidade ainda não explorada deve ser corrigida, mas não é automaticamente um incidente com dados pessoais. Todo evento suspeito deve ser triado e todo incidente confirmado deve ser registrado.

### 2. Papéis mínimos

Manter nomes, telefones alternativos e substitutos para:

- **líder do incidente:** coordena decisões, prazos e registro;
- **segurança/tecnologia:** contém, preserva evidências, investiga e recupera;
- **encarregado/privacidade:** avalia titulares, dados, risco e comunicação;
- **jurídico:** valida obrigações, sigilo e relação com autoridades;
- **operações/produto:** identifica operações, FIDCs e usuários afetados;
- **comunicação/atendimento:** prepara mensagens e recebe dúvidas;
- **representante responsável:** José Antonio, que aprova a comunicação à ANPD; e
- **fornecedores:** pontos de escalonamento 24×7 e SLA contratual.

O acesso ao SEI!ANPD e a comprovação de representação devem estar preparados antes de qualquer incidente.

### 3. Fluxo operacional e metas internas

#### Etapa 1 — Detectar e registrar

Qualquer pessoa ou fornecedor deve comunicar imediatamente pelo e-mail **adm@uruscapital.com.br**, identificando no assunto **“INCIDENTE DE SEGURANÇA”**. Registrar hora da descoberta, quem reportou, sistema, descrição, evidências iniciais e medidas já tomadas.

**Meta interna:** abertura do registro em até 1 hora.

#### Etapa 2 — Conter sem destruir evidências

Revogar tokens e sessões, bloquear credenciais, suspender distribuição, isolar arquivos, preservar logs e acionar o fornecedor. Não apagar evidências nem prometer ausência de impacto antes da investigação.

**Meta interna:** primeira contenção em até 4 horas para incidentes críticos.

#### Etapa 3 — Confirmar e delimitar

Responder:

- houve comprometimento confirmado de dados pessoais?
- quais ambientes, contas, operações, FIDCs e fornecedores estão envolvidos?
- quais dados e titulares foram afetados?
- houve cópia, visualização, alteração, destruição ou indisponibilidade?
- os dados estavam protegidos por criptografia ou outra medida eficaz?
- o incidente continua ativo?

Registrar a data e hora em que a Urus tomou conhecimento do incidente.

#### Etapa 4 — Avaliar risco ou dano relevante

Considerar em conjunto:

- contexto da operação financeira;
- natureza, quantidade e sensibilidade dos dados;
- número e categorias de titulares;
- dados de autenticação, financeiros, sigilosos ou de menores;
- possibilidade de fraude, roubo de identidade, discriminação e danos materiais, morais ou reputacionais;
- facilidade de identificar os titulares; e
- eficácia real das medidas de mitigação.

Classificar e fundamentar a conclusão. Não comunicar também é uma decisão que deve ser registrada.

#### Etapa 5 — Decidir e comunicar

Se o incidente confirmado puder causar risco ou dano relevante, o controlador deve comunicar a ANPD e os titulares em **três dias úteis**, ressalvado prazo específico aplicável. A meta interna deve ser concluir a decisão até 24 horas e preparar a comunicação em até 48 horas, deixando margem para aprovação e protocolo.

Se faltarem informações, enviar comunicação preliminar justificada e complementar no prazo regulamentar de até 20 dias úteis. A comunicação à ANPD é feita pelo encarregado ou representante legalmente constituído no SEI!ANPD.

A comunicação aos titulares deve ser direta e individual sempre que possível, em linguagem simples, e informar ao menos:

- natureza e categorias de dados afetados;
- data em que a Urus tomou conhecimento;
- riscos e possíveis impactos;
- medidas de segurança relevantes, sem expor segredo ou facilitar ataques;
- providências adotadas e recomendações ao titular;
- motivo de eventual demora; e
- canal de contato e dados do encarregado, quando aplicável.

Não incluir no processo público da ANPD dados pessoais ou segredos desnecessários; solicitar sigilo quando cabível.

#### Etapa 6 — Recuperar e acompanhar

Restaurar de fonte confiável, trocar segredos, corrigir a causa raiz, monitorar recorrência, apoiar titulares e acompanhar fornecedores. Documentar quando o serviço voltou ao normal e quais riscos permanecem.

#### Etapa 7 — Encerrar e aprender

Realizar revisão pós-incidente com causa raiz, decisões, linha do tempo, custos, falhas de controle e plano corretivo. Atualizar RIPD, contratos, treinamento, arquitetura e procedimentos.

### 4. Registro obrigatório

Manter registro de **todos os incidentes confirmados com dados pessoais**, inclusive os não comunicados, por no mínimo cinco anos a partir do registro, contendo:

- data de conhecimento;
- circunstâncias;
- dados e titulares afetados;
- quantidade estimada;
- avaliação de risco e danos possíveis;
- medidas de correção e mitigação;
- comunicação realizada e seu conteúdo; e
- justificativa da ausência de comunicação, quando for o caso.

O próprio registro deve ter acesso restrito, integridade protegida e retenção controlada.

### 5. Regras para fornecedores e FIDCs

Contratos devem exigir que operadores e suboperadores avisem a Urus **sem demora injustificada**. Como meta contratual, recomenda-se notificação inicial em até 12 horas da detecção, atualizações frequentes, preservação de evidências e relatório de causa raiz.

Quando a Urus atuar como operadora de outro controlador, deve avisá-lo imediatamente e fornecer as informações necessárias. A decisão e a obrigação de comunicação externa pertencem ao controlador, salvo divisão específica e válida de responsabilidades.

### 6. Preparação e testes

Antes do lançamento:

1. criar o canal interno e a lista de plantão;
2. preparar acesso e representação no SEI!ANPD;
3. aprovar matriz de severidade e formulário de risco;
4. preparar modelos de comunicação à ANPD, titulares, FIDCs e fornecedores;
5. configurar logs, relógios sincronizados e preservação de evidências;
6. testar revogação de links, sessões e chaves;
7. realizar simulado de documento enviado ao FIDC errado; e
8. realizar simulado de vazamento ou retenção indevida pelo provedor de IA.

Repetir os simulados ao menos anualmente e após mudança material na Plataforma. Ações encontradas no exercício devem ter responsável, prazo e verificação de conclusão.

## Referências oficiais

- [ANPD — Relatório de Impacto à Proteção de Dados Pessoais](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd)
- [ANPD — Comunicação de Incidente de Segurança](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis)
- [ANPD — Regulamento de Comunicação de Incidente de Segurança](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-aprova-o-regulamento-de-comunicacao-de-incidente-de-seguranca)
- [Lei Geral de Proteção de Dados Pessoais](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)

## Próxima decisão necessária

Para transformar este guia em documentos internos aprovados, a Urus ainda precisa definir:

- responsáveis técnicos, jurídicos e seus substitutos para o plantão de incidentes;
- prazos de retenção por categoria; e
- contratos e localizações dos fornecedores.
