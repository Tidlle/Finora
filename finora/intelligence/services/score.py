from collections import defaultdict


def calcular_score_financeiro(
    total_receitas: float,
    total_despesas: float,
    saldo: float,
    transacoes_atual: list[dict],
    metas: list[dict],
    anomalias: list[dict],
    projecao: dict | None,
) -> dict:
    if total_receitas <= 0 and total_despesas <= 0 and not transacoes_atual:
        return _sem_dados()

    pontos_fortes: list[str] = []
    pontos_atencao: list[str] = []
    componentes: list[dict] = []
    score = 0

    # ── 1. Saldo do período (até 20 pts) ─────────────────────────────────────
    if saldo > 0:
        pts_saldo = 20
        pontos_fortes.append("Saldo positivo no período analisado.")
        msg_saldo = "O saldo do período está positivo."
    elif saldo == 0:
        pts_saldo = 10
        msg_saldo = "O saldo do período está zerado."
    else:
        pts_saldo = 0
        pontos_atencao.append("Saldo negativo no período. Suas despesas superaram as receitas.")
        msg_saldo = "O saldo do período está negativo."
    score += pts_saldo
    componentes.append({"nome": "Saldo do período", "pontuacao": pts_saldo, "pontuacaoMaxima": 20, "mensagem": msg_saldo})

    # ── 2. Taxa de economia (até 25 pts) ─────────────────────────────────────
    taxa_economia = (saldo / total_receitas * 100) if total_receitas > 0 else 0.0
    if taxa_economia >= 30:
        pts_eco = 25
        pontos_fortes.append("Boa taxa de economia mensal.")
        msg_eco = "A taxa de economia está excelente (≥ 30%)."
    elif taxa_economia >= 20:
        pts_eco = 20
        pontos_fortes.append("Boa taxa de economia mensal.")
        msg_eco = "A taxa de economia está saudável (≥ 20%)."
    elif taxa_economia >= 10:
        pts_eco = 15
        msg_eco = "A taxa de economia está moderada (≥ 10%)."
    elif taxa_economia > 0:
        pts_eco = 8
        pontos_atencao.append("Sua taxa de economia está baixa. Tente reduzir despesas.")
        msg_eco = "A taxa de economia está baixa."
    else:
        pts_eco = 0
        pontos_atencao.append("Sua taxa de economia está negativa ou nula.")
        msg_eco = "Sem economia no período."
    score += pts_eco
    componentes.append({"nome": "Taxa de economia", "pontuacao": pts_eco, "pontuacaoMaxima": 25, "mensagem": msg_eco})

    # ── 3. Controle de despesas (até 20 pts) ─────────────────────────────────
    pct_desp = (total_despesas / total_receitas * 100) if total_receitas > 0 else 0.0
    if total_receitas <= 0:
        pts_ctrl = 0
        msg_ctrl = "Sem receitas para avaliar controle de despesas."
    elif pct_desp <= 50:
        pts_ctrl = 20
        pontos_fortes.append("Despesas controladas em relação às receitas.")
        msg_ctrl = "As despesas estão abaixo de 50% das receitas."
    elif pct_desp <= 70:
        pts_ctrl = 15
        msg_ctrl = "As despesas estão abaixo de 70% das receitas."
    elif pct_desp <= 90:
        pts_ctrl = 8
        pontos_atencao.append("Suas despesas estão muito próximas das suas receitas.")
        msg_ctrl = "As despesas representam mais de 70% das receitas."
    else:
        pts_ctrl = 3
        pontos_atencao.append("Suas despesas consomem quase toda sua receita.")
        msg_ctrl = "As despesas estão acima de 90% das receitas."
    score += pts_ctrl
    componentes.append({"nome": "Controle de despesas", "pontuacao": pts_ctrl, "pontuacaoMaxima": 20, "mensagem": msg_ctrl})

    # ── 4. Risco futuro / projeção (até 15 pts) ──────────────────────────────
    risco_saldo_negativo = False
    if projecao:
        risco_saldo_negativo = bool(projecao.get("riscoSaldoNegativo", False))
        if risco_saldo_negativo:
            pts_proj = 0
            pontos_atencao.append("Existe risco de saldo negativo nos próximos meses.")
            msg_proj = "Há risco de saldo negativo na projeção futura."
        else:
            pts_proj = 15
            pontos_fortes.append("Sem risco de saldo negativo nas projeções.")
            msg_proj = "Não há risco de saldo negativo na projeção."
    else:
        pts_proj = 8
        msg_proj = "Dados de projeção não disponíveis."
    score += pts_proj
    componentes.append({"nome": "Risco futuro", "pontuacao": pts_proj, "pontuacaoMaxima": 15, "mensagem": msg_proj})

    # ── 5. Metas financeiras (até 10 pts) ────────────────────────────────────
    metas_ativas = [m for m in metas if (m.get("valorAlvo") or 0) > 0 and m.get("status") != "CONCLUIDA"]
    qtd_metas = len(metas_ativas)
    progressos = []
    for m in metas_ativas:
        alvo = float(m.get("valorAlvo") or 0)
        atual = float(m.get("valorAtual") or 0)
        if alvo > 0:
            progressos.append(min(atual / alvo * 100, 100))
    progresso_medio = (sum(progressos) / len(progressos)) if progressos else 0.0

    if qtd_metas == 0:
        pts_metas = 3
        pontos_atencao.append("Não há metas financeiras cadastradas.")
        msg_metas = "Nenhuma meta financeira ativa."
    elif progresso_medio >= 50:
        pts_metas = 10
        pontos_fortes.append("Você possui metas financeiras com bom progresso.")
        msg_metas = "Metas ativas com progresso médio acima de 50%."
    elif progresso_medio > 0:
        pts_metas = 8
        pontos_fortes.append("Você possui metas financeiras em andamento.")
        msg_metas = "Metas ativas com progresso positivo."
    else:
        pts_metas = 5
        msg_metas = "Metas ativas sem progresso registrado."
    score += pts_metas
    componentes.append({"nome": "Metas financeiras", "pontuacao": pts_metas, "pontuacaoMaxima": 10, "mensagem": msg_metas})

    # ── 6. Anomalias e concentração (até 10 pts) ─────────────────────────────
    pts_anom = 10
    tem_alta = any((a.get("severidade") or "").upper() == "ALTA" for a in anomalias)
    tem_media = any((a.get("severidade") or "").upper() == "MEDIA" for a in anomalias)
    if tem_alta:
        pts_anom -= 5
        pontos_atencao.append("Foi identificada ao menos uma despesa fora do padrão com alta severidade.")
    elif tem_media:
        pts_anom -= 3

    # Concentração da maior categoria
    por_cat: dict[str, float] = defaultdict(float)
    for t in transacoes_atual:
        if (t.get("tipo") or "").upper() == "DESPESA":
            cat = (t.get("categoria") or "Outros").strip() or "Outros"
            por_cat[cat] += float(t.get("valor") or 0)

    maior_cat = None
    pct_maior_cat = 0.0
    if por_cat and total_despesas > 0:
        maior_cat, val_maior = max(por_cat.items(), key=lambda x: x[1])
        pct_maior_cat = round(val_maior / total_despesas * 100, 1)
        if pct_maior_cat > 50:
            pts_anom -= 2
            pontos_atencao.append(f"{maior_cat} concentra mais de 50% das despesas.")
        elif pct_maior_cat > 40:
            pts_anom -= 1
            pontos_atencao.append(f"{maior_cat} representa uma parte alta das despesas.")

    pts_anom = max(pts_anom, 0)
    score += pts_anom
    msg_anom = "Sem anomalias ou concentração relevante detectadas." if pts_anom == 10 else "Foram detectadas anomalias ou concentração de gastos."
    componentes.append({"nome": "Anomalias e concentração", "pontuacao": pts_anom, "pontuacaoMaxima": 10, "mensagem": msg_anom})

    # ── Score final ───────────────────────────────────────────────────────────
    score = max(0, min(100, score))

    if score >= 80:
        classificacao = "EXCELENTE"
        msg_principal = "Sua saúde financeira está excelente. Você possui boa margem de economia e baixo risco financeiro."
    elif score >= 60:
        classificacao = "BOA"
        msg_principal = "Sua saúde financeira está boa. Você mantém equilíbrio entre receitas, despesas e economia."
    elif score >= 40:
        classificacao = "ATENCAO"
        msg_principal = "Sua saúde financeira está em atenção. Existem pontos importantes para melhorar."
    else:
        classificacao = "CRITICA"
        msg_principal = "Sua saúde financeira exige atenção. As despesas estão comprometendo sua estabilidade."

    return {
        "score": score,
        "classificacao": classificacao,
        "mensagemPrincipal": msg_principal,
        "pontosFortes": pontos_fortes[:4],
        "pontosAtencao": pontos_atencao[:4],
        "indicadores": {
            "taxaEconomia": round(taxa_economia, 2),
            "percentualDespesasSobreReceitas": round(pct_desp, 2),
            "saldoMedioMensal": round(saldo, 2),
            "riscoSaldoNegativo": risco_saldo_negativo,
            "quantidadeAnomalias": len(anomalias),
            "maiorCategoriaDespesa": maior_cat,
            "percentualMaiorCategoria": pct_maior_cat,
            "metasAtivas": qtd_metas,
            "progressoMedioMetas": round(progresso_medio, 2),
        },
        "componentes": componentes,
    }


def _sem_dados() -> dict:
    return {
        "score": 0,
        "classificacao": "ATENCAO",
        "mensagemPrincipal": "Ainda há poucos dados para calcular sua saúde financeira com precisão.",
        "pontosFortes": [],
        "pontosAtencao": ["Cadastre mais receitas e despesas para receber uma análise mais confiável."],
        "indicadores": {
            "taxaEconomia": 0.0,
            "percentualDespesasSobreReceitas": 0.0,
            "saldoMedioMensal": 0.0,
            "riscoSaldoNegativo": False,
            "quantidadeAnomalias": 0,
            "maiorCategoriaDespesa": None,
            "percentualMaiorCategoria": 0.0,
            "metasAtivas": 0,
            "progressoMedioMetas": 0.0,
        },
        "componentes": [],
    }
