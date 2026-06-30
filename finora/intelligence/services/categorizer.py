import re
import unicodedata
from typing import Optional


def normalizar(texto: str) -> str:
    """Remove acentos, caracteres especiais e normaliza espaços."""
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    resultado = sem_acento.lower()
    resultado = re.sub(r"[^a-z0-9 ]", " ", resultado)
    resultado = re.sub(r"\s+", " ", resultado).strip()
    return resultado


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


def _score_similaridade(desc_norm: str, pref_norm: str) -> float:
    """
    Retorna score entre 0 e 1 medindo similaridade por tokens.
    Prioriza containment (substring exata) antes de token overlap.
    """
    if pref_norm in desc_norm:
        return 1.0
    if desc_norm in pref_norm:
        return 0.9

    tokens_pref = set(pref_norm.split())
    tokens_desc = set(desc_norm.split())
    if not tokens_pref:
        return 0.0
    comuns = tokens_pref & tokens_desc
    return len(comuns) / len(tokens_pref)


def _buscar_por_preferencia(
    descricao_norm: str,
    tipo: str,
    preferencias: list[dict],
    categorias_disponiveis: list[dict],
) -> Optional[dict]:
    """Retorna sugestão baseada em preferência do usuário ou None."""
    melhor_score = 0.0
    melhor_pref = None

    for pref in preferencias:
        if pref.get("tipo", "").upper() != tipo.upper():
            continue
        pref_norm = normalizar(str(pref.get("descricaoNormalizada") or ""))
        if not pref_norm:
            continue
        score = _score_similaridade(descricao_norm, pref_norm)
        usos = int(pref.get("quantidadeUsos") or 1)
        # Desempate por quantidade de usos (peso pequeno)
        score_final = score + usos * 0.001
        if score >= 0.6 and score_final > melhor_score:
            melhor_score = score_final
            melhor_pref = pref

    if not melhor_pref:
        return None

    cat_id = melhor_pref.get("categoriaId")
    cat_nome = melhor_pref.get("categoriaNome")

    # Confirma que a categoria ainda está disponível para o usuário
    cat_valida = any(c["id"] == cat_id for c in categorias_disponiveis)
    if not cat_valida:
        return None

    return {
        "categoriaId": cat_id,
        "categoriaNome": cat_nome,
        "confianca": 0.98,
        "motivo": "Sugestão baseada em preferência aprendida do usuário.",
        "origem": "PREFERENCIA_USUARIO",
    }


def sugerir_categoria(
    descricao: str,
    tipo: str,
    categorias_disponiveis: list[dict],
    preferencias_usuario: list[dict] | None = None,
) -> dict:
    descricao_norm = normalizar(descricao)

    # 1. Preferência do usuário tem prioridade máxima
    if preferencias_usuario:
        pref_match = _buscar_por_preferencia(
            descricao_norm, tipo, preferencias_usuario, categorias_disponiveis
        )
        if pref_match:
            return pref_match

    # 2. Regras por palavras-chave
    categorias_do_tipo = [c for c in categorias_disponiveis if c["tipo"] == tipo]
    if not categorias_do_tipo:
        return _sem_sugestao()

    categoria_semantica: Optional[str] = None
    palavra_encontrada: Optional[str] = None

    for palavra, semantica in PALAVRAS_CHAVE.items():
        if normalizar(palavra) in descricao_norm:
            categoria_semantica = semantica
            palavra_encontrada = palavra
            break

    if not categoria_semantica:
        return _sem_sugestao()

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
        return _sem_sugestao()

    return {
        "categoriaId": categoria_escolhida["id"],
        "categoriaNome": categoria_escolhida["nome"],
        "confianca": 0.9,
        "motivo": f'Encontrado "{palavra_encontrada}" → {categoria_escolhida["nome"]}.',
        "origem": "REGRA",
    }


def sugerir_categorias_lote(
    transacoes: list[dict],
    categorias_disponiveis: list[dict],
    preferencias_usuario: list[dict] | None = None,
) -> list[dict]:
    return [
        {"descricao": t["descricao"], **sugerir_categoria(
            descricao=t["descricao"],
            tipo=t["tipo"],
            categorias_disponiveis=categorias_disponiveis,
            preferencias_usuario=preferencias_usuario,
        )}
        for t in transacoes
    ]


def _sem_sugestao() -> dict:
    return {
        "categoriaId": None,
        "categoriaNome": None,
        "confianca": 0.0,
        "motivo": "Nenhuma categoria sugerida com confiança suficiente.",
        "origem": "SEM_SUGESTAO",
    }
