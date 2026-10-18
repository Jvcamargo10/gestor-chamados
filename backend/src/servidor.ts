import { Pool } from 'pg';
import { criarApp } from './http/app';
import { RepositorioPostgres } from './repositorio/postgres';
import { Repositorio, RepositorioMemoria } from './repositorio/repositorio';

async function iniciar() {
  let repo: Repositorio;
  if (process.env.DATABASE_URL) {
    const pg = new RepositorioPostgres(new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined }));
    await pg.migrar();
    repo = pg;
  } else {
    console.warn('DATABASE_URL não definida: usando repositório em memória.');
    repo = new RepositorioMemoria();
  }

  const origens = (process.env.CORS_ORIGENS ?? 'http://localhost:5173').split(',');
  const porta = Number(process.env.PORT ?? 3001);
  criarApp(repo, () => new Date(), origens).listen(porta, () => console.log(`API de chamados em http://localhost:${porta}`));
}

iniciar().catch((e) => {
  console.error(e);
  process.exit(1);
});
