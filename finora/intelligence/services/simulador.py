import math
import unicodedata
import re
from datetime import date, timedelta
from calendar import monthrange


# ── Utilitários ───────────────────────────────────────────────────────────────

def _fmt_brl(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFD", texto or "")
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", sem_acento.lower()).strip()


def _proximos_meses(n: int) -> list[str]:
    """Retorna lista de strings 'YYYY-MM' para os próximos n meses (a partir do próximo)."""
    hoje = date.today()
    meses = []
    ano, mes = hoje.year, hoje.month
    for _ in range(n):
        mes += 1
        if mes > 12:
            mes = 1
            ano += 1
        meses.append(f"{ano:04d}-{mes:02d}")
    return meses


def _validar_meses_projecao(meses: int) -> int:
    if meses in (3, 6, 12, 24):
        return meses
    return 6


def _resultado_vazio(tipo: str, msg: str) -> dict:
    return {
        "tipoSimulacao": tipo,
        "titulo": "Simulação indisponível",
        "mensagemPrincipal": msg,
        "resultado": {},
        "projecaoMensal": [],
        "cenariosComparativos": [],
        "alertas": ["Cadastre mais receitas e despesas para melhorar as simulações."],
        "recomendacoes": ["Você pode começar cadastrando suas receitas e despesas dos últimos meses."],
    }


# ── Simulação: META ───────────────────────────────────────────────────────────

def _simular_meta(
    parametros: dict,
    contexto: dict,
    meses_projecao: int,
) -> dict:
    valor_meta = float(parametros.get("valorMeta") or 0)
    valor_atual = float(parametros.get("valorAtual") or 0)
    economia_mensal = float(parametros.get("economiaMensalPlanejada") or 0)
    prazo_desejado = int(parametros.get("prazoDesejadoMeses") or 0)

    if valor_meta <= 0:
        return _resultado_vazio("META", "Informe um valor de meta válido.")

    if valor_atual < 0:
        valor_atual = 0.0

    if valor_atual >= valor_meta:
        return {
            "tipoSimulacao": "META",
            "titulo": "Meta já atingida!",
            "mensagemPrincipal": f"Parabéns! Você já atingiu ou superou sua meta de {_fmt_brl(valor_meta)}.",
            "resultado": {"valorMeta": valor_meta, "valorAtual": valor_atual, "valorRestante": 0},
            "projecaoMensal": [],
            "cenariosComparativos": [],
            "alertas": [],
            "recomendacoes": ["Considere definir uma nova meta mais ambiciosa!"],
        }

    valor_restante = round(valor_meta - valor_atual, 2)
    alertas = []
    recomendacoes = []

    if economia_mensal <= 0:
        # Usar economia média do contexto
        economia_mensal = float(contexto.get("economiaMediaMensal") or 0)
        if economia_mensal <= 0:
            return _resultado_vazio("META", "Informe uma economia mensal planejada maior que zero.")

    meses_para_atingir = math.ceil(valor_restante / economia_mensal)
    meses_projecao_val = max(meses_projecao, meses_para_atingir + 1) if meses_para_atingir < 24 else meses_projecao
    meses_projecao_val = min(meses_projecao_val, 24)

    saldo_atual = float(contexto.get("saldoAtual") or valor_atual)
    receitas_media = float(contexto.get("mediaReceitasMensais") or 0)
    despesas_media = float(contexto.get("mediaDespesasMensais") or 0)

    mensagem = (
        f"Com uma economia mensal de {_fmt_brl(economia_mensal)}, "
        f"você atingirá sua meta em aproximadamente {meses_para_atingir} "
        f"{'mês' if meses_para_atingir == 1 else 'meses'}."
    )

    valor_mensal_necessario = None
    if prazo_desejado and prazo_desejado > 0:
        valor_mensal_necessario = round(valor_restante / prazo_desejado, 2)
        if prazo_desejado < meses_para_atingir:
            alertas.append(
                f"Para atingir a meta em {prazo_desejado} meses, seria necessário "
                f"economizar {_fmt_brl(valor_mensal_necessario)} por mês."
            )

    economia_total_projetada = round(economia_mensal * meses_para_atingir, 2)
    saldo_final_projetado = round(saldo_atual + economia_mensal * meses_projecao_val, 2)

    meses_lista = _proximos_meses(meses_projecao_val)
    projecao = []
    acumulado = valor_atual
    saldo_proj = saldo_atual
    for m in meses_lista:
        acumulado = round(min(acumulado + economia_mensal, valor_meta), 2)
        if receitas_media > 0:
            saldo_proj = round(saldo_proj + (receitas_media - despesas_media), 2)
        else:
            saldo_proj = round(saldo_proj + economia_mensal, 2)
        projecao.append({
            "mes": m,
            "saldoProjetado": saldo_proj,
            "valorAcumuladoMeta": acumulado,
            "receitasProjetadas": round(receitas_media, 2) if receitas_media else None,
            "despesasProjetadas": round(despesas_media, 2) if despesas_media else None,
        })

    cenarios = _cenarios_meta(valor_restante, economia_mensal, saldo_atual, meses_projecao_val)

    recomendacoes.append("Acompanhe essa simulação mensalmente para ajustar o plano.")
    recomendacoes.append("Você pode reduzir pequenas porcentagens nas maiores categorias para acelerar sua meta.")

    resultado = {
        "valorMeta": round(valor_meta, 2),
        "valorAtual": round(valor_atual, 2),
        "valorRestante": valor_restante,
        "economiaMensalConsiderada": round(economia_mensal, 2),
        "mesesParaAtingir": meses_para_atingir,
        "prazoDesejadoMeses": prazo_desejado if prazo_desejado else None,
        "valorMensalNecessarioParaPrazo": valor_mensal_necessario,
        "saldoFinalProjetado": saldo_final_projetado,
        "economiaTotalProjetada": economia_total_projetada,
    }

    return {
        "tipoSimulacao": "META",
        "titulo": "Simulação de meta financeira",
        "mensagemPrincipal": mensagem,
        "resultado": resultado,
        "projecaoMensal": projecao,
        "cenariosComparativos": cenarios,
        "alertas": alertas,
        "recomendacoes": recomendacoes,
    }


def _cenarios_meta(valor_restante: float, economia_base: float, saldo_atual: float, meses: int) -> list[dict]:
    def _cenario(nome, descricao, economia):
        if economia <= 0:
            return None
        meses_p = math.ceil(valor_restante / economia)
        saldo_f = round(saldo_atual + economia * meses, 2)
        return {
            "nome": nome,
            "descricao": descricao,
            "valorMensal": round(economia, 2),
            "mesesParaAtingir": meses_p,
            "saldoFinalProjetado": saldo_f,
        }

    lista = [
        _cenario("Cenário informado", f"Economizando {_fmt_brl(economia_base)} por mês.", economia_base),
        _cenario("Economizando 20% a mais", f"Economizando {_fmt_brl(economia_base * 1.2)} por mês.", economia_base * 1.2),
        _cenario("Economizando 20% a menos", f"Economizando {_fmt_brl(economia_base * 0.8)} por mês.", economia_base * 0.8),
    ]
    return [c for c in lista if c is not None]


# ── Simulação: REDUCAO_DESPESAS ────────────────────────────────────────────────

def _simular_reducao_despesas(
    parametros: dict,
    contexto: dict,
    categorias: list[dict],
    meses_projecao: int,
) -> dict:
    percentual = float(parametros.get("percentualReducaoDespesa") or 0)
    categoria_alvo = _normalizar(parametros.get("categoria") or "")
    categorias_reducao = [_normalizar(c) for c in (parametros.get("categoriasReducao") or []) if c]

    percentual = max(0.0, min(100.0, percentual))

    receitas_media = float(contexto.get("mediaReceitasMensais") or 0)
    despesas_media = float(contexto.get("mediaDespesasMensais") or 0)
    saldo_atual = float(contexto.get("saldoAtual") or 0)

    if despesas_media <= 0:
        return _resultado_vazio("REDUCAO_DESPESAS", "Ainda há poucos dados de despesas para gerar uma simulação confiável.")

    if percentual <= 0:
        return _resultado_vazio("REDUCAO_DESPESAS", "Informe um percentual de redução válido.")

    # Determina categorias a reduzir
    alvos = categorias_reducao or ([categoria_alvo] if categoria_alvo else [])

    economia_mensal = 0.0
    cats_usadas = []

    if alvos:
        cats_norm = {_normalizar(c.get("nome") or ""): c for c in categorias}
        for alvo in alvos:
            match = cats_norm.get(alvo)
            if match:
                total_cat = float(match.get("totalMedioMensal") or 0)
                eco = round(total_cat * percentual / 100, 2)
                economia_mensal += eco
                cats_usadas.append(match.get("nome", alvo))
            # se não encontrou a categoria, ignora silenciosamente
        if not cats_usadas:
            return _resultado_vazio(
                "REDUCAO_DESPESAS",
                "Não encontrei essas categorias no seu histórico recente. Verifique o nome e tente novamente."
            )
    else:
        # Redução geral sobre todas as despesas
        economia_mensal = round(despesas_media * percentual / 100, 2)
        cats_usadas = ["todas as categorias"]

    economia_mensal = round(economia_mensal, 2)
    impacto_periodo = round(economia_mensal * meses_projecao, 2)
    nova_despesa_mensal = round(despesas_media - economia_mensal, 2)
    novo_saldo_mensal = round(receitas_media - nova_despesa_mensal, 2)

    if len(cats_usadas) == 1 and cats_usadas[0] != "todas as categorias":
        nome_cat = cats_usadas[0]
        mensagem = (
            f"Reduzindo {percentual:.0f}% em {nome_cat}, você economizaria cerca de "
            f"{_fmt_brl(economia_mensal)} por mês e {_fmt_brl(impacto_periodo)} em {meses_projecao} meses."
        )
    else:
        mensagem = (
            f"Reduzindo {percentual:.0f}% em {', '.join(cats_usadas)}, você economizaria "
            f"{_fmt_brl(economia_mensal)} por mês e {_fmt_brl(impacto_periodo)} em {meses_projecao} meses."
        )

    meses_lista = _proximos_meses(meses_projecao)
    projecao = []
    saldo_proj = saldo_atual
    for m in meses_lista:
        saldo_proj = round(saldo_proj + novo_saldo_mensal, 2)
        projecao.append({
            "mes": m,
            "receitasProjetadas": round(receitas_media, 2),
            "despesasProjetadas": nova_despesa_mensal,
            "saldoProjetado": saldo_proj,
            "valorAcumuladoMeta": None,
        })

    cenarios = _cenarios_reducao(despesas_media, receitas_media, saldo_atual, percentual, cats_usadas, meses_projecao)

    alertas = []
    recomendacoes = [
        "Reduções graduais são mais sustentáveis do que cortes bruscos.",
        "Revise seus gastos mensalmente para manter a disciplina.",
    ]
    if novo_saldo_mensal < 0:
        alertas.append("Mesmo com essa redução, o saldo mensal permanece negativo. Considere aumentar sua receita também.")

    resultado = {
        "categoriasReducao": cats_usadas,
        "percentualReducao": percentual,
        "economiaMensalProjetada": economia_mensal,
        "impactoPeriodo": impacto_periodo,
        "novaDespesaMensal": nova_despesa_mensal,
        "novoSaldoMensal": novo_saldo_mensal,
        "mesesProjecao": meses_projecao,
    }

    return {
        "tipoSimulacao": "REDUCAO_DESPESAS",
        "titulo": "Simulação de redução de despesas",
        "mensagemPrincipal": mensagem,
        "resultado": resultado,
        "projecaoMensal": projecao,
        "cenariosComparativos": cenarios,
        "alertas": alertas,
        "recomendacoes": recomendacoes,
    }


def _cenarios_reducao(despesas_media, receitas_media, saldo_atual, pct_base, cats, meses):
    def _cenario(nome, descricao, pct):
        eco = round(despesas_media * pct / 100, 2) if not cats or cats == ["todas as categorias"] else None
        if eco is None:
            return None
        novo_saldo = round(receitas_media - (despesas_media - eco), 2)
        saldo_final = round(saldo_atual + novo_saldo * meses, 2)
        return {
            "nome": nome,
            "descricao": descricao,
            "percentualReducao": pct,
            "economiaMensal": eco,
            "saldoFinalProjetado": saldo_final,
            "mesesParaAtingir": None,
        }

    return [c for c in [
        _cenario("Redução informada", f"Reduzindo {pct_base:.0f}% das despesas.", pct_base),
        _cenario("Redução conservadora", f"Reduzindo 5% das despesas.", 5.0),
        _cenario("Redução agressiva", f"Reduzindo 15% das despesas.", 15.0),
    ] if c is not None]


# ── Simulação: AUMENTO_RECEITA ─────────────────────────────────────────────────

def _simular_aumento_receita(
    parametros: dict,
    contexto: dict,
    meses_projecao: int,
) -> dict:
    aumento = float(parametros.get("aumentoReceitaMensal") or 0)

    receitas_media = float(contexto.get("mediaReceitasMensais") or 0)
    despesas_media = float(contexto.get("mediaDespesasMensais") or 0)
    saldo_atual = float(contexto.get("saldoAtual") or 0)

    if aumento <= 0:
        return _resultado_vazio("AUMENTO_RECEITA", "Informe um aumento de receita mensal válido.")

    if receitas_media <= 0 and despesas_media <= 0:
        return _resultado_vazio("AUMENTO_RECEITA", "Ainda há poucos dados financeiros para gerar uma simulação confiável.")

    nova_receita = round(receitas_media + aumento, 2)
    novo_saldo_mensal = round(nova_receita - despesas_media, 2)
    impacto_periodo = round(aumento * meses_projecao, 2)
    saldo_final = round(saldo_atual + novo_saldo_mensal * meses_projecao, 2)

    mensagem = (
        f"Com {_fmt_brl(aumento)} a mais de receita por mês, seu saldo projetado "
        f"aumentaria em {_fmt_brl(impacto_periodo)} nos próximos {meses_projecao} meses."
    )

    meses_lista = _proximos_meses(meses_projecao)
    projecao = []
    saldo_proj = saldo_atual
    for m in meses_lista:
        saldo_proj = round(saldo_proj + novo_saldo_mensal, 2)
        projecao.append({
            "mes": m,
            "receitasProjetadas": nova_receita,
            "despesasProjetadas": round(despesas_media, 2),
            "saldoProjetado": saldo_proj,
            "valorAcumuladoMeta": None,
        })

    cenarios = [
        {
            "nome": "Aumento informado",
            "descricao": f"Receita adicional de {_fmt_brl(aumento)} por mês.",
            "valorMensal": round(aumento, 2),
            "saldoFinalProjetado": saldo_final,
            "mesesParaAtingir": None,
        },
        {
            "nome": "Aumento 20% menor",
            "descricao": f"Receita adicional de {_fmt_brl(aumento * 0.8)} por mês.",
            "valorMensal": round(aumento * 0.8, 2),
            "saldoFinalProjetado": round(saldo_atual + (nova_receita * 0.8 + receitas_media * 0.2 - despesas_media) * meses_projecao, 2),
            "mesesParaAtingir": None,
        },
        {
            "nome": "Aumento 20% maior",
            "descricao": f"Receita adicional de {_fmt_brl(aumento * 1.2)} por mês.",
            "valorMensal": round(aumento * 1.2, 2),
            "saldoFinalProjetado": round(saldo_atual + (receitas_media + aumento * 1.2 - despesas_media) * meses_projecao, 2),
            "mesesParaAtingir": None,
        },
    ]

    resultado = {
        "aumentoReceitaMensal": round(aumento, 2),
        "novaReceitaMensal": nova_receita,
        "novoSaldoMensal": novo_saldo_mensal,
        "impactoPeriodo": impacto_periodo,
        "saldoFinalProjetado": saldo_final,
        "mesesProjecao": meses_projecao,
    }

    alertas = []
    if novo_saldo_mensal < 0:
        alertas.append("Mesmo com esse aumento, as despesas superam as receitas. Considere também reduzir gastos.")

    return {
        "tipoSimulacao": "AUMENTO_RECEITA",
        "titulo": "Simulação de aumento de receita",
        "mensagemPrincipal": mensagem,
        "resultado": resultado,
        "projecaoMensal": projecao,
        "cenariosComparativos": cenarios,
        "alertas": alertas,
        "recomendacoes": [
            "Diversifique suas fontes de renda para maior estabilidade.",
            "Aplique o valor adicional em investimentos ou aceleração de metas.",
        ],
    }


# ── Simulação: CENARIO_COMBINADO ───────────────────────────────────────────────

def _simular_cenario_combinado(
    parametros: dict,
    contexto: dict,
    categorias: list[dict],
    meses_projecao: int,
) -> dict:
    percentual_reducao = float(parametros.get("percentualReducaoDespesa") or 0)
    categorias_reducao_raw = parametros.get("categoriasReducao") or []
    aumento_receita = float(parametros.get("aumentoReceitaMensal") or 0)
    valor_meta = float(parametros.get("valorMeta") or 0)
    valor_atual_meta = float(parametros.get("valorAtual") or 0)

    percentual_reducao = max(0.0, min(100.0, percentual_reducao))

    receitas_media = float(contexto.get("mediaReceitasMensais") or 0)
    despesas_media = float(contexto.get("mediaDespesasMensais") or 0)
    saldo_atual = float(contexto.get("saldoAtual") or 0)
    economia_media = float(contexto.get("economiaMediaMensal") or max(0, receitas_media - despesas_media))

    if receitas_media <= 0 and despesas_media <= 0:
        return _resultado_vazio("CENARIO_COMBINADO", "Ainda há poucos dados financeiros para gerar uma simulação confiável.")

    # Calcular economia por redução de categorias
    economia_reducao = 0.0
    cats_usadas = []
    if categorias_reducao_raw and percentual_reducao > 0:
        cats_norm = {_normalizar(c.get("nome") or ""): c for c in categorias}
        for c_raw in categorias_reducao_raw:
            match = cats_norm.get(_normalizar(c_raw))
            if match:
                total = float(match.get("totalMedioMensal") or 0)
                economia_reducao += total * percentual_reducao / 100
                cats_usadas.append(match.get("nome", c_raw))
    elif percentual_reducao > 0:
        economia_reducao = despesas_media * percentual_reducao / 100

    economia_reducao = round(economia_reducao, 2)
    aumento_receita = max(0.0, aumento_receita)

    melhora_mensal = round(economia_reducao + aumento_receita, 2)
    novo_saldo_mensal = round(economia_media + melhora_mensal, 2)
    nova_receita = round(receitas_media + aumento_receita, 2)
    nova_despesa = round(despesas_media - economia_reducao, 2)
    impacto_periodo = round(melhora_mensal * meses_projecao, 2)
    saldo_final = round(saldo_atual + novo_saldo_mensal * meses_projecao, 2)

    meses_para_meta = None
    if valor_meta > 0 and valor_atual_meta >= 0 and novo_saldo_mensal > 0:
        restante = max(0, valor_meta - valor_atual_meta)
        if restante <= 0:
            meses_para_meta = 0
        else:
            meses_para_meta = math.ceil(restante / novo_saldo_mensal)

    partes = []
    if economia_reducao > 0:
        partes.append(f"reduzindo despesas em {_fmt_brl(economia_reducao)}/mês")
    if aumento_receita > 0:
        partes.append(f"aumentando receitas em {_fmt_brl(aumento_receita)}/mês")

    mensagem = (
        f"Com esse cenário combinado ({', '.join(partes)}), "
        f"seu saldo mensal melhoraria em {_fmt_brl(melhora_mensal)}."
    )
    if meses_para_meta is not None and meses_para_meta > 0:
        mensagem += f" Você poderia atingir a meta em aproximadamente {meses_para_meta} {'mês' if meses_para_meta == 1 else 'meses'}."

    meses_lista = _proximos_meses(meses_projecao)
    projecao = []
    saldo_proj = saldo_atual
    acumulado_meta = valor_atual_meta if valor_meta > 0 else None
    for m in meses_lista:
        saldo_proj = round(saldo_proj + novo_saldo_mensal, 2)
        if acumulado_meta is not None:
            acumulado_meta = round(min(acumulado_meta + novo_saldo_mensal, valor_meta), 2)
        projecao.append({
            "mes": m,
            "receitasProjetadas": nova_receita,
            "despesasProjetadas": nova_despesa,
            "saldoProjetado": saldo_proj,
            "valorAcumuladoMeta": acumulado_meta,
        })

    cenarios = [
        {
            "nome": "Cenário informado",
            "descricao": f"Melhora de {_fmt_brl(melhora_mensal)}/mês.",
            "valorMensal": melhora_mensal,
            "saldoFinalProjetado": saldo_final,
            "mesesParaAtingir": meses_para_meta,
        },
        {
            "nome": "Cenário conservador",
            "descricao": "Apenas redução de despesas, sem aumento de receita.",
            "valorMensal": round(economia_reducao, 2),
            "saldoFinalProjetado": round(saldo_atual + (economia_media + economia_reducao) * meses_projecao, 2),
            "mesesParaAtingir": (
                math.ceil(max(0, valor_meta - valor_atual_meta) / (economia_media + economia_reducao))
                if valor_meta > 0 and (economia_media + economia_reducao) > 0 else None
            ),
        },
        {
            "nome": "Cenário otimista",
            "descricao": "Redução e aumento de receita 20% maiores.",
            "valorMensal": round(melhora_mensal * 1.2, 2),
            "saldoFinalProjetado": round(saldo_atual + (economia_media + melhora_mensal * 1.2) * meses_projecao, 2),
            "mesesParaAtingir": (
                math.ceil(max(0, valor_meta - valor_atual_meta) / (economia_media + melhora_mensal * 1.2))
                if valor_meta > 0 and (economia_media + melhora_mensal * 1.2) > 0 else None
            ),
        },
    ]

    alertas = []
    if melhora_mensal <= 0:
        alertas.append("O cenário combinado não resultou em melhora. Revise os parâmetros.")
    if novo_saldo_mensal < 0:
        alertas.append("Mesmo com esse cenário, o saldo mensal permanece negativo.")

    recomendacoes = [
        "Combinar redução de despesas com aumento de receita é a estratégia mais eficaz.",
        "Monitore sua evolução mensalmente e ajuste os valores conforme necessário.",
    ]

    resultado = {
        "economiaPorReducao": economia_reducao,
        "ganhoPorAumento": round(aumento_receita, 2),
        "melhoraMensal": melhora_mensal,
        "novoSaldoMensal": novo_saldo_mensal,
        "impactoPeriodo": impacto_periodo,
        "saldoFinalProjetado": saldo_final,
        "mesesParaMeta": meses_para_meta,
        "mesesProjecao": meses_projecao,
        "categoriasSelecionadas": cats_usadas or (["todas"] if percentual_reducao > 0 else []),
    }

    return {
        "tipoSimulacao": "CENARIO_COMBINADO",
        "titulo": "Simulação de cenário combinado",
        "mensagemPrincipal": mensagem,
        "resultado": resultado,
        "projecaoMensal": projecao,
        "cenariosComparativos": cenarios,
        "alertas": alertas,
        "recomendacoes": recomendacoes,
    }


# ── Entrada principal ─────────────────────────────────────────────────────────

FALLBACK = {
    "tipoSimulacao": "INFORMATIVO",
    "titulo": "Simulador indisponível",
    "mensagemPrincipal": "Não foi possível gerar a simulação inteligente neste momento.",
    "resultado": {},
    "projecaoMensal": [],
    "cenariosComparativos": [],
    "alertas": ["Tente novamente em alguns instantes."],
    "recomendacoes": [],
}


def simular_cenario_financeiro(
    tipo_simulacao: str,
    meses_projecao: int,
    parametros: dict,
    contexto_financeiro: dict,
    categorias: list[dict],
    metas: list[dict],
    historico_mensal: list[dict],
) -> dict:
    tipo = (tipo_simulacao or "").upper()
    meses = _validar_meses_projecao(meses_projecao)
    ctx = contexto_financeiro or {}
    cats = categorias or []
    params = parametros or {}

    # Se não tiver contexto de médias, tenta calcular pelo histórico
    if ctx.get("mediaReceitasMensais") is None and historico_mensal:
        receitas_hist = [float(h.get("receitas") or 0) for h in historico_mensal if h.get("receitas")]
        despesas_hist = [float(h.get("despesas") or 0) for h in historico_mensal if h.get("despesas")]
        if receitas_hist:
            ctx = {**ctx, "mediaReceitasMensais": sum(receitas_hist) / len(receitas_hist)}
        if despesas_hist:
            ctx = {**ctx, "mediaDespesasMensais": sum(despesas_hist) / len(despesas_hist)}
        rec_med = ctx.get("mediaReceitasMensais") or 0
        desp_med = ctx.get("mediaDespesasMensais") or 0
        if ctx.get("economiaMediaMensal") is None:
            ctx = {**ctx, "economiaMediaMensal": max(0, rec_med - desp_med)}

    if tipo == "META":
        # Se valorAtual não veio nos parâmetros, usa da primeira meta ativa
        if not params.get("valorAtual") and metas:
            primeira_meta = next((m for m in metas if m.get("status") not in ("CONCLUIDA", "CANCELADA")), None)
            if primeira_meta:
                params = {**params, "valorAtual": float(primeira_meta.get("valorAtual") or 0)}
                if not params.get("valorMeta"):
                    params = {**params, "valorMeta": float(primeira_meta.get("valorAlvo") or 0)}
        return _simular_meta(params, ctx, meses)

    elif tipo == "REDUCAO_DESPESAS":
        return _simular_reducao_despesas(params, ctx, cats, meses)

    elif tipo == "AUMENTO_RECEITA":
        return _simular_aumento_receita(params, ctx, meses)

    elif tipo == "CENARIO_COMBINADO":
        return _simular_cenario_combinado(params, ctx, cats, meses)

    else:
        return {**FALLBACK, "mensagemPrincipal": f"Tipo de simulação desconhecido: '{tipo_simulacao}'."}
