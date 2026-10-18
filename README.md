# Gestor de Chamados

Service desk com prazo de atendimento (SLA) por prioridade, fluxo de status validado e um design system próprio
documentado no Storybook. API em Node.js + Express + TypeScript com PostgreSQL; front-end em React + Vite.

- **Demo:** https://jvcamargo10.github.io/gestor-chamados/ (os dados ficam só no seu navegador)
- **Design system (Storybook):** https://jvcamargo10.github.io/gestor-chamados/storybook/

## O que faz

- Abre chamados com categoria e prioridade; o prazo é calculado na hora (crítica 4h, alta 8h, média 24h, baixa 72h).
- Fila ordenada pelo prazo, com indicador de **vencendo** (último quarto do prazo) e **atrasado**.
- Fluxo de status com regras: só as transições permitidas aparecem; pedir informação ao solicitante exige dizer o quê;
  quem assume vira o responsável; chamado fechado não aceita comentários.
- Histórico completo de cada chamado.

## Um domínio, duas pontas

As regras de negócio ficam em [`backend/src/dominio/chamado.ts`](backend/src/dominio/chamado.ts), um arquivo
TypeScript sem dependências. A API usa esse arquivo, e o front-end importa o mesmo arquivo (alias `@dominio`):
a validação do formulário, os selos de SLA e o modo demonstração seguem exatamente as regras do servidor.

## Design system

Tokens (cores, tipografia, espaçamentos e raios, com tema escuro) em [`frontend/src/ui/tokens.css`](frontend/src/ui/tokens.css)
e componentes em [`frontend/src/ui`](frontend/src/ui): `Botao`, `Campo` (rótulo, ajuda e erro ligados por `aria-describedby`),
`Selo` e os selos de status, prioridade e SLA, `Cartao`, `Indicador` e `Vazio`. Os selos sempre têm texto: a cor nunca é a
única forma de informar o estado. Cada componente tem histórias no Storybook.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/chamados?status=&prioridade=&busca=` | Fila filtrada e ordenada |
| GET | `/api/chamados/:id` | Chamado com histórico |
| POST | `/api/chamados` | Abre um chamado |
| POST | `/api/chamados/:id/status` | `{ status, autor, comentario? }` |
| POST | `/api/chamados/:id/comentarios` | `{ autor, texto }` |
| GET | `/api/resumo` | Em aberto, vencendo, atrasados e resolvidos no prazo |

- Entrada validada com **Zod**; erros no formato **ProblemDetails** (400 entrada inválida, 404, 409 conflito, 422 regra de negócio).
- **PostgreSQL** com chamado e eventos gravados na mesma transação.
- **Concorrência otimista:** se duas pessoas alteram o mesmo chamado, a segunda recebe 409 em vez de sobrescrever.
- Sem `DATABASE_URL`, a API sobe com repositório em memória.

## Como rodar

```bash
docker compose up --build            # PostgreSQL + API em http://localhost:3001
cd frontend && npm install && npm run dev     # http://localhost:5173 (proxy /api → :3001)
npm run storybook                              # http://localhost:6006
```

Para publicar a API na AWS (App Runner + RDS PostgreSQL), veja [docs/deploy-aws.md](docs/deploy-aws.md).

## Testes

```bash
cd backend && npm test      # domínio, API (supertest) e repositório PostgreSQL*
cd frontend && npm test     # Jest + React Testing Library
```

\* Os testes do PostgreSQL rodam quando `DATABASE_URL_TESTE` está definida. No CI, o GitHub Actions sobe um PostgreSQL 17
como container de serviço.

## Stack

TypeScript · Node.js 22, Express 5, Zod, node-postgres, Docker · React 19, Vite, React Router, Storybook ·
Jest, Supertest, React Testing Library · GitHub Actions

---
Projeto de portfólio de [João Camargo](https://jvcamargo10.github.io/portfolio/). Chamados e pessoas da demo são fictícios.
