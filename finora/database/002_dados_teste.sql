-- ============================================================
-- FINORA - MVP | Script 002: dados ficticios para teste local
-- senha_hash e apenas temporaria; login real sera gerado pelo backend.
-- ============================================================
BEGIN;
INSERT INTO usuarios (nome, email, senha_hash)
SELECT 'Eduardo Teste', 'teste@finora.app', 'HASH_TEMPORARIO_APENAS_TESTE_SQL'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE LOWER(email)=LOWER('teste@finora.app'));

INSERT INTO categorias (nome, tipo, padrao, usuario_id)
SELECT c.nome, 'DESPESA', TRUE, u.id
FROM usuarios u CROSS JOIN (VALUES ('Alimentação'),('Transporte'),('Moradia'),('Educação'),('Saúde'),('Lazer'),('Assinaturas'),('Outros')) c(nome)
WHERE LOWER(u.email)=LOWER('teste@finora.app')
ON CONFLICT (usuario_id, nome, tipo) DO NOTHING;

INSERT INTO categorias (nome, tipo, padrao, usuario_id)
SELECT c.nome, 'RECEITA', TRUE, u.id
FROM usuarios u CROSS JOIN (VALUES ('Salário'),('Freelance'),('Investimentos'),('Presente'),('Outros')) c(nome)
WHERE LOWER(u.email)=LOWER('teste@finora.app')
ON CONFLICT (usuario_id, nome, tipo) DO NOTHING;

INSERT INTO transacoes (descricao, valor, tipo, data_transacao, observacao, categoria_id, usuario_id)
SELECT d.descricao, d.valor, d.tipo, d.data_transacao, d.observacao, c.id, u.id
FROM usuarios u
CROSS JOIN (VALUES
 ('Salário mensal',5000.00::NUMERIC,'RECEITA',DATE '2026-05-01','Pagamento mensal','Salário'),
 ('Freelance Design',850.00::NUMERIC,'RECEITA',DATE '2026-05-10','Projeto concluído','Freelance'),
 ('Aluguel',950.00::NUMERIC,'DESPESA',DATE '2026-05-05','Moradia mensal','Moradia'),
 ('Supermercado',320.50::NUMERIC,'DESPESA',DATE '2026-05-15','Compra mensal','Alimentação'),
 ('Cinema',210.00::NUMERIC,'DESPESA',DATE '2026-05-20','Lazer','Lazer'),
 ('Uber',48.90::NUMERIC,'DESPESA',DATE '2026-05-22','Transporte','Transporte'),
 ('Netflix',39.90::NUMERIC,'DESPESA',DATE '2026-05-23','Assinatura mensal','Assinaturas')
) d(descricao, valor, tipo, data_transacao, observacao, categoria_nome)
JOIN categorias c ON c.usuario_id=u.id AND c.nome=d.categoria_nome AND c.tipo=d.tipo
WHERE LOWER(u.email)=LOWER('teste@finora.app')
AND NOT EXISTS (SELECT 1 FROM transacoes t WHERE t.usuario_id=u.id AND t.descricao=d.descricao AND t.valor=d.valor AND t.tipo=d.tipo AND t.data_transacao=d.data_transacao);

INSERT INTO metas (nome, descricao, valor_objetivo, valor_acumulado, prazo, status, usuario_id)
SELECT d.nome,d.descricao,d.objetivo,d.acumulado,d.prazo,'EM_ANDAMENTO',u.id
FROM usuarios u CROSS JOIN (VALUES
 ('Comprar notebook','Notebook para estudos e projetos',5000.00::NUMERIC,1500.00::NUMERIC,DATE '2026-12-20'),
 ('Reserva de emergência','Segurança para imprevistos',10000.00::NUMERIC,4200.00::NUMERIC,DATE '2027-06-30'),
 ('Viagem de férias','Viagem planejada',3500.00::NUMERIC,850.00::NUMERIC,DATE '2027-01-15')
) d(nome,descricao,objetivo,acumulado,prazo)
WHERE LOWER(u.email)=LOWER('teste@finora.app')
AND NOT EXISTS (SELECT 1 FROM metas m WHERE m.usuario_id=u.id AND m.nome=d.nome);
COMMIT;
