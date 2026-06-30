import re
import unicodedata
from datetime import datetime, timedelta
from typing import Optional

from services.categorizer import sugerir_categoria


# ── Termos genéricos a remover da descrição ──────────────────────────────────

TERMOS_GENERICOS = [
    r"\bCOMPRA\b", r"\bCARTAO\b", r"\bCARTÃO\b", r"\bDEBITO\b", r"\bDÉBITO\b",
    r"\bCREDITO\b", r"\bCRÉDITO\b", r"\bPAGAMENTO\b", r"\bBOLETO\b",
    r"\bTRANSFERENCIA\b", r"\bTRANSFERÊNCIA\b",
    r"\bAGENCIA\b", r"\bAGÊNCIA\b",
    r"\bCOD\b", r"\bCÓD\b", r"\bAUT\b", r"\bDOC\b", r"\bTED\b",
    r"\bTARIFA\b", r"\bSERVICO\b", r"\bSERVIÇO\b",
    r"\bHELP\b", r"\bCOM\b", r"\bBR\b", r"\bWWW\b",
]

# Padrões a remover (códigos numéricos, URLs parciais, asteriscos)
PADROES_REMOVER = [
    r"\b\d{6,}\b",          # códigos numéricos longos (6+ dígitos)
    r"\*+\w+",              # *TRIP, *IFOOD
    r"https?://\S+",        # URLs
    r"\b\w+\.(com|com\.br|br|net|org)\b",  # domínios
]

# Palavras-chave de receita (ordem importa — mais específico primeiro)
PALAVRAS_RECEITA = [
    "PIX RECEBIDO", "RECEBIDO", "TRANSFERENCIA RECEBIDA", "TRANSFERÊNCIA RECEBIDA",
    "DEPOSITO", "DEPÓSITO", "CREDITO EM CONTA", "CRÉDITO EM CONTA",
    "SALARIO", "SALÁRIO", "REMUNERACAO", "REMUNERAÇÃO",
    "REEMBOLSO", "RENDIMENTO", "DIVIDENDO", "FREELA", "FREELANCE",
    "BONUS", "BÔNUS", "RENDA",
]

# Palavras-chave de despesa
PALAVRAS_DESPESA = [
    "PIX ENVIADO", "TRANSFERENCIA ENVIADA", "TRANSFERÊNCIA ENVIADA",
    "COMPRA", "PAGAMENTO", "BOLETO", "DEBITO", "DÉBITO",
    "CARTAO", "CARTÃO", "TARIFA", "SAQUE",
]

# Formatos de data suportados
FORMATOS_DATA = [
    "%d/%m/%Y",  # 10/06/2026
    "%Y-%m-%d",  # 2026-06-10
    "%d-%m-%Y",  # 10-06-2026
    "%d.%m.%Y",  # 10.06.2026
    "%d/%m/%y",  # 10/06/26
    "%Y/%m/%d",  # 2026/06/10
]


# ── Funções auxiliares ────────────────────────────────────────────────────────

def _remover_acentos(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFD", texto)
    return "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")


def _normalizar_texto(texto: str) -> str:
    resultado = _remover_acentos(texto).upper()
    resultado = re.sub(r"\s+", " ", resultado).strip()
    return resultado


def limpar_descricao(descricao: str) -> str:
    """Remove ruído e retorna descrição limpa e legível."""
    if not descricao or not descricao.strip():
        return ""

    texto = _normalizar_texto(descricao)

    # Remove padrões (URLs, códigos numéricos longos, asteriscos)
    for padrao in PADROES_REMOVER:
        texto = re.sub(padrao, " ", texto, flags=re.IGNORECASE)

    # Remove termos genéricos
    for termo in TERMOS_GENERICOS:
        texto = re.sub(termo, " ", texto, flags=re.IGNORECASE)

    # Colapsa espaços
    texto = re.sub(r"\s+", " ", texto).strip()

    # Se ficou muito curto após limpeza, usa versão normalizada original
    if len(texto) < 3:
        texto = _normalizar_texto(descricao)

    return texto


def normalizar_data(data_str: str) -> Optional[str]:
    """Converte data para YYYY-MM-DD. Retorna None se inválida."""
    if not data_str or not data_str.strip():
        return None

    data_str = data_str.strip()

    for fmt in FORMATOS_DATA:
        try:
            dt = datetime.strptime(data_str, fmt)
            # Validação básica: ano razoável
            if dt.year < 2000 or dt.year > 2100:
                return None
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None


def normalizar_valor(valor_str: str) -> tuple[Optional[float], Optional[str]]:
    """
    Converte string de valor para float positivo.
    Retorna (valor_float, hint_tipo) onde hint_tipo pode ser 'DESPESA', 'RECEITA' ou None.
    """
    if not valor_str or not valor_str.strip():
        return None, None

    texto = valor_str.strip()

    # Detecta negatividade antes de limpar
    negativo = False
    if texto.startswith("-") or texto.endswith("-"):
        negativo = True
    if texto.startswith("(") and texto.endswith(")"):
        negativo = True

    # Remove símbolos
    texto = re.sub(r"[R$\s()]", "", texto)
    texto = texto.lstrip("-").rstrip("-")

    # Normaliza separadores decimais (brasileiro: 1.250,90 → 1250.90)
    if "," in texto and "." in texto:
        # Remove ponto de milhar, converte vírgula decimal
        texto = texto.replace(".", "").replace(",", ".")
    elif "," in texto:
        texto = texto.replace(",", ".")

    try:
        valor = float(texto)
        if valor != valor or valor == float("inf"):  # NaN ou Inf
            return None, None
        valor = abs(valor)
        hint_tipo = "DESPESA" if negativo else None
        return valor, hint_tipo
    except (ValueError, OverflowError):
        return None, None


def detectar_tipo(descricao_original: str, tipo_original: str, hint_valor: Optional[str]) -> Optional[str]:
    """Detecta RECEITA ou DESPESA com base em pistas da descrição e valor."""
    desc_upper = _normalizar_texto(descricao_original)
    tipo_orig = (tipo_original or "").strip().upper()

    # Tipo original explícito tem prioridade se válido
    if tipo_orig in ("RECEITA", "DESPESA", "ENTRADA", "SAIDA", "SAÍDA"):
        if tipo_orig in ("RECEITA", "ENTRADA"):
            return "RECEITA"
        return "DESPESA"

    # Verifica pistas de receita na descrição
    for palavra in PALAVRAS_RECEITA:
        if _remover_acentos(palavra).upper() in desc_upper:
            return "RECEITA"

    # Verifica pistas de despesa na descrição
    for palavra in PALAVRAS_DESPESA:
        if _remover_acentos(palavra).upper() in desc_upper:
            return "DESPESA"

    # Usa hint do sinal do valor
    if hint_valor:
        return hint_valor

    return None


def detectar_duplicata(
    descricao_limpa: str,
    valor: float,
    data_str: str,
    tipo: str,
    transacoes_existentes: list[dict],
) -> tuple[bool, Optional[str]]:
    """Verifica se já existe transação parecida."""
    if not transacoes_existentes or not data_str:
        return False, None

    desc_norm = _remover_acentos(descricao_limpa).upper()

    try:
        data_alvo = datetime.strptime(data_str, "%Y-%m-%d").date()
    except ValueError:
        return False, None

    for tx in transacoes_existentes:
        # Verifica tipo
        tx_tipo = (tx.get("tipo") or "").upper()
        if tx_tipo and tx_tipo != tipo:
            continue

        # Verifica valor (tolerância de R$ 0,01)
        tx_valor = tx.get("valor")
        if tx_valor is None:
            continue
        if abs(float(tx_valor) - valor) > 0.01:
            continue

        # Verifica data (mesma data ou diferença de 1 dia)
        tx_data_str = tx.get("data") or ""
        try:
            tx_data = datetime.strptime(tx_data_str, "%Y-%m-%d").date()
        except ValueError:
            continue
        if abs((data_alvo - tx_data).days) > 1:
            continue

        # Verifica descrição (substring ou tokens comuns)
        tx_desc = _remover_acentos(tx.get("descricao") or "").upper()
        if not tx_desc:
            continue

        tokens_alvo = set(desc_norm.split())
        tokens_tx = set(tx_desc.split())
        comuns = tokens_alvo & tokens_tx
        if comuns and len(comuns) / max(len(tokens_alvo), 1) >= 0.5:
            return True, "Existe uma transação parecida com mesma data e valor."

        if desc_norm in tx_desc or tx_desc in desc_norm:
            return True, "Existe uma transação parecida com mesma data e valor."

    return False, None


def determinar_status(
    data_norm: Optional[str],
    valor_norm: Optional[float],
    descricao_limpa: str,
    tipo: Optional[str],
    categoria_id: Optional[int],
    confianca: float,
    e_duplicata: bool,
) -> tuple[str, list[str]]:
    """Determina status (PRONTO/REVISAR/ERRO/IGNORAR) e mensagens da linha."""
    mensagens = []

    # Linha completamente vazia
    if not descricao_limpa.strip():
        return "IGNORAR", ["Linha ignorada: descrição ausente."]

    # Erros bloqueantes
    erros = []
    if not data_norm:
        erros.append("Data inválida ou não reconhecida.")
    if valor_norm is None:
        erros.append("Valor inválido ou não reconhecido.")
    if erros:
        return "ERRO", erros

    # Situações de revisão
    revisao = []
    if e_duplicata:
        revisao.append("Possível duplicata encontrada.")
    if not tipo:
        revisao.append("Tipo não identificado. Selecione RECEITA ou DESPESA.")
    if not categoria_id:
        revisao.append("Nenhuma categoria sugerida.")
    elif confianca < 0.6:
        revisao.append("Categoria sugerida com baixa confiança. Revise.")

    if revisao:
        return "REVISAR", revisao

    return "PRONTO", ["Transação pronta para importar."]


# ── Endpoint principal ────────────────────────────────────────────────────────

def normalizar_extrato(
    transacoes_brutas: list[dict],
    categorias_disponiveis: list[dict],
    preferencias_usuario: list[dict],
    transacoes_existentes: list[dict],
) -> dict:
    normalizadas = []

    for tx in transacoes_brutas:
        linha = tx.get("linha", 0)
        descricao_original = tx.get("descricaoOriginal") or ""
        data_original = tx.get("dataOriginal") or ""
        valor_original = tx.get("valorOriginal") or ""
        tipo_original = tx.get("tipoOriginal") or ""
        categoria_original = tx.get("categoriaOriginal") or ""
        mensagens = []

        # Linha vazia / cabeçalho repetido
        if not descricao_original.strip() and not valor_original.strip():
            normalizadas.append(_linha_ignorar(linha, descricao_original, data_original, valor_original))
            continue

        # 1. Limpar descrição
        descricao_limpa = limpar_descricao(descricao_original)
        if descricao_limpa != descricao_original.strip():
            mensagens.append("Descrição normalizada automaticamente.")

        # 2. Normalizar data
        data_norm = normalizar_data(data_original)

        # 3. Normalizar valor
        valor_norm, hint_tipo = normalizar_valor(valor_original)

        # 4. Detectar tipo
        tipo_detectado = detectar_tipo(descricao_original, tipo_original, hint_tipo)
        if tipo_detectado:
            mensagens.append(f"Tipo identificado como {'receita' if tipo_detectado == 'RECEITA' else 'despesa'}.")

        # 5. Sugerir categoria
        # Prioridade 1: preferência do usuário + regras (via categorizer)
        cat_id = None
        cat_nome = None
        confianca = 0.0
        origem = "SEM_SUGESTAO"

        if tipo_detectado and descricao_limpa:
            resultado_cat = sugerir_categoria(
                descricao=descricao_limpa,
                tipo=tipo_detectado,
                categorias_disponiveis=categorias_disponiveis,
                preferencias_usuario=preferencias_usuario,
            )
            cat_id = resultado_cat.get("categoriaId")
            cat_nome = resultado_cat.get("categoriaNome")
            confianca = resultado_cat.get("confianca", 0.0)
            origem = resultado_cat.get("origem", "SEM_SUGESTAO")

        # Prioridade 2: categoria original do arquivo, se válida e não foi por preferência
        if not cat_id and categoria_original.strip() and tipo_detectado:
            cat_orig_norm = _remover_acentos(categoria_original).lower().strip()
            for c in categorias_disponiveis:
                if (
                    _remover_acentos(c.get("nome", "")).lower() == cat_orig_norm
                    and c.get("tipo", "").upper() == tipo_detectado
                ):
                    cat_id = c["id"]
                    cat_nome = c["nome"]
                    confianca = 0.85
                    origem = "CATEGORIA_ORIGINAL"
                    mensagens.append("Categoria obtida do arquivo.")
                    break

        # 6. Detectar duplicata
        e_duplicata = False
        motivo_duplicidade = None
        if data_norm and valor_norm is not None and tipo_detectado:
            e_duplicata, motivo_duplicidade = detectar_duplicata(
                descricao_limpa, valor_norm, data_norm, tipo_detectado, transacoes_existentes
            )

        # 7. Determinar status
        status, msgs_status = determinar_status(
            data_norm, valor_norm, descricao_limpa, tipo_detectado,
            cat_id, confianca, e_duplicata
        )
        mensagens.extend(msgs_status)

        normalizadas.append({
            "linha": linha,
            "descricaoOriginal": descricao_original,
            "descricaoLimpa": descricao_limpa,
            "dataOriginal": data_original,
            "dataNormalizada": data_norm,
            "valorOriginal": valor_original,
            "valorNormalizado": valor_norm,
            "tipoDetectado": tipo_detectado,
            "categoriaSugeridaId": cat_id,
            "categoriaSugeridaNome": cat_nome,
            "confianca": confianca,
            "origemSugestao": origem,
            "possivelDuplicada": e_duplicata,
            "motivoDuplicidade": motivo_duplicidade,
            "status": status,
            "mensagens": mensagens,
        })

    # Resumo
    total = len(normalizadas)
    prontas = sum(1 for t in normalizadas if t["status"] == "PRONTO")
    revisao = sum(1 for t in normalizadas if t["status"] == "REVISAR")
    duplicatas = sum(1 for t in normalizadas if t["possivelDuplicada"])
    sem_cat = sum(1 for t in normalizadas if not t["categoriaSugeridaId"] and t["status"] != "ERRO")
    erros = sum(1 for t in normalizadas if t["status"] == "ERRO")

    return {
        "transacoesNormalizadas": normalizadas,
        "resumo": {
            "totalLinhas": total,
            "prontasParaImportar": prontas,
            "precisamRevisao": revisao,
            "possiveisDuplicadas": duplicatas,
            "semCategoria": sem_cat,
            "comErro": erros,
        },
    }


def _linha_ignorar(linha: int, descricao: str, data: str, valor: str) -> dict:
    return {
        "linha": linha,
        "descricaoOriginal": descricao,
        "descricaoLimpa": "",
        "dataOriginal": data,
        "dataNormalizada": None,
        "valorOriginal": valor,
        "valorNormalizado": None,
        "tipoDetectado": None,
        "categoriaSugeridaId": None,
        "categoriaSugeridaNome": None,
        "confianca": 0.0,
        "origemSugestao": "SEM_SUGESTAO",
        "possivelDuplicada": False,
        "motivoDuplicidade": None,
        "status": "IGNORAR",
        "mensagens": ["Linha vazia ou inválida, ignorada."],
    }
