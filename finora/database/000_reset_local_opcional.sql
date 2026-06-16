-- FINORA - RESET LOCAL OPCIONAL
-- ATENCAO: apaga tabelas e dados. Use somente se nao houver dados importantes.
BEGIN;
DROP TABLE IF EXISTS transacoes CASCADE;
DROP TABLE IF EXISTS metas CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP FUNCTION IF EXISTS atualizar_timestamp_modificacao() CASCADE;
COMMIT;
