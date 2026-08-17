# Avaliação de lacunas — LGPD e documentos legais da Urus FIDC

**Data da análise:** 16 de agosto de 2026  
**Escopo:** código e documentação disponíveis no repositório da Plataforma. Não foram analisados contratos, configuração dos ambientes de produção, logs reais, políticas internas ou painéis dos fornecedores.

## Resumo executivo

A Plataforma já incorpora controles positivos: isolamento por conta com RLS, armazenamento privado, URLs assinadas, MFA administrativo, acesso de suporte temporário e auditado, rate limit, validação de formato e tamanho, checksum, e-mails sem dados financeiros e revisão humana das recomendações de IA.

Ainda assim, **não é recomendável liberar uploads de documentos reais para uso comercial** antes de tratar as lacunas críticas abaixo. O principal risco decorre da combinação de documentos financeiros de terceiros, compartilhamento com FIDCs, IA internacional e ausência de um ciclo de vida de dados plenamente implementado.

## Lacunas críticas — resolver antes da publicação/produção

### 1. Identificação e canais preenchidos; formalização da função de privacidade pendente

O cartão de CNPJ fornecido permitiu identificar URUS ASSESSORIA EMPRESARIAL LTDA, CNPJ 35.028.407/0001-01, nome fantasia Urus Capital e endereço em Barueri/SP. O responsável confirmou em 16 de agosto de 2026 que esses dados continuam atuais. O e-mail `adm@uruscapital.com.br` foi definido como canal de suporte, jurídico, privacidade e incidentes; o Departamento Jurídico foi indicado como área responsável por privacidade; e José Antonio foi indicado como representante responsável pela aprovação do RIPD e das comunicações à ANPD.

**Ação:** formalizar internamente as atribuições do Departamento Jurídico, definir substitutos e avaliar juridicamente se a Urus deve designar formalmente um encarregado nos termos da regulamentação da ANPD. Se houver designação, publicar sua identidade ou a identificação da pessoa jurídica responsável e o contato já informado.

### 2. Antivírus não habilitado

O produto aceita PDF, planilhas e imagens de até 25 MB, mas registra `malware_scan_status: not_configured`. A validação de extensão, assinatura binária e checksum não substitui varredura contra malware.

**Ação:** bloquear o processamento e a distribuição até varredura bem-sucedida; colocar arquivos em quarentena; definir tratamento para infectado, falha e indisponibilidade; testar arquivos de referência inofensivos; registrar versão do motor e resultado; revisar arquivos já recebidos.

### 3. Aceite legal inadequado

O cadastro usa uma única caixa com “Li e aceito os Termos de Uso e o Aviso de Privacidade”, sem links visíveis nos próprios textos. O banco registra apenas um tipo combinado (`terms_and_privacy`) e uma versão em metadado. O aviso de privacidade é ciência/transparência, não contrato nem consentimento genérico.

**Ação:** incluir links destacados; registrar separadamente `terms_acceptance` e `privacy_notice_acknowledgement`, com versão, data/hora, usuário e hash do conteúdo; exigir novo aceite apenas para alterações contratuais materiais; não usar esse registro como consentimento para todas as finalidades. Coletar IP somente se necessário e, de preferência, com proteção/pseudonimização e retenção definida.

### 4. Retenção e exclusão não estão efetivamente fechadas

Existe rotina que apaga arquivos quando `retention_due_at` vence, mas não foi encontrado fluxo que atribua essa data às operações. Também não há processo de encerramento de conta, eliminação de dados, expiração completa das entregas ou política de backup. Metadados e resultados de IA permanecem mesmo após a exclusão física do arquivo.

**Ação:** aprovar tabela de retenção por categoria; definir o evento inicial de contagem; preencher `retention_due_at`; encerrar entregas expiradas; eliminar tokens/OTP e pacotes conforme a política; criar fluxo de conta encerrada e solicitação de titular; compatibilizar logs imutáveis com minimização e retenção; documentar backups e bloqueio legal.

### 5. Compartilhamento com FIDC precisa de instrução/controle explícito

A distribuição é autorizada por administrador e inclui documentos aprovados do checklist. Não foi identificado um passo final no qual o usuário veja o destinatário e o conjunto exato de arquivos e confirme estar autorizado a compartilhar. Documentos podem conter dados de sócios e terceiros.

**Ação:** antes da distribuição, mostrar FIDC, finalidade, categorias de dados, arquivos e prazo; obter confirmação/instrução auditável do usuário ou documentar claramente a autorização contratual existente; manter acordo de proteção de dados com cada FIDC e exigir aviso próprio do destinatário.

### 6. IA e transferências internacionais sem evidência contratual no repositório

Arquivos ou seu conteúdo são enviados ao OpenRouter e ao modelo escolhido. A chamada pede `data_collection: deny`, mas isso não substitui DPA, verificação de retenção, localização, suboperadores e mecanismo de transferência internacional. Supabase, Vercel, Stripe e Resend também podem envolver processamento internacional.

**Ação:** inventariar países/regiões e suboperadores; celebrar DPA; incorporar cláusulas-padrão da ANPD quando aplicável; verificar zero data retention e proibição de treino; limitar modelos permitidos; registrar provedor/modelo por análise; prever fallback sem ampliar destinos silenciosamente; atualizar o Aviso quando houver mudança.

### 7. Não há processo visível para direitos dos titulares

Não foram encontrados canal, formulário, autenticação proporcional, exportação de dados pessoais, correção ampla, oposição, revisão, eliminação ou fluxo interno de resposta.

**Ação:** criar canal e procedimento com protocolo, verificação de identidade, triagem controlador/operador, busca em sistemas e fornecedores, resposta, negativa fundamentada e registro de prazo. Incluir pessoas sem conta cujos dados estejam em documentos.

## Lacunas altas — tratar no lançamento inicial

### 8. RIPD e bases legais para documentos de terceiros

Os checklists podem incluir documentos societários, financeiros, bancários, fiscais e comprovantes de endereço de sócios. Há risco de dados sensíveis, menores, excesso de dados e efeitos econômicos relevantes.

**Ação:** realizar RIPD antes do tratamento em escala; mapear titulares, dados, bases legais e riscos por tipo documental; documentar teste de legítimo interesse quando usado; definir campos proibidos e orientação de tarja/redação; impedir dados não necessários.

### 9. Governança de fornecedores não demonstrada

O código mostra integrações, mas não comprova avaliação de segurança, contratos, SLA de incidente, auditoria, subprocessadores, devolução/eliminação e assistência a direitos.

**Ação:** criar inventário e processo de due diligence; estabelecer cláusulas controlador-operador; revisar certificados/relatórios de segurança; manter plano de saída e revisão periódica.

### 10. Plano formal de incidentes não identificado

Há controles técnicos, mas não foram encontrados playbook, papéis, critérios de risco/dano relevante, preservação de evidências, contatos ou modelos de comunicação.

**Ação:** adotar plano de resposta e simular cenários de documento exposto, conta comprometida, fornecedor de IA e link de FIDC. A regulamentação atual prevê comunicação à ANPD e aos titulares em três dias úteis quando houver risco ou dano relevante.

### 11. Coleta técnica e registros de aceite incompletos/inconsistentes

Há colunas para `ip_hash` e `user_agent_hash`, mas os fluxos analisados nem sempre as preenchem. Ao mesmo tempo, o contexto de impersonação usa IP e user-agent para hash, sem descrição detalhada no produto.

**Ação:** decidir quais sinais são realmente necessários; aplicar hash com segredo/rotação quando apropriado; documentar finalidade e retenção; evitar prometer uma coleta que não ocorre ou coletar além do Aviso.

### 12. Política de dados sensíveis, crianças e documentos proibidos

O upload pede apenas que sejam enviados documentos autorizados. Não existe classificação, alerta ou bloqueio para documentos com dados sensíveis, menores ou dados excessivos.

**Ação:** criar política e UX de minimização; permitir sinalização de conteúdo sensível; restringir acesso; aplicar análise humana; definir bases do art. 11 e melhor interesse quando inevitável; incluir instruções de redação de dados não necessários.

### 13. Segurança de aplicação pode ser reforçada

A CSP permite `'unsafe-inline'` e `'unsafe-eval'`, o que reduz a proteção contra injeção de scripts. Não há evidência no repositório de SAST/DAST, gestão de vulnerabilidades, revisão periódica de acessos, criptografia de campos de maior risco ou testes de restauração.

**Ação:** endurecer CSP com nonce/hash; automatizar dependências e análise de código; executar pentest antes do uso real; revisar permissões administrativas; avaliar criptografia adicional para CPF, CNPJ e conteúdo de alto risco; testar backups e restauração.

## Pontos positivos encontrados

- isolamento de dados por conta com Row Level Security;
- buckets privados sem política de acesso direto;
- upload e download por URLs assinadas e temporárias;
- validação de extensão, MIME, assinatura binária, tamanho e checksum;
- autenticação multifator exigida em fluxos administrativos sensíveis;
- impersonação limitada a leitura, 30 minutos, motivo obrigatório e auditoria;
- entrega a FIDC com token, OTP, rate limit e sessão restrita;
- e-mails operacionais sem documentos ou valores financeiros no corpo;
- matching explicável e recomendação de IA sem aprovação automática;
- decisão humana para aprovação documental;
- relatórios temporários programados para expirar;
- headers de segurança, armazenamento de segredos no servidor e Vault para integração.

## Ordem prática recomendada

1. Impedir uploads reais enquanto o antivírus não estiver ativo.
2. Definir identidade legal, encarregado/canal e papéis controlador-operador-FIDC.
3. Aprovar RIPD, inventário de dados e tabela de retenção.
4. Fechar contratos/DPA e transferências internacionais dos fornecedores.
5. Implementar confirmação de distribuição, direitos dos titulares e resposta a incidentes.
6. Publicar os textos com links e registros de versão separados.
7. Executar reset de banco, testes de segurança e teste ponta a ponta desktop/celular antes do lançamento.

## Referências oficiais utilizadas

- [Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [ANPD — Guia dos Agentes de Tratamento e do Encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado)
- [ANPD — Atuação do Encarregado pelo Tratamento de Dados Pessoais](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-lanca-guia-sobre-atuacao-do-encarregado)
- [ANPD — Direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1)
- [ANPD — Comunicação de incidente de segurança](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis)
- [ANPD — Transferência internacional de dados](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados)
- [ANPD — Guia de Cookies e Proteção de Dados Pessoais](https://www.gov.br/anpd/pt-br/assuntos/noticias-periodo-eleitoral/anpd-lanca-guia-orientativo-201ccookies-e-protecao-de-dados-pessoais201d?exec=3ba4791)
- [ANPD — Relatório de Impacto à Proteção de Dados Pessoais](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd)
- [ANPD — Checklist de medidas de segurança](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/checklist-vf.pdf)

## Limitação desta análise

Este material é uma avaliação técnica e uma minuta de boas práticas, não substitui parecer jurídico. A versão final depende da realidade societária, dos contratos com FIDCs e fornecedores, da configuração de produção e das rotinas internas que não estão no repositório.
