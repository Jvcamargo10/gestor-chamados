# Publicar a API na AWS

Guia para colocar a API e o banco na AWS com serviços gerenciados. A demo do GitHub Pages não depende disso.

## Arquitetura

```
Navegador ──► CloudFront/S3 (front-end estático)
          └─► App Runner (container da API, porta 8080) ──► RDS PostgreSQL (rede privada)
```

- **App Runner** roda o container de `backend/Dockerfile`, com HTTPS, escala automática e health check em `/api/saude`.
- **RDS PostgreSQL** guarda os dados. As tabelas são criadas pela própria API na inicialização (`RepositorioPostgres.migrar`).
- **Secrets Manager** guarda a `DATABASE_URL`, que o App Runner injeta como variável de ambiente.

## Passo a passo (AWS CLI)

```bash
# 1. Imagem no ECR
aws ecr create-repository --repository-name gestor-chamados-api
aws ecr get-login-password | docker login --username AWS --password-stdin <conta>.dkr.ecr.<regiao>.amazonaws.com
docker build -t <conta>.dkr.ecr.<regiao>.amazonaws.com/gestor-chamados-api:1 backend
docker push <conta>.dkr.ecr.<regiao>.amazonaws.com/gestor-chamados-api:1

# 2. Banco (classe pequena, sem acesso público)
aws rds create-db-instance --db-instance-identifier gestor-chamados \
  --engine postgres --db-instance-class db.t4g.micro --allocated-storage 20 \
  --master-username chamados --manage-master-user-password --no-publicly-accessible

# 3. Segredo com a string de conexão
aws secretsmanager create-secret --name gestor-chamados/database-url \
  --secret-string "postgres://chamados:<senha>@<endpoint-rds>:5432/postgres"

# 4. Serviço no App Runner, ligado à VPC do RDS por um VPC connector
#    Variáveis: DATABASE_URL (do segredo), PGSSL=true, CORS_ORIGENS=https://<seu-front>
```

## Variáveis de ambiente da API

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL. Sem ela, a API usa um repositório em memória. |
| `PGSSL` | `true` para conectar ao RDS com TLS. |
| `CORS_ORIGENS` | Origens do front-end, separadas por vírgula. |
| `PORT` | Porta HTTP (8080 no container). |
