# Urus FIDC

Protótipo navegável de uma plataforma SaaS que qualifica operações financeiras e encontra os FIDCs mais aderentes por meio de regras explicáveis.

## O que está incluído

- home institucional responsiva com proposta de valor, jornada e segurança;
- acesso demonstrativo como profissional ou administrador;
- isolamento visual de operações por profissional;
- cadastro de operações em quatro etapas;
- matching determinístico com 15 FIDCs pré-cadastrados;
- checklist documental e jornada completa de crédito;
- cadastro, edição, ativação e arquivamento de novos FIDCs;
- planos e assinaturas simulados.

Todos os dados são fictícios e mantidos apenas em memória. Não use informações ou documentos reais.

## Executar localmente

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Validar

```bash
npm run build
npm test
```

Esta versão não possui backend, banco de dados, autenticação real, uploads, IA externa, pagamentos ou integrações de calendário.
