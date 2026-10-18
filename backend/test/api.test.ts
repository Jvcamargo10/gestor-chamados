import request from 'supertest';
import { criarApp } from '../src/http/app';
import { RepositorioMemoria } from '../src/repositorio/repositorio';

const novo = {
  titulo: 'Impressora do 2º andar parada',
  descricao: 'Mostra erro de papel atolado mesmo vazia.',
  categoria: 'Equipamento',
  prioridade: 'media',
  solicitante: 'Paulo Reis',
};

describe('API de chamados', () => {
  let relogio = new Date('2026-10-19T09:00:00Z');
  const app = criarApp(new RepositorioMemoria(), () => relogio);

  it('abre, atende, comenta e resolve um chamado', async () => {
    const criado = await request(app).post('/api/chamados').send(novo).expect(201);
    const id = criado.body.id;
    expect(criado.headers.location).toBe(`/api/chamados/${id}`);

    await request(app).post(`/api/chamados/${id}/status`).send({ status: 'em_atendimento', autor: 'João' }).expect(200);
    await request(app).post(`/api/chamados/${id}/comentarios`).send({ autor: 'João', texto: 'Troquei o rolo.' }).expect(201);
    const resolvido = await request(app)
      .post(`/api/chamados/${id}/status`)
      .send({ status: 'resolvido', autor: 'João', comentario: 'Funcionando' })
      .expect(200);

    expect(resolvido.body.responsavel).toBe('João');
    expect(resolvido.body.historico.map((e: { tipo: string }) => e.tipo)).toEqual(['criado', 'status', 'comentario', 'status']);
  });

  it('responde com ProblemDetails para entrada inválida, regra violada e chamado inexistente', async () => {
    const invalido = await request(app).post('/api/chamados').send({ ...novo, prioridade: 'urgentissima' }).expect(400);
    expect(invalido.body.detail).toContain('prioridade');

    const { body } = await request(app).post('/api/chamados').send(novo).expect(201);
    const regra = await request(app).post(`/api/chamados/${body.id}/status`).send({ status: 'fechado', autor: '' }).expect(422);
    expect(regra.body.detail).toBe('Informe quem está alterando o chamado.');

    await request(app).get('/api/chamados/999').expect(404);
  });

  it('filtra, ordena pelo prazo e resume o SLA', async () => {
    relogio = new Date('2026-10-19T09:00:00Z');
    await request(app).post('/api/chamados').send({ ...novo, titulo: 'Servidor de arquivos fora do ar', prioridade: 'critica' }).expect(201);

    const criticos = await request(app).get('/api/chamados').query({ prioridade: 'critica' }).expect(200);
    expect(criticos.body).toHaveLength(1);
    const todos = await request(app).get('/api/chamados').expect(200);
    expect(todos.body[0].prioridade).toBe('critica');

    relogio = new Date('2026-10-19T14:00:00Z');
    const resumo = await request(app).get('/api/resumo').expect(200);
    expect(resumo.body.atrasados).toBe(1);
  });
});
