-- ============================================================
-- FINORA - MVP | Script 001: criacao das tabelas principais
-- Banco: finora_db | Usuario recomendado: finora_app
-- ============================================================
BEGIN;

CREATE TABLE usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_usuarios_nome_nao_vazio CHECK (BTRIM(nome) <> ''),
    CONSTRAINT ck_usuarios_email_nao_vazio CHECK (BTRIM(email) <> '')
);
CREATE UNIQUE INDEX uq_usuarios_email_lower ON usuarios (LOWER(email));

CREATE TABLE categorias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    padrao BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_id BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categorias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT ck_categorias_nome_nao_vazio CHECK (BTRIM(nome) <> ''),
    CONSTRAINT ck_categorias_tipo CHECK (tipo IN ('RECEITA', 'DESPESA')),
    CONSTRAINT uq_categorias_usuario_nome_tipo UNIQUE (usuario_id, nome, tipo),
    CONSTRAINT uq_categorias_id_usuario_tipo UNIQUE (id, usuario_id, tipo)
);

CREATE TABLE transacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao VARCHAR(150) NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    data_transacao DATE NOT NULL,
    observacao VARCHAR(255),
    categoria_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_transacoes_descricao_nao_vazia CHECK (BTRIM(descricao) <> ''),
    CONSTRAINT ck_transacoes_valor_positivo CHECK (valor > 0),
    CONSTRAINT ck_transacoes_tipo CHECK (tipo IN ('RECEITA', 'DESPESA')),
    CONSTRAINT fk_transacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_transacoes_categoria_usuario_tipo FOREIGN KEY (categoria_id, usuario_id, tipo)
        REFERENCES categorias(id, usuario_id, tipo) ON DELETE RESTRICT
);

CREATE TABLE metas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(255),
    valor_objetivo NUMERIC(12,2) NOT NULL,
    valor_acumulado NUMERIC(12,2) NOT NULL DEFAULT 0,
    prazo DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO',
    usuario_id BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_metas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT ck_metas_nome_nao_vazio CHECK (BTRIM(nome) <> ''),
    CONSTRAINT ck_metas_valor_objetivo_positivo CHECK (valor_objetivo > 0),
    CONSTRAINT ck_metas_valor_acumulado_nao_negativo CHECK (valor_acumulado >= 0),
    CONSTRAINT ck_metas_status CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDA'))
);

CREATE OR REPLACE FUNCTION atualizar_timestamp_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado_em BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp_modificacao();
CREATE TRIGGER trg_categorias_atualizado_em BEFORE UPDATE ON categorias
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp_modificacao();
CREATE TRIGGER trg_transacoes_atualizado_em BEFORE UPDATE ON transacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp_modificacao();
CREATE TRIGGER trg_metas_atualizado_em BEFORE UPDATE ON metas
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp_modificacao();

CREATE INDEX idx_categorias_usuario_tipo ON categorias (usuario_id, tipo);
CREATE INDEX idx_transacoes_usuario_data ON transacoes (usuario_id, data_transacao DESC);
CREATE INDEX idx_transacoes_usuario_tipo_data ON transacoes (usuario_id, tipo, data_transacao DESC);
CREATE INDEX idx_metas_usuario_status ON metas (usuario_id, status);
COMMIT;
