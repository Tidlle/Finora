-- Script: criar tabela preferencias_categoria
-- Executar no PostgreSQL do Render ANTES de fazer deploy do backend Java.
-- Tabelas de referência: usuarios, categorias (nomes reais do projeto)

CREATE TABLE IF NOT EXISTS preferencias_categoria (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT NOT NULL,
    descricao_original    VARCHAR(255) NOT NULL,
    descricao_normalizada VARCHAR(255) NOT NULL,
    tipo            VARCHAR(20) NOT NULL,
    categoria_id    BIGINT NOT NULL,
    categoria_nome  VARCHAR(120) NOT NULL,
    quantidade_usos INTEGER NOT NULL DEFAULT 1,
    criado_em       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pref_cat_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT fk_pref_cat_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE INDEX IF NOT EXISTS idx_pref_cat_usuario_tipo_desc
    ON preferencias_categoria (usuario_id, tipo, descricao_normalizada);
