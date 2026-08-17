# Urus FIDC

SaaS multiusuário que qualifica operações financeiras e encontra os FIDCs mais aderentes por meio de regras explicáveis.

## O que está incluído

- home institucional responsiva com proposta de valor, jornada e segurança;
- modo demonstrativo separado em `/demo`, sem integrações ou persistência;
- cadastro real com Supabase Auth e uma conta isolada por profissional;
- cadastro de operações em quatro etapas;
- matching determinístico com 15 FIDCs pré-cadastrados;
- checklist documental versionado, upload privado e jornada completa de crédito;
- cadastro, edição, ativação e arquivamento de novos FIDCs;
- Stripe Checkout e assinaturas individuais por conta;
- administração global com MFA e impersonação auditada somente para leitura;
- relatórios PDF, Excel e ZIP temporários.

Os dados fictícios permanecem somente no modo demonstração. O ambiente real exige Supabase e integrações configuradas no servidor. A varredura antivírus ainda não está habilitada; consulte o aviso no painel administrativo antes de liberar uso comercial.

## Executar localmente

Requer Node.js 22 ou superior.

```bash
pnpm install
cp .env.example .env.local
pnpm db:start
pnpm db:reset
pnpm dev
```

Acesse `http://localhost:3000`.

## Validar

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Ambientes e segredos

- `localhost`: Supabase local e integrações de teste;
- preview da Vercel: somente `/demo`, sem segredos reais;
- produção da Vercel: único ambiente conectado ao Supabase real.

Copie apenas os nomes de variáveis de `.env.example`. Cadastre os valores novos diretamente nos painéis da Vercel e do Supabase. Nunca inclua chaves em commits, issues, logs ou mensagens.

As migrations estão em `supabase/migrations` e a configuração inicial dos 15 FIDCs e checklists em `supabase/seed.sql`. Nenhum usuário ou operação de demonstração é inserido no banco real.

## Desenvolvimento com assistentes de IA

O projeto inclui a skill oficial `frontend-design`, da Anthropic, para ajudar o Codex e o Claude Code a criar e revisar interfaces com uma direção visual mais intencional. Ela fica disponível automaticamente quando o pedido envolve criação ou reformulação visual.

Se quiser garantir o uso explícito da skill, comece o pedido assim:

- no Codex: `$frontend-design Melhore a tela de cadastro...`;
- no Claude Code: `/frontend-design Melhore a tela de cadastro...`.

As orientações compartilhadas dos assistentes ficam em `AGENTS.md`. O arquivo `CLAUDE.md` encaminha o Claude Code para as mesmas regras, evitando dois fluxos diferentes. Se a skill não aparecer em uma sessão que já estava aberta quando ela foi adicionada, reinicie o Codex ou o Claude Code.

A skill foi incorporada a partir de [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) e mantém sua licença Apache 2.0 no próprio diretório.

O backend usa rotas do Next.js, Supabase PostgreSQL/Auth/Storage, Stripe, Resend e OpenRouter. A integração de calendário e a emissão de nota fiscal permanecem fora desta versão.
