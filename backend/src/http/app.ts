import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  CATEGORIAS, PRIORIDADES, RegraVioladaError, STATUS, comentar, filtrar, mudarStatus, ordenar, resumir,
} from '../dominio/chamado';
import { ConflitoError, Repositorio } from '../repositorio/repositorio';

const esquemaNovo = z.object({
  titulo: z.string(),
  descricao: z.string(),
  categoria: z.enum(CATEGORIAS),
  prioridade: z.enum(PRIORIDADES),
  solicitante: z.string(),
});

const esquemaStatus = z.object({ status: z.enum(STATUS), autor: z.string(), comentario: z.string().optional() });
const esquemaComentario = z.object({ autor: z.string(), texto: z.string() });
const esquemaFiltro = z.object({
  status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  busca: z.string().optional(),
});

class NaoEncontradoError extends Error {}

/** Monta a API. O relógio é injetado para os testes controlarem o SLA. */
export function criarApp(repo: Repositorio, agora: () => Date = () => new Date(), origens: string[] = ['http://localhost:5173']) {
  const app = express();
  app.use(cors({ origin: origens }));
  app.use(express.json({ limit: '100kb' }));

  const carregar = async (id: string) => {
    const c = await repo.obter(Number(id));
    if (!c) throw new NaoEncontradoError(`Chamado ${id} não encontrado.`);
    return c;
  };

  app.get('/api/saude', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/chamados', async (req, res) => {
    const filtro = esquemaFiltro.parse(req.query);
    res.json(ordenar(filtrar(await repo.listar(), filtro)));
  });

  app.get('/api/resumo', async (_req, res) => {
    res.json(resumir(await repo.listar(), agora()));
  });

  app.get('/api/chamados/:id', async (req, res) => {
    res.json(await carregar(req.params.id));
  });

  app.post('/api/chamados', async (req, res) => {
    const chamado = await repo.criar(esquemaNovo.parse(req.body), agora());
    res.status(201).location(`/api/chamados/${chamado.id}`).json(chamado);
  });

  app.post('/api/chamados/:id/status', async (req, res) => {
    const corpo = esquemaStatus.parse(req.body);
    const anterior = await carregar(req.params.id);
    const atual = mudarStatus(anterior, corpo.status, corpo.autor, agora(), corpo.comentario);
    await repo.salvar(atual, anterior);
    res.json(atual);
  });

  app.post('/api/chamados/:id/comentarios', async (req, res) => {
    const corpo = esquemaComentario.parse(req.body);
    const anterior = await carregar(req.params.id);
    const atual = comentar(anterior, corpo.autor, corpo.texto, agora());
    await repo.salvar(atual, anterior);
    res.status(201).json(atual);
  });

  // Erros viram ProblemDetails (RFC 9457), o mesmo formato das APIs .NET dos outros projetos.
  app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const problema = (status: number, detail: string) => res.status(status).json({ status, title: tituloDe(status), detail });
    if (erro instanceof z.ZodError) return problema(400, erro.issues.map((i) => `${i.path.join('.') || 'corpo'}: ${i.message}`).join(' '));
    if (erro instanceof RegraVioladaError) return problema(422, erro.message);
    if (erro instanceof NaoEncontradoError) return problema(404, erro.message);
    if (erro instanceof ConflitoError) return problema(409, erro.message);
    console.error(erro);
    return problema(500, 'Erro inesperado.');
  });

  return app;
}

function tituloDe(status: number): string {
  return { 400: 'Requisição inválida', 404: 'Não encontrado', 409: 'Conflito', 422: 'Regra de negócio violada' }[status] ?? 'Erro';
}
