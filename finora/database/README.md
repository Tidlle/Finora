# Scripts PostgreSQL — Finora

## Ordem de execução em um banco vazio

1. `001_criacao_tabelas.sql`
2. `002_dados_teste.sql`
3. `003_consultas_teste.sql`

## Scripts auxiliares

- `000_reset_local_opcional.sql`: apaga tabelas e dados; use apenas localmente e sem dados importantes.
- `004_limpar_dados_teste.sql`: remove somente o usuário de demonstração e seus dados relacionados.

## Ambiente esperado

- Banco: `finora_db`
- Usuário de conexão: `finora_app`

Nenhum script contém senha do banco.
