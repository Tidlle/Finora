import unicodedata
from typing import Optional


def normalizar(texto: str) -> str:
    """Remove acentos e converte para minúsculas."""
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return sem_acento.lower()


# Mapa de palavras-chave → nome semântico de categoria
PALAVRAS_CHAVE: dict[str, str] = {
    # Transporte
    "uber": "Transporte",
    "99pop": "Transporte",
    "99app": "Transporte",
    "taxi": "Transporte",
    "cabify": "Transporte",
    "combustivel": "Transporte",
    "gasolina": "Transporte",
    "etanol": "Transporte",
    "posto": "Transporte",
    "shell": "Transporte",
    "ipiranga": "Transporte",
    "metro": "Transporte",
    "onibus": "Transporte",
    "estacionamento": "Transporte",
    "pedagio": "Transporte",
    "passagem": "Transporte",
    "bilhete": "Transporte",
    "brt": "Transporte",
    # Alimentação
    "mercado": "Alimentação",
    "supermercado": "Alimentação",
    "extra": "Alimentação",
    "carrefour": "Alimentação",
    "assai": "Alimentação",
    "atacadao": "Alimentação",
    "hortifruti": "Alimentação",
    "padaria": "Alimentação",
    "restaurante": "Alimentação",
    "ifood": "Alimentação",
    "rappi": "Alimentação",
    "acougue": "Alimentação",
    "pao": "Alimentação",
    "lanche": "Alimentação",
    "pizza": "Alimentação",
    "hamburger": "Alimentação",
    "burger": "Alimentação",
    "mcdonalds": "Alimentação",
    "subway": "Alimentação",
    "feira": "Alimentação",
    "mercearia": "Alimentação",
    "alimento": "Alimentação",
    "comida": "Alimentação",
    # Saúde
    "farmacia": "Saúde",
    "drogaria": "Saúde",
    "drogasil": "Saúde",
    "drogaraia": "Saúde",
    "ultrafarma": "Saúde",
    "hospital": "Saúde",
    "consulta": "Saúde",
    "exame": "Saúde",
    "medicamento": "Saúde",
    "remedio": "Saúde",
    "clinica": "Saúde",
    "dental": "Saúde",
    "dentista": "Saúde",
    "otica": "Saúde",
    "laboratorio": "Saúde",
    "plano de saude": "Saúde",
    "unimed": "Saúde",
    "amil": "Saúde",
    "bradesco saude": "Saúde",
    # Lazer
    "cinema": "Lazer",
    "spotify": "Lazer",
    "ingresso": "Lazer",
    "bar ": "Lazer",
    "festa": "Lazer",
    "teatro": "Lazer",
    "show ": "Lazer",
    "clube": "Lazer",
    "jogo": "Lazer",
    "parque": "Lazer",
    "viagem": "Lazer",
    "hotel": "Lazer",
    "airbnb": "Lazer",
    # Assinaturas
    "netflix": "Assinaturas",
    "amazon prime": "Assinaturas",
    "disney": "Assinaturas",
    "hbomax": "Assinaturas",
    "hbo max": "Assinaturas",
    "globoplay": "Assinaturas",
    "youtube premium": "Assinaturas",
    "apple": "Assinaturas",
    "icloud": "Assinaturas",
    "google one": "Assinaturas",
    "microsoft": "Assinaturas",
    "adobe": "Assinaturas",
    "assinatura": "Assinaturas",
    # Moradia
    "aluguel": "Moradia",
    "condominio": "Moradia",
    "energia eletrica": "Moradia",
    "luz ": "Moradia",
    "enel": "Moradia",
    "cemig": "Moradia",
    "copel": "Moradia",
    "agua ": "Moradia",
    "sabesp": "Moradia",
    "internet": "Moradia",
    "claro": "Moradia",
    "vivo": "Moradia",
    "tim ": "Moradia",
    "oi ": "Moradia",
    "gas ": "Moradia",
    "comgas": "Moradia",
    "iptu": "Moradia",
    "manutencao": "Moradia",
    # Educação
    "faculdade": "Educação",
    "curso": "Educação",
    "escola": "Educação",
    "livro": "Educação",
    "material": "Educação",
    "mensalidade": "Educação",
    "colegio": "Educação",
    "universidade": "Educação",
    "udemy": "Educação",
    "coursera": "Educação",
    "duolingo": "Educação",
    # Vestuário
    "roupa": "Vestuário",
    "calcado": "Vestuário",
    "sapato": "Vestuário",
    "tenis": "Vestuário",
    "camisa": "Vestuário",
    "calca": "Vestuário",
    "vestido": "Vestuário",
    "zara": "Vestuário",
    "renner": "Vestuário",
    "riachuelo": "Vestuário",
    "hering": "Vestuário",
    # Salário / Receitas
    "salario": "Salário",
    "pagamento": "Salário",
    "remuneracao": "Salário",
    "pix recebido": "Receitas",
    "transferencia recebida": "Receitas",
    "reembolso": "Receitas",
    "rendimento": "Receitas",
    "dividendo": "Receitas",
    "renda": "Receitas",
    "bonus": "Receitas",
    "premio": "Receitas",
    "freelance": "Receitas",
}


def sugerir_categoria(
    descricao: str,
    tipo: str,
    categorias_disponiveis: list[dict],
) -> dict:
    """
    Sugere uma categoria para a transação com base em palavras-chave.
    Retorna dict com categoriaId, categoriaNome, confianca e motivo.
    """
    descricao_norm = normalizar(descricao)

    # Filtra categorias pelo tipo da transação
    categorias_do_tipo = [c for c in categorias_disponiveis if c["tipo"] == tipo]
    if not categorias_do_tipo:
        return _sem_sugestao(descricao)

    melhor_match: Optional[str] = None
    melhor_palavra: Optional[str] = None

    # Tenta encontrar palavra-chave na descrição
    for palavra, categoria_semantica in PALAVRAS_CHAVE.items():
        if normalizar(palavra) in descricao_norm:
            melhor_match = categoria_semantica
            melhor_palavra = palavra
            break

    if not melhor_match:
        return _sem_sugestao(descricao)

    # Tenta encontrar a categoria do usuário cujo nome mais se aproxima
    melhor_match_norm = normalizar(melhor_match)
    categoria_escolhida = None

    # Busca exata primeiro
    for c in categorias_do_tipo:
        if normalizar(c["nome"]) == melhor_match_norm:
            categoria_escolhida = c
            break

    # Busca parcial (nome contém a categoria semântica ou vice-versa)
    if not categoria_escolhida:
        for c in categorias_do_tipo:
            nome_norm = normalizar(c["nome"])
            if melhor_match_norm in nome_norm or nome_norm in melhor_match_norm:
                categoria_escolhida = c
                break

    if not categoria_escolhida:
        return _sem_sugestao(descricao)

    return {
        "categoriaId": categoria_escolhida["id"],
        "categoriaNome": categoria_escolhida["nome"],
        "confianca": 0.9,
        "motivo": f'Descrição contém "{melhor_palavra}", associado a {melhor_match}.',
    }


def sugerir_categorias_lote(
    transacoes: list[dict],
    categorias_disponiveis: list[dict],
) -> list[dict]:
    sugestoes = []
    for t in transacoes:
        resultado = sugerir_categoria(
            descricao=t["descricao"],
            tipo=t["tipo"],
            categorias_disponiveis=categorias_disponiveis,
        )
        sugestoes.append({"descricao": t["descricao"], **resultado})
    return sugestoes


def _sem_sugestao(descricao: str) -> dict:
    return {
        "categoriaId": None,
        "categoriaNome": None,
        "confianca": 0.0,
        "motivo": "Nenhuma palavra-chave reconhecida na descrição.",
    }
