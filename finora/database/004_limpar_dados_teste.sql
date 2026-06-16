-- Remove apenas dados ficticios. As tabelas permanecem.
BEGIN;
DELETE FROM usuarios WHERE LOWER(email)=LOWER('teste@finora.app');
COMMIT;
