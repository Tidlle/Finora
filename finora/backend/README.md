# Finora — Gestor Financeiro Pessoal

O **Finora** é uma aplicação web full-stack de gestão financeira pessoal com autenticação JWT, API REST em Java Spring Boot, interface React + TypeScript e banco de dados PostgreSQL.

---

## Funcionalidades

### Autenticação

- Cadastro de usuários.
- Login com autenticação via JWT.
- Proteção de rotas privadas.
- Persistência do token no navegador.
- Logout.
- Consulta de perfil autenticado.

### Perfil do usuário

- Visualização dos dados do usuário.
- Atualização de nome e e-mail.
- Alteração de senha com validação da senha atual.
- Dados isolados por usuário autenticado.

### Categorias

- Listagem de categorias do usuário.
- Categorias padrão criadas automaticamente no cadastro (ver lista abaixo).
- Criação, edição e exclusão de categorias personalizadas.
- Categorias padrão não podem ser editadas nem excluídas.
- Categoria em uso por alguma transação não pode ser excluída.
- Tipo da categoria: `RECEITA` ou `DESPESA`.

### Transações

- Cadastro de receitas e despesas.
- Listagem com filtros por tipo, categoria, mês e busca por descrição.
- Edição e exclusão de transações.
- A categoria usada deve ser do mesmo tipo que a transação.

### Dashboard

- Resumo financeiro do mês: receitas, despesas e saldo.
- Últimas transações.
- Gastos por categoria.
- Maior categoria de gasto.
- Evolução mensal de receitas e despesas.

### Metas financeiras

- Criação, listagem, edição e exclusão de metas.
- Atualização de progresso com cálculo automático de percentual e valor restante.
- Meta concluída automaticamente quando o valor acumulado atinge ou supera o objetivo.

---

## Tecnologias

### Front-end

- React 19, TypeScript, Vite, Tailwind CSS
- Fetch API, LocalStorage para persistência do token JWT

### Back-end

- Java 21, Spring Boot, Spring Web, Spring Data JPA
- Spring Security, OAuth2 Resource Server, JWT
- Bean Validation, Maven

### Banco de dados

- PostgreSQL, pgAdmin

---

## Arquitetura do projeto

```text
finora/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/br/com/finora/api/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── entity/
│   │   │   │   ├── enums/
│   │   │   │   ├── exception/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   └── FinoraApiApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── application.properties.example
│   │   └── test/
│   ├── pom.xml
│   └── mvnw.cmd
│
├── frontend/
│   └── client/
│       ├── src/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── pages/
│       │   ├── services/
│       │   └── main.tsx
│       ├── .env               ← não versionado
│       ├── .env.example       ← versionado (modelo)
│       ├── package.json
│       └── vite.config.ts
│
├── database/
│   ├── 000_reset_local_opcional.sql
│   ├── 001_criacao_tabelas.sql
│   ├── 002_dados_teste.sql
│   ├── 003_consultas_teste.sql
│   └── 004_limpar_dados_teste.sql
│
└── README.md
```

---

## Estrutura do back-end

```text
br.com.finora.api
├── config
│   ├── CorsConfig.java
│   ├── CriptografiaConfig.java
│   └── SegurancaConfig.java
│
├── controller
│   ├── AuthController.java
│   ├── CategoriaController.java
│   ├── DashboardController.java
│   ├── MetaController.java
│   ├── StatusController.java
│   ├── TransacaoController.java
│   └── UsuarioController.java
│
├── dto
│   ├── DTOs de autenticação
│   ├── DTOs de categorias
│   ├── DTOs de transações
│   ├── DTOs de dashboard
│   ├── DTOs de metas
│   └── DTOs de usuário
│
├── entity
│   ├── Usuario.java
│   ├── Categoria.java
│   ├── Transacao.java
│   └── Meta.java
│
├── enums
│   ├── TipoTransacao.java    (RECEITA, DESPESA)
│   └── StatusMeta.java       (EM_ANDAMENTO, CONCLUIDA)
│
├── exception
├── repository
├── service
└── FinoraApiApplication.java
```

---

## Modelo de dados

### Usuario

| Campo | Descrição |
|---|---|
| `id` | Identificador único |
| `nome` | Nome do usuário |
| `email` | E-mail único |
| `senhaHash` | Senha criptografada com BCrypt |
| `criadoEm` | Data de criação |
| `atualizadoEm` | Data de atualização |

### Categoria

| Campo | Descrição |
|---|---|
| `id` | Identificador único |
| `nome` | Nome da categoria |
| `tipo` | `RECEITA` ou `DESPESA` |
| `padrao` | Se é categoria padrão do sistema |
| `usuario` | Usuário dono da categoria |

### Transacao

| Campo | Descrição |
|---|---|
| `id` | Identificador único |
| `descricao` | Descrição da movimentação |
| `valor` | Valor (maior que zero) |
| `tipo` | `RECEITA` ou `DESPESA` |
| `dataTransacao` | Data da movimentação |
| `observacao` | Campo livre opcional |
| `categoria` | Categoria associada |
| `usuario` | Usuário dono da transação |

### Meta

| Campo | Descrição |
|---|---|
| `id` | Identificador único |
| `nome` | Nome da meta |
| `descricao` | Descrição opcional |
| `valorObjetivo` | Valor alvo (maior que zero) |
| `valorAcumulado` | Progresso atual |
| `prazo` | Data limite |
| `status` | `EM_ANDAMENTO` ou `CONCLUIDA` |
| `usuario` | Usuário dono da meta |

---

## Categorias padrão

Ao cadastrar um novo usuário, as seguintes categorias são criadas automaticamente:

**Despesas**

| Categoria |
|---|
| Alimentação |
| Transporte |
| Moradia |
| Educação |
| Saúde |
| Lazer |
| Assinaturas |
| Outros |

**Receitas**

| Categoria |
|---|
| Salário |
| Freelance |
| Investimentos |
| Presente |
| Outros |

---

## Pré-requisitos

- Java 21
- Node.js 18+ e npm
- PostgreSQL 15+
- pgAdmin (opcional — qualquer cliente PostgreSQL serve)
- Git

---

## Configuração do banco de dados

No pgAdmin ou psql, crie o usuário e o banco:

```sql
CREATE ROLE finora_app WITH LOGIN PASSWORD 'sua_senha_aqui';

CREATE DATABASE finora_db
  WITH OWNER = finora_app
  ENCODING = 'UTF8';

GRANT ALL PRIVILEGES ON DATABASE finora_db TO finora_app;
```

Em seguida, conecte-se ao banco `finora_db` e execute os scripts da pasta `database/` nesta ordem:

```
001_criacao_tabelas.sql
002_dados_teste.sql      ← opcional, apenas para desenvolvimento
```

O script `000_reset_local_opcional.sql` apaga todas as tabelas — use apenas em ambiente local.
O script `004_limpar_dados_teste.sql` remove apenas os dados de teste sem apagar as tabelas.

---

## Variáveis de ambiente

### Back-end

O back-end lê dados sensíveis via variáveis de ambiente. Nunca coloque credenciais diretamente no `application.properties`.

```powershell
$env:FINORA_DB_PASSWORD="senha_do_usuario_finora_app"
$env:FINORA_JWT_SECRET="chave_base64_com_no_minimo_32_bytes"
```

Para gerar uma chave JWT segura no PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

O arquivo `backend/src/main/resources/application.properties.example` serve como modelo da configuração esperada.

### Front-end

Na pasta `frontend/client`, crie o arquivo `.env` com base no modelo:

```powershell
copy frontend\client\.env.example frontend\client\.env
```

Conteúdo padrão para desenvolvimento local:

```env
VITE_API_URL=http://localhost:8080
```

---

## Configuração do `application.properties`

```properties
spring.application.name=finora-api

spring.datasource.url=jdbc:postgresql://localhost:5432/finora_db
spring.datasource.username=finora_app
spring.datasource.password=${FINORA_DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.open-in-view=false

finora.jwt.secret=${FINORA_JWT_SECRET}
finora.jwt.issuer=finora-api
finora.jwt.expiracao-segundos=3600

server.port=8080

server.error.include-stacktrace=never
server.error.include-message=never
```

---

## Ordem de inicialização

Para a aplicação funcionar corretamente, siga esta ordem:

1. PostgreSQL em execução com o banco `finora_db` criado
2. Back-end Spring Boot rodando em `localhost:8080`
3. Front-end React rodando em `localhost:5173`

---

## Executando o back-end

```powershell
cd backend

$env:FINORA_DB_PASSWORD="sua_senha"
$env:FINORA_JWT_SECRET="sua_chave_base64"

.\mvnw.cmd spring-boot:run
```

A API ficará disponível em `http://localhost:8080`.

Para verificar se está funcionando:

```http
GET http://localhost:8080/status
```

Resposta esperada:

```json
{
  "aplicacao": "Finora API",
  "status": "funcionando"
}
```

---

## Executando o front-end

```powershell
cd frontend\client

npm install
npm run dev
```

A interface ficará disponível em `http://localhost:5173`.

---

## Build para produção

### Back-end

```powershell
cd backend
.\mvnw.cmd clean package -DskipTests
java -jar target\finora-api-0.0.1-SNAPSHOT.jar
```

### Front-end

```powershell
cd frontend\client
npm run build
npm run preview
```

O preview roda em `http://localhost:4173`.

---

## Configuração de CORS

O back-end aceita chamadas dos seguintes endereços:

```
http://localhost:5173
http://localhost:4173
http://127.0.0.1:5173
http://127.0.0.1:4173
```

Configuração em `backend/src/main/java/br/com/finora/api/config/CorsConfig.java`.

Para deploy em produção, adicione a URL pública do front-end nessa lista.

---

## Endpoints principais

### Status

```http
GET /status
```

### Autenticação

```http
POST /auth/cadastro
POST /auth/login
GET  /auth/me
```

### Usuário

```http
GET /usuarios/perfil
PUT /usuarios/perfil
PUT /usuarios/senha
```

### Categorias

```http
GET    /categorias
GET    /categorias?tipo=RECEITA
GET    /categorias?tipo=DESPESA
POST   /categorias
PUT    /categorias/{id}
DELETE /categorias/{id}
```

### Transações

```http
GET    /transacoes
GET    /transacoes?mes=2026-06
GET    /transacoes?tipo=DESPESA
GET    /transacoes?categoriaId=1
GET    /transacoes?busca=mercado
POST   /transacoes
PUT    /transacoes/{id}
DELETE /transacoes/{id}
```

### Dashboard

```http
GET /dashboard/resumo
GET /dashboard/resumo?mes=2026-06
```

### Metas

```http
GET    /metas
GET    /metas?status=EM_ANDAMENTO
GET    /metas?status=CONCLUIDA
POST   /metas
PUT    /metas/{id}
PATCH  /metas/{id}/progresso
DELETE /metas/{id}
```

---

## Exemplos de requisições

### Cadastro

```http
POST /auth/cadastro
Content-Type: application/json

{
  "nome": "Maria Silva",
  "email": "maria@exemplo.com",
  "senha": "SuaSenhaAqui"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "maria@exemplo.com",
  "senha": "SuaSenhaAqui"
}
```

Resposta:

```json
{
  "id": 1,
  "nome": "Maria Silva",
  "email": "maria@exemplo.com",
  "token": "eyJ...",
  "tipoToken": "Bearer",
  "expiraEmSegundos": 3600,
  "mensagem": "Login realizado com sucesso."
}
```

### Criar transação

```http
POST /transacoes
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "descricao": "Mercado",
  "valor": 250.00,
  "tipo": "DESPESA",
  "dataTransacao": "2026-06-10",
  "observacao": "Compra mensal",
  "categoriaId": 1
}
```

### Criar meta

```http
POST /metas
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "nome": "Reserva de emergência",
  "descricao": "Guardar dinheiro para imprevistos",
  "valorObjetivo": 5000.00,
  "prazo": "2026-12-31"
}
```

### Atualizar progresso da meta

```http
PATCH /metas/1/progresso
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "valorAcumulado": 1500.00
}
```

---

## Regras de negócio

### Usuário

- Cada usuário acessa apenas seus próprios dados.
- E-mails são únicos na base.
- Senhas são armazenadas com hash BCrypt.
- O token JWT é obrigatório para todas as rotas privadas.

### Categorias

- Todo usuário recebe categorias padrão ao se cadastrar.
- Categorias padrão não podem ser editadas ou excluídas.
- Uma categoria em uso por alguma transação não pode ser excluída.
- A categoria deve ser do mesmo tipo que a transação que a usa.

### Transações

- O valor deve ser maior que zero.
- A categoria deve pertencer ao usuário autenticado.
- O tipo da categoria deve corresponder ao tipo da transação.

### Metas

- O valor objetivo deve ser maior que zero.
- O valor acumulado não pode ser negativo.
- A meta muda para `CONCLUIDA` automaticamente quando o valor acumulado atinge ou supera o objetivo.

---

## Segurança

- Autenticação baseada em JWT com expiração de 1 hora.
- Senhas criptografadas com BCrypt.
- Rotas protegidas com Spring Security.
- Dados separados por usuário autenticado.
- Variáveis de ambiente para informações sensíveis.
- Nenhuma credencial no código-fonte.

---

## Troubleshooting

### Erro ao iniciar o back-end: `Could not open JPA EntityManager`

Causa: banco de dados não está rodando ou as credenciais estão erradas.

Solução: verifique se o PostgreSQL está ativo, se o banco `finora_db` existe e se `FINORA_DB_PASSWORD` está definida corretamente.

### Erro ao iniciar o back-end: `JWT secret is required`

Causa: variável `FINORA_JWT_SECRET` não definida.

Solução: defina a variável antes de executar o back-end:

```powershell
$env:FINORA_JWT_SECRET="sua_chave_base64"
```

### Erro `Failed to fetch` no front-end

Causa: o back-end não está rodando ou a URL da API está incorreta.

Solução: confirme que o back-end está em `localhost:8080` e que `VITE_API_URL` no arquivo `.env` aponta para ele.

### Erro de CORS no navegador

Causa: o front-end está acessando a API de uma origem não permitida.

Solução: verifique se a porta do front-end (`5173` em dev ou `4173` no preview) está na lista de origens permitidas em `CorsConfig.java`.

### `mvnw.cmd` não reconhecido

Causa: o Maven Wrapper precisa ser executado dentro da pasta `backend/`.

Solução:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

---

## Status do projeto

Funcional em ambiente local com integração completa entre front-end, back-end e PostgreSQL.

| Funcionalidade | Status |
|---|---|
| Autenticação (cadastro, login, JWT) | Concluído |
| Perfil do usuário | Concluído |
| Categorias | Concluído |
| Transações | Concluído |
| Dashboard | Concluído |
| Metas financeiras | Concluído |
| Integração front + back + banco | Concluído |
| Build de produção | Concluído |

---

## Melhorias futuras

- Documentação da API com Swagger/OpenAPI.
- Testes automatizados de service e controller.
- Docker Compose para PostgreSQL e back-end.
- Deploy do back-end (Render, Railway) e front-end (Vercel).
- Recuperação de senha por e-mail.
- Relatórios financeiros em PDF e CSV.
- Importação de extratos bancários.
- Planejamento mensal com orçamento por categoria.
- Transações recorrentes.
- Notificações de metas e alertas de gastos.
- Refresh token e expiração silenciosa de sessão.

---

## Autor

Projeto desenvolvido por Eduardo Martins.
