import unicodedata
from typing import Optional


def normalizar(texto: str) -> str:
    """Remove acentos e converte para minúsculas."""
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return sem_acento.lower()


# Mapa palavra-chave (normalizada) → categoria semântica (normalizada)
PALAVRAS_CHAVE: dict[str, str] = {
    # Transporte
    "uber": "transporte",
    "99pop": "transporte",
    "99app": "transporte",
    "taxi": "transporte",
    "cabify": "transporte",
    "gasolina": "transporte",
    "combustivel": "transporte",
    "etanol": "transporte",
    "posto": "transporte",
    "shell": "transporte",
    "ipiranga": "transporte",
    "metro": "transporte",
    "onibus": "transporte",
    "estacionamento": "transporte",
    "pedagio": "transporte",
    "passagem": "transporte",
    "brt": "transporte",
    # Alimentação
    "mercado": "alimentacao",
    "supermercado": "alimentacao",
    "carrefour": "alimentacao",
    "assai": "alimentacao",
    "atacadao": "alimentacao",
    "hortifruti": "alimentacao",
    "padaria": "alimentacao",
    "restaurante": "alimentacao",
    "ifood": "alimentacao",
    "rappi": "alimentacao",
    "acougue": "alimentacao",
    "lanche": "alimentacao",
    "pizza": "alimentacao",
    "hamburger": "alimentacao",
    "burger": "alimentacao",
    "cafe": "alimentacao",
    "mcdonalds": "alimentacao",
    "subway": "alimentacao",
    "feira": "alimentacao",
    "mercearia": "alimentacao",
    "comida": "alimentacao",
    "extra": "alimentacao",
    # Saúde
    "farmacia": "saude",
    "drogaria": "saude",
    "drogasil": "saude",
    "ultrafarma": "saude",
    "hospital": "saude",
    "consulta": "saude",
    "exame": "saude",
    "medicamento": "saude",
    "remedio": "saude",
    "clinica": "saude",
    "dental": "saude",
    "dentista": "saude",
    "laboratorio": "saude",
    "unimed": "saude",
    "amil": "saude",
    # Assinaturas (antes de Lazer para netflix/spotify não caírem no grupo errado)
    "netflix": "assinaturas",
    "spotify": "assinaturas",
    "disney": "assinaturas",
    "hbomax": "assinaturas",
    "globoplay": "assinaturas",
    "icloud": "assinaturas",
    "assinatura": "assinaturas",
    # Lazer
    "cinema": "lazer",
    "ingresso": "lazer",
    "festa": "lazer",
    "teatro": "lazer",
    "clube": "lazer",
    "parque": "lazer",
    "viagem": "lazer",
    "hotel": "lazer",
    "airbnb": "lazer",
    # Moradia
    "aluguel": "moradia",
    "condominio": "moradia",
    "energia": "moradia",
    "enel": "moradia",
    "cemig": "moradia",
    "copel": "moradia",
    "sabesp": "moradia",
    "internet": "moradia",
    "claro": "moradia",
    "vivo": "moradia",
    "comgas": "moradia",
    "iptu": "moradia",
    "manutencao": "moradia",
    # Educação
    "faculdade": "educacao",
    "fiap": "educacao",
    "curso": "educacao",
    "escola": "educacao",
    "livro": "educacao",
    "mensalidade": "educacao",
    "colegio": "educacao",
    "universidade": "educacao",
    "udemy": "educacao",
    "coursera": "educacao",
    # Salário
    "salario": "salario",
    "remuneracao": "salario",
    "pagamento": "salario",
    # Receitas
    "pix recebido": "receitas",
    "reembolso": "receitas",
    "rendimento": "receitas",
    "dividendo": "receitas",
    "freelance": "receitas",
    "freela": "receitas",
    "bonus": "receitas",
    "renda": "receitas",
}


def sugerir_categoria(
    descricao: str,
    tipo: str,
    categorias_disponiveis: list[dict],
) -> dict:
    descricao_norm = normalizar(descricao)

    categorias_do_tipo = [c for c in categorias_disponiveis if c["tipo"] == tipo]
    if not categorias_do_tipo:
        return _sem_sugestao(descricao)

    categoria_semantica: Optional[str] = None
    palavra_encontrada: Optional[str] = None

    for palavra, semantica in PALAVRAS_CHAVE.items():
        if normalizar(palavra) in descricao_norm:
            categoria_semantica = semantica
            palavra_encontrada = palavra
            break

    if not categoria_semantica:
        return _sem_sugestao(descricao)

    # Busca exata pelo nome normalizado
    categoria_escolhida = None
    for c in categorias_do_tipo:
        if normalizar(c["nome"]) == categoria_semantica:
            categoria_escolhida = c
            break

    # Busca parcial
    if not categoria_escolhida:
        for c in categorias_do_tipo:
            nome_norm = normalizar(c["nome"])
            if categoria_semantica in nome_norm or nome_norm in categoria_semantica:
                categoria_escolhida = c
                break

    if not categoria_escolhida:
        return _sem_sugestao(descricao)

    return {
        "categoriaId": categoria_escolhida["id"],
        "categoriaNome": categoria_escolhida["nome"],
        "confianca": 0.9,
        "motivo": f'Encontrado "{palavra_encontrada}" → {categoria_escolhida["nome"]}.',
    }


def sugerir_categorias_lote(
    transacoes: list[dict],
    categorias_disponiveis: list[dict],
) -> list[dict]:
    return [
        {"descricao": t["descricao"], **sugerir_categoria(
            descricao=t["descricao"],
            tipo=t["tipo"],
            categorias_disponiveis=categorias_disponiveis,
        )}
        for t in transacoes
    ]


def _sem_sugestao(descricao: str) -> dict:
    return {
        "categoriaId": None,
        "categoriaNome": None,
        "confianca": 0.0,
        "motivo": "Nenhuma palavra-chave reconhecida na descrição.",
    }
