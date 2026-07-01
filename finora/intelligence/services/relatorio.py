from datetime import datetime


def _fmt_brl(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _nome_mes(mes_str: str) -> str:
    """Converte '2026-06' → 'Junho de 2026'."""
    MESES = [
        "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ]
    try:
        partes = mes_str.split("-")
        ano, m = int(partes[0]), int(partes[1])
        return f"{MESES[m]} de {ano}"
    except Exception:
        return mes_str


def _classificacao_geral(score: int, saldo: float, risco: bool) -> str:
    if risco or saldo < 0:
        return "CRITICA"
    if score >= 75:
        return "EXCELENTE" if score >= 90 else "BOA"
    if score >= 50:
        return "ATENCAO"
    return "CRITICA"


def gerar_relatorio_mensal(
    periodo: dict,
    periodo_anterior: dict | None,
    resumo_financeiro: dict,
    categorias: list[dict],
    transacoes: list[dict],
    insights: list[dict],
    anomalias: list[dict],
    score_financeiro: dict | None,
    recomendacoes_economia: dict | None,
    projecao: dict | None,
    metas: list[dict],
) -> dict:
    mes_str = (periodo or {}).get("mes", "")
    nome_mes = _nome_mes(mes_str) if mes_str else "do período"

    total_receitas = float((resumo_financeiro or {}).get("totalReceitas") or 0)
    total_despesas = float((resumo_financeiro or {}).get("totalDespesas") or 0)
    saldo = float((resumo_financeiro or {}).get("saldo") or 0)

    # Sem dados suficientes
    if total_receitas == 0 and total_despesas == 0:
        return _relatorio_vazio(nome_mes)

    # ── Seção 1: Resumo financeiro ─────────────────────────────────────────────
    saldo_label = "positivo" if saldo >= 0 else "negativo"
    itens_resumo = [
        f"Você encerrou {nome_mes} com saldo {saldo_label} de {_fmt_brl(abs(saldo))}.",
        f"Receitas totais: {_fmt_brl(total_receitas)}.",
        f"Despesas totais: {_fmt_brl(total_despesas)}.",
    ]

    # ── Seção 2: Principais categorias ────────────────────────────────────────
    despesas_cat = [c for c in (categorias or []) if (c.get("tipo") or "").upper() == "DESPESA"]
    despesas_cat_ord = sorted(despesas_cat, key=lambda c: float(c.get("total") or 0), reverse=True)

    itens_categorias = []
    maior_categoria = None
    if despesas_cat_ord:
        top = despesas_cat_ord[0]
        maior_categoria = top.get("nome")
        pct = float(top.get("percentual") or 0)
        itens_categorias.append(
            f"Sua maior categoria de gasto foi {maior_categoria}, representando {pct:.1f}% das despesas."
        )
        for c in despesas_cat_ord[1:3]:
            itens_categorias.append(
                f"{c.get('nome')} teve impacto relevante no período, totalizando {_fmt_brl(float(c.get('total') or 0))}."
            )

    # ── Seção 3: Insights ─────────────────────────────────────────────────────
    itens_insights = []
    for ins in (insights or [])[:3]:
        msg = ins.get("mensagem") or ins.get("titulo") or ""
        if msg:
            itens_insights.append(msg)

    # ── Seção 4: Alertas / Anomalias ──────────────────────────────────────────
    anomalias_lista = [a for a in (anomalias or []) if a.get("tipo") != "INFORMATIVO"]
    itens_alertas = []
    if anomalias_lista:
        cats_anomalias = list({a.get("categoria") for a in anomalias_lista if a.get("categoria")})
        if cats_anomalias:
            itens_alertas.append(
                f"Foram identificados gastos fora do padrão em: {', '.join(cats_anomalias[:3])}."
            )
        for a in anomalias_lista[:2]:
            msg = a.get("mensagem") or ""
            if msg and msg not in itens_alertas:
                itens_alertas.append(msg)
    else:
        itens_alertas.append("Nenhum gasto fora do padrão relevante foi identificado neste período.")

    # ── Seção 5: Score financeiro ──────────────────────────────────────────────
    score_val = int((score_financeiro or {}).get("score") or 0)
    score_class = (score_financeiro or {}).get("classificacao") or ""
    itens_score = []
    if score_val > 0:
        classe_label = {
            "EXCELENTE": "excelente saúde financeira",
            "BOA": "boa saúde financeira",
            "ATENCAO": "atenção recomendada",
            "CRITICA": "situação crítica",
        }.get(score_class.upper(), score_class)
        itens_score.append(
            f"Seu score financeiro foi {score_val}/100, classificado como {classe_label}."
        )
        msg_score = (score_financeiro or {}).get("mensagemPrincipal") or ""
        if msg_score:
            itens_score.append(msg_score)

    # ── Seção 6: Recomendações de economia ───────────────────────────────────
    economia_pot = float((recomendacoes_economia or {}).get("economiaTotalPotencial") or 0)
    cat_maior_pot = (recomendacoes_economia or {}).get("categoriaComMaiorPotencial")
    itens_recomendacoes = []
    if economia_pot > 0:
        itens_recomendacoes.append(
            f"Com pequenos ajustes, você poderia economizar cerca de {_fmt_brl(economia_pot)} neste período."
        )
        if cat_maior_pot:
            itens_recomendacoes.append(
                f"A categoria com maior potencial de economia é {cat_maior_pot}."
            )
        msg_rec = (recomendacoes_economia or {}).get("mensagemPrincipal") or ""
        if msg_rec:
            itens_recomendacoes.append(msg_rec)
    else:
        itens_recomendacoes.append("Não foram identificadas oportunidades significativas de economia neste período.")

    # ── Seção 7: Projeção ─────────────────────────────────────────────────────
    risco_neg = bool((projecao or {}).get("riscoSaldoNegativo"))
    tendencia = (projecao or {}).get("tendencia") or ""
    itens_projecao = []
    if projecao:
        if risco_neg:
            itens_projecao.append(
                "Existe risco de saldo negativo nos próximos meses se o padrão atual continuar."
            )
        elif tendencia.upper() == "POSITIVA":
            itens_projecao.append("Sua projeção financeira é positiva para os próximos meses.")
        elif tendencia.upper() in ("ATENCAO", "NEGATIVA"):
            itens_projecao.append("Sua projeção indica atenção: os gastos atuais podem comprometer os próximos meses.")
        msg_proj = (projecao or {}).get("mensagemPrincipal") or ""
        if msg_proj:
            itens_projecao.append(msg_proj)

    # ── Seção 8: Metas ────────────────────────────────────────────────────────
    itens_metas = []
    metas_ativas = [m for m in (metas or []) if m.get("status") not in ("CONCLUIDA", "CANCELADA")]
    for m in metas_ativas[:3]:
        nome_meta = m.get("nome") or "Meta"
        alvo = float(m.get("valorAlvo") or 0)
        atual = float(m.get("valorAtual") or 0)
        if alvo > 0:
            progresso = min(100, atual / alvo * 100)
            itens_metas.append(
                f"{nome_meta}: {progresso:.0f}% concluída ({_fmt_brl(atual)} de {_fmt_brl(alvo)})."
            )

    # ── Conclusão ─────────────────────────────────────────────────────────────
    conclusao_parts = []
    if saldo >= 0:
        conclusao_parts.append(f"{nome_mes} foi positivo financeiramente.")
    else:
        conclusao_parts.append(f"{nome_mes} encerrou com saldo negativo — atenção ao controle de gastos.")

    if maior_categoria:
        conclusao_parts.append(
            f"O principal ponto de atenção está na concentração de gastos em {maior_categoria}."
        )

    if economia_pot > 0:
        conclusao_parts.append(
            f"Há um potencial de economia de {_fmt_brl(economia_pot)} para o próximo mês."
        )

    if risco_neg:
        conclusao_parts.append("Atenção: existe risco de saldo negativo à frente.")
    elif tendencia.upper() == "POSITIVA":
        conclusao_parts.append("Sua perspectiva financeira para os próximos meses é positiva.")

    conclusao = " ".join(conclusao_parts) or "Acompanhe seus gastos regularmente para manter uma boa saúde financeira."

    # ── Mensagem principal ────────────────────────────────────────────────────
    if saldo >= 0 and score_val >= 70:
        mensagem_principal = f"Você encerrou {nome_mes} com saldo positivo e boa saúde financeira."
    elif saldo >= 0:
        mensagem_principal = f"Você encerrou {nome_mes} com saldo positivo."
    else:
        mensagem_principal = f"Atenção: você encerrou {nome_mes} com saldo negativo."

    # ── Montar seções ─────────────────────────────────────────────────────────
    secoes = [
        {"titulo": "Resumo do mês", "tipo": "RESUMO", "itens": itens_resumo},
    ]
    if itens_categorias:
        secoes.append({"titulo": "Principais gastos", "tipo": "CATEGORIAS", "itens": itens_categorias})
    if itens_insights:
        secoes.append({"titulo": "Destaques do período", "tipo": "INSIGHTS", "itens": itens_insights})
    if itens_alertas:
        secoes.append({"titulo": "Pontos de atenção", "tipo": "ALERTAS", "itens": itens_alertas})
    if itens_score:
        secoes.append({"titulo": "Score financeiro", "tipo": "SCORE", "itens": itens_score})
    if itens_recomendacoes:
        secoes.append({"titulo": "Recomendações de economia", "tipo": "RECOMENDACOES", "itens": itens_recomendacoes})
    if itens_projecao:
        secoes.append({"titulo": "Projeção", "tipo": "PROJECAO", "itens": itens_projecao})
    if itens_metas:
        secoes.append({"titulo": "Progresso das metas", "tipo": "METAS", "itens": itens_metas})

    classificacao_geral = _classificacao_geral(score_val, saldo, risco_neg)

    return {
        "titulo": f"Relatório financeiro de {nome_mes}",
        "subtitulo": "Resumo inteligente do seu mês financeiro.",
        "mensagemPrincipal": mensagem_principal,
        "classificacaoGeral": classificacao_geral,
        "secoes": secoes,
        "indicadores": {
            "totalReceitas": total_receitas,
            "totalDespesas": total_despesas,
            "saldo": saldo,
            "scoreFinanceiro": score_val,
            "economiaPotencial": economia_pot,
            "maiorCategoria": maior_categoria,
            "riscoSaldoNegativo": risco_neg,
        },
        "conclusao": conclusao,
    }


def _relatorio_vazio(nome_mes: str) -> dict:
    return {
        "titulo": f"Relatório financeiro de {nome_mes}",
        "subtitulo": "Ainda há poucos dados para gerar um relatório confiável.",
        "mensagemPrincipal": "Cadastre mais receitas e despesas para receber um relatório financeiro mensal.",
        "classificacaoGeral": "INFORMATIVO",
        "secoes": [
            {
                "titulo": "Poucos dados disponíveis",
                "tipo": "RESUMO",
                "itens": ["Ainda não há informações suficientes para gerar uma análise completa."],
            }
        ],
        "indicadores": {
            "totalReceitas": 0,
            "totalDespesas": 0,
            "saldo": 0,
            "scoreFinanceiro": 0,
            "economiaPotencial": 0,
            "maiorCategoria": None,
            "riscoSaldoNegativo": False,
        },
        "conclusao": "Adicione mais transações para que o Finora consiga gerar um relatório mais completo.",
    }
