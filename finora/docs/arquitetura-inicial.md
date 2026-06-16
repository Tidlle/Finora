# Arquitetura do Finora

```text
Usuário
   ↓
Frontend: React 19 + Vite + TypeScript + Tailwind CSS
   ↓ HTTP/REST + JWT (Authorization: Bearer)
Backend: Java 21 + Spring Boot + Spring Security
   ↓ JPA / Hibernate
Banco: PostgreSQL / finora_db
```

## Entidades

| Entidade | Tabela |
|---|---|
| `Usuario` | `usuarios` |
| `Categoria` | `categorias` |
| `Transacao` | `transacoes` |
| `Meta` | `metas` |

## Enums

**TipoTransacao**
- `RECEITA`
- `DESPESA`

**StatusMeta**
- `EM_ANDAMENTO`
- `CONCLUIDA`

## Endpoints por módulo

### Autenticação (público)
```
POST /auth/cadastro
POST /auth/login
GET  /auth/me
```

### Usuário (autenticado)
```
GET /usuarios/perfil
PUT /usuarios/perfil
PUT /usuarios/senha
```

### Categorias (autenticado)
```
GET    /categorias
GET    /categorias?tipo=RECEITA|DESPESA
POST   /categorias
PUT    /categorias/{id}
DELETE /categorias/{id}
```

### Transações (autenticado)
```
GET    /transacoes
GET    /transacoes?mes=AAAA-MM&tipo=RECEITA|DESPESA&categoriaId={id}&busca={termo}
POST   /transacoes
PUT    /transacoes/{id}
DELETE /transacoes/{id}
```

### Dashboard (autenticado)
```
GET /dashboard/resumo
GET /dashboard/resumo?mes=AAAA-MM
```

### Metas (autenticado)
```
GET    /metas
GET    /metas?status=EM_ANDAMENTO|CONCLUIDA
POST   /metas
PUT    /metas/{id}
PATCH  /metas/{id}/progresso
DELETE /metas/{id}
```

### Status (público)
```
GET /status
```

## Segurança

- Autenticação via JWT (HS256, expiração 1h)
- Todas as rotas privadas exigem `Authorization: Bearer <token>`
- Dados isolados por usuário autenticado
- Senhas armazenadas com BCrypt

## Variáveis de ambiente necessárias

```
FINORA_DB_PASSWORD   → senha do usuário finora_app no PostgreSQL
FINORA_JWT_SECRET    → chave Base64 com mínimo 32 bytes
```
