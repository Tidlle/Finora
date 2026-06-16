-- FINORA - MVP | Script 003: validacao de dados e dashboard
SELECT current_database() AS banco, current_user AS usuario_conectado;
SELECT id,nome,email,criado_em FROM usuarios WHERE LOWER(email)=LOWER('teste@finora.app');
SELECT c.id,c.nome,c.tipo,c.padrao FROM categorias c JOIN usuarios u ON u.id=c.usuario_id
WHERE LOWER(u.email)=LOWER('teste@finora.app') ORDER BY c.tipo,c.nome;
SELECT t.data_transacao,t.descricao,c.nome AS categoria,t.tipo,t.valor
FROM transacoes t JOIN categorias c ON c.id=t.categoria_id JOIN usuarios u ON u.id=t.usuario_id
WHERE LOWER(u.email)=LOWER('teste@finora.app') ORDER BY t.data_transacao DESC,t.id DESC;

-- Resultado esperado: receitas 5850.00, despesas 1569.30, saldo 4280.70
SELECT
 COALESCE(SUM(t.valor) FILTER (WHERE t.tipo='RECEITA'),0) AS total_receitas,
 COALESCE(SUM(t.valor) FILTER (WHERE t.tipo='DESPESA'),0) AS total_despesas,
 COALESCE(SUM(t.valor) FILTER (WHERE t.tipo='RECEITA'),0)-COALESCE(SUM(t.valor) FILTER (WHERE t.tipo='DESPESA'),0) AS saldo
FROM transacoes t JOIN usuarios u ON u.id=t.usuario_id
WHERE LOWER(u.email)=LOWER('teste@finora.app') AND t.data_transacao>=DATE '2026-05-01' AND t.data_transacao<DATE '2026-06-01';

SELECT c.nome AS categoria,SUM(t.valor) AS total_gasto,
 ROUND((SUM(t.valor)/SUM(SUM(t.valor)) OVER())*100,2) AS percentual
FROM transacoes t JOIN categorias c ON c.id=t.categoria_id JOIN usuarios u ON u.id=t.usuario_id
WHERE LOWER(u.email)=LOWER('teste@finora.app') AND t.tipo='DESPESA'
 AND t.data_transacao>=DATE '2026-05-01' AND t.data_transacao<DATE '2026-06-01'
GROUP BY c.nome ORDER BY total_gasto DESC;

SELECT m.nome,m.valor_acumulado,m.valor_objetivo,
 ROUND((m.valor_acumulado/m.valor_objetivo)*100,2) AS progresso_percentual,m.prazo,m.status
FROM metas m JOIN usuarios u ON u.id=m.usuario_id
WHERE LOWER(u.email)=LOWER('teste@finora.app') ORDER BY progresso_percentual DESC;
