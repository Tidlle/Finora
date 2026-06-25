from statistics import mean, stdev
from typing import Optional


def _fmt(valor: float) -> str:
    # Format Brazilian currency: 1234.56 → "R$ 1.234,56"
    s = f"{valor:_.2f}"          # "1_234.56"
    inteiro, decimais = s.split(".")
    inteiro = inteiro.replace("_", ".")
    return f"R$ {inteiro},{decimais}"


def detectar_anomalias(
    transacoes_atual: list[dict],
    transacoes_referencia: list[dict],
    periodo_atual: dict,
    periodo_referencia: dict,
) -> dict:
    despesas_atual = [t for t in transacoes_atual if t.get("tipo") == "DESPESA" and (t.get("valor") or 0) > 0]
    despesas_ref = [t for t in transacoes_referencia if t.get("tipo") == "DESPESA" and (t.get("valor") or 0) > 0]

    anomalias: list[dict] = []

    if not despesas_atual:
        return _resposta_sem_dados("Nenhuma despesa registrada no período para análise.")

    # ── Calcular duração dos períodos para normalizar para mensal ─────────────
    meses_ref = _meses_no_periodo(periodo_referencia)

    # ── Agrupar despesas por categoria ────────────────────────────────────────
    por_cat_atual: dict[str, list[float]] = {}
    for t in despesas_atual:
        cat = t.get("categoria") or "Sem categoria"
        por_cat_atual.setdefault(cat, []).append(float(t["valor"]))

    por_cat_ref: dict[str, list[float]] = {}
    for t in despesas_ref:
        cat = t.get("categoria") or "Sem categoria"
        por_cat_ref.setdefault(cat, []).append(float(t["valor"]))

    total_atual = sum(v for vals in por_cat_atual.values() for v in vals)
    total_ref = sum(v for vals in por_cat_ref.values() for v in vals)
    media_mensal_ref = (total_ref / meses_ref) if meses_ref > 0 else 0.0

    # 1. Transação individual incomum ─────────────────────────────────────────
    for t in despesas_atual:
        cat = t.get("categoria") or "Sem categoria"
        valor = float(t["valor"])
        vals_ref = por_cat_ref.get(cat, [])

        if len(vals_ref) >= 2:
            media = mean(vals_ref)
            dp = stdev(vals_ref)
            limiar = max(media + 2 * dp, media * 2.5)
        elif len(vals_ref) == 1:
            media = vals_ref[0]
            limiar = media * 2.5
        else:
            # sem histórico: usa 3× a média geral de referência por transação
            if total_ref > 0 and len(despesas_ref) > 0:
                media_tx_ref = total_ref / len(despesas_ref)
                limiar = media_tx_ref * 4
                media = media_tx_ref
            else:
                continue  # sem histórico nenhum, pula

        if valor >= limiar and media > 0:
            pct = round((valor / media - 1) * 100, 1)
            severidade = "ALTA" if pct >= 200 else ("MEDIA" if pct >= 100 else "BAIXA")
            anomalias.append({
                "tipo": "TRANSACAO_INCOMUM",
                "categoria": cat,
                "descricao": t.get("descricao"),
                "valor": valor,
                "mensagem": f"Esta despesa em {cat} ({_fmt(valor)}) está {pct:.0f}% acima do padrão dos últimos meses.",
                "severidade": severidade,
                "percentualAcimaMedia": pct,
            })

    # 2. Categoria com aumento relevante ─────────────────────────────────────
    for cat, vals_atual in por_cat_atual.items():
        total_cat_atual = sum(vals_atual)
        vals_ref = por_cat_ref.get(cat, [])
        if not vals_ref:
            continue
        media_mensal_cat_ref = sum(vals_ref) / meses_ref if meses_ref > 0 else sum(vals_ref)
        if media_mensal_cat_ref <= 0:
            continue
        pct = round((total_cat_atual / media_mensal_cat_ref - 1) * 100, 1)
        if pct >= 30:
            severidade = "ALTA" if pct >= 100 else ("MEDIA" if pct >= 50 else "BAIXA")
            # evitar duplicar com TRANSACAO_INCOMUM se a categoria já foi reportada individualmente
            ja_reportada = any(
                a["tipo"] == "TRANSACAO_INCOMUM" and a["categoria"] == cat and a["severidade"] == "ALTA"
                for a in anomalias
            )
            if not ja_reportada:
                anomalias.append({
                    "tipo": "CATEGORIA_EM_ALTA",
                    "categoria": cat,
                    "descricao": None,
                    "valor": total_cat_atual,
                    "mensagem": f"Os gastos com {cat} aumentaram {pct:.0f}% em relação à média do período de referência.",
                    "severidade": severidade,
                    "percentualAcimaMedia": pct,
                })

    # 3. Gasto total acima da média ────────────────────────────────────────────
    if media_mensal_ref > 0:
        pct_total = round((total_atual / media_mensal_ref - 1) * 100, 1)
        if pct_total >= 25:
            severidade = "ALTA" if pct_total >= 75 else ("MEDIA" if pct_total >= 40 else "BAIXA")
            anomalias.append({
                "tipo": "GASTO_ACIMA_DA_MEDIA",
                "categoria": None,
                "descricao": None,
                "valor": total_atual,
                "mensagem": f"Seu total de despesas ({_fmt(total_atual)}) está {pct_total:.0f}% acima da média mensal do período de referência ({_fmt(media_mensal_ref)}).",
                "severidade": severidade,
                "percentualAcimaMedia": pct_total,
            })

    # 4. Concentração de gastos ────────────────────────────────────────────────
    if total_atual > 0:
        for cat, vals in por_cat_atual.items():
            pct_conc = round(sum(vals) / total_atual * 100, 1)
            if pct_conc >= 50:
                anomalias.append({
                    "tipo": "CONCENTRACAO_DE_GASTOS",
                    "categoria": cat,
                    "descricao": None,
                    "valor": sum(vals),
                    "mensagem": f"A categoria {cat} representa {pct_conc:.0f}% das suas despesas totais no período.",
                    "severidade": "MEDIA",
                    "percentualAcimaMedia": pct_conc,
                })

    # ── Deduplica e limita ────────────────────────────────────────────────────
    anomalias = _deduplicar(anomalias)

    if not anomalias:
        if not despesas_ref:
            return _resposta_sem_dados(
                "Ainda há poucos dados históricos para identificar gastos fora do padrão com precisão."
            )
        anomalias = [{
            "tipo": "INFORMATIVO",
            "categoria": None,
            "descricao": None,
            "valor": None,
            "mensagem": "Seus gastos estão dentro do padrão habitual. Continue assim!",
            "severidade": "BAIXA",
            "percentualAcimaMedia": None,
        }]

    altas = sum(1 for a in anomalias if a["severidade"] == "ALTA" and a["tipo"] != "INFORMATIVO")
    categorias_criticas = [a["categoria"] for a in anomalias if a["categoria"] and a["severidade"] == "ALTA"]
    categoria_mais_critica = categorias_criticas[0] if categorias_criticas else (
        max(por_cat_atual, key=lambda c: sum(por_cat_atual[c])) if por_cat_atual else None
    )
    total_nao_info = sum(1 for a in anomalias if a["tipo"] != "INFORMATIVO")

    return {
        "anomalias": anomalias,
        "resumo": {
            "totalAnomalias": total_nao_info,
            "anomaliasAltaSeveridade": altas,
            "categoriaMaisCritica": categoria_mais_critica,
        },
    }


def _meses_no_periodo(periodo: dict) -> float:
    try:
        from datetime import date
        ini = date.fromisoformat(periodo.get("dataInicial", ""))
        fim = date.fromisoformat(periodo.get("dataFinal", ""))
        dias = (fim - ini).days + 1
        return max(dias / 30, 1.0)
    except Exception:
        return 1.0


def _deduplicar(anomalias: list[dict]) -> list[dict]:
    vistos: set[tuple] = set()
    resultado: list[dict] = []
    # ordena por severidade: ALTA > MEDIA > BAIXA
    ordem = {"ALTA": 0, "MEDIA": 1, "BAIXA": 2}
    anomalias.sort(key=lambda a: ordem.get(a.get("severidade", "BAIXA"), 3))
    for a in anomalias:
        chave = (a["tipo"], a.get("categoria"))
        if chave not in vistos:
            vistos.add(chave)
            resultado.append(a)
    return resultado[:8]


def _resposta_sem_dados(msg: str) -> dict:
    return {
        "anomalias": [{
            "tipo": "INFORMATIVO",
            "categoria": None,
            "descricao": None,
            "valor": None,
            "mensagem": msg,
            "severidade": "BAIXA",
            "percentualAcimaMedia": None,
        }],
        "resumo": {
            "totalAnomalias": 0,
            "anomaliasAltaSeveridade": 0,
            "categoriaMaisCritica": None,
        },
    }
