# garage-auth-service

Microsserviço responsável pela autenticação e gerenciamento de identidade da plataforma SOAT. Emite tokens JWT RS256 para clientes e usuários internos (admin, mecânicos, atendentes, almoxarifes) e expõe o JWKS público para validação distribuída dos tokens pelos demais serviços.

## Responsabilidades

- Autenticação de clientes via CPF/CNPJ
- Autenticação de usuários internos (admin, mechanic, clerk, stock_keeper) via email e senha
- Emissão de tokens JWT assinados com RSA-256 (RS256)
- Exposição do JWKS endpoint para validação stateless pelos outros microsserviços
- Gerenciamento de usuários internos (CRUD)

## Stack

- **Runtime**: Node.js 24
- **Linguagem**: TypeScript (ESM)
- **Framework**: Express 5
- **ORM**: Prisma 7 + PostgreSQL 16
- **Autenticação**: jsonwebtoken (RS256), bcrypt
- **Testes**: Vitest + @vitest/coverage-v8
- **Observabilidade**: Datadog (dd-trace, logs JSON, métricas StatsD)

## Banco de dados

PostgreSQL com as seguintes entidades:

| Entidade | Descrição |
|---|---|
| `User` | Usuário interno com role (`ADMIN`, `MECHANIC`, `CLERK`, `STOCK_KEEPER`), email e senha hash |
| `CustomerCredentials` | Credenciais de acesso do cliente, sincronizadas a partir de eventos do OS Service |

## Endpoints

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Login de cliente (CPF/CNPJ) — retorna JWT |
| `POST` | `/auth/admin/login` | Login de usuário interno (email + senha) — retorna JWT |

### JWKS
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/.well-known/jwks.json` | Chave pública RSA para validação dos tokens |
| `GET` | `/.well-known/openid-configuration` | Discovery document OpenID Connect |

### Usuários internos (requer role ADMIN)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/users` | Criar usuário |
| `GET` | `/users` | Listar usuários |
| `PUT` | `/users/:id` | Atualizar usuário |
| `DELETE` | `/users/:id` | Remover usuário |

### Credenciais de clientes (requer role ADMIN)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/customer-credentials` | Listar credenciais de clientes |

### Health
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |

## Validação de tokens nos outros serviços

Os demais microsserviços validam o JWT recebendo a chave pública via `/.well-known/jwks.json`. Isso elimina a necessidade de chamadas síncronas ao auth-service no caminho crítico das requisições.

```
Cliente               Qualquer Serviço           Auth Service
   |                        |                         |
   |-- POST /auth/login ---> |                         |
   |                         |-- (na inicialização) -- |
   |                         |<-- JWKS (pub key) ----- |
   |<-- JWT ---------------- |                         |
   |                         |                         |
   |-- GET /recurso + JWT -> |                         |
   |                         | (valida JWT localmente) |
   |<-- 200 OK ------------- |                         |
```

## Como rodar

### Pré-requisitos

- Node.js 24
- Docker e Docker Compose
- Par de chaves RSA (veja abaixo)

### Gerar par de chaves RSA

```bash
node scripts/generate-rsa-keys.mjs
```

Ou manualmente:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

Coloque o conteúdo das chaves em uma linha com `\n` entre os breaks e configure nas variáveis `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY`.

### Subir dependências

```bash
cp .env.example .env
# Configure DATABASE_URL e as chaves RSA

docker compose up -d
```

### Iniciar o serviço

```bash
npm install
npm run dev
```

O serviço sobe na porta `8083` por padrão.

### Popular dados iniciais

O seed cria um usuário admin padrão:

```bash
npm run seed
```

## Testes

```bash
npm test
npm run test:coverage
```

Cobertura mínima configurada: **90%** em linhas, funções e branches.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta HTTP (padrão: `8083`) |
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_PRIVATE_KEY` | Chave privada RSA para assinar tokens (formato PEM, `\n` como quebra de linha) |
| `JWT_PUBLIC_KEY` | Chave pública RSA para validação (formato PEM, `\n` como quebra de linha) |
| `JWT_EXPIRES_IN` | Tempo de expiração do token (ex: `8h`) |
| `API_GATEWAY_ISSUER_URL` | URL base do serviço (usada como `iss` no JWT e no discovery document) |
| `DD_TRACE_ENABLED` | Habilita tracing do Datadog |
| `DD_SERVICE` | Nome do serviço no Datadog |

## Roles disponíveis

| Role | Descrição |
|---|---|
| `ADMIN` | Acesso total a todos os serviços |
| `MECHANIC` | Acesso à execução de OS |
| `CLERK` | Acesso a atendimento e consultas |
| `STOCK_KEEPER` | Acesso ao gerenciamento de estoque |

## CI/CD

Três pipelines independentes rodam a cada pull request para `main`:

| Pipeline | Descrição |
|---|---|
| `ci.yml` | Build, lint, testes e relatório de cobertura no PR |
| `lint.yml` | ESLint via reviewdog com anotações no diff |
| `quality.yml` | Detecção de duplicação (jscpd) e análise de code smells (sonarjs, security) |
