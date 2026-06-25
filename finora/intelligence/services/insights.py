from typing import Optional


def _fmt(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def gerar_insights(
    transacoes_atual: list[dict],
    transacoes_anterior: list[dict],
    periodo_atual: dict,
    periodo_anterior: dict,
) -> dict:
    # ── totais ──────────────────────────────────────────────────────────────
    def totais(txs: list[dict]) -> tuple[float, float, dict[str, float]]:
        receitas = sum(t["valor"] for t in txs if t.get("tipo") == "RECEITA")
        despesas = sum(t["valor"] for t in txs if t.get("tipo") == "DESPESA")
        por_cat: dict[str, float] = {}
        for t in txs:
            if t.get("tipo") == "DESPESA":
                cat = t.get("categoria") or "Sem categoria"
                por_cat[cat] = por_cat.get(cat, 0.0) + t["valor"]
        return receitas, despesas, por_cat

    rec_a, dep_a, cats_a = totais(transacoes_atual)
    rec_p, dep_p, cats_p = totais(transacoes_anterior)

    insights: list[dict] = []

    # ── poucos dados ─────────────────────────────────────────────────────────
    if len(transacoes_atual) < 2:
        insights.append({
            "tipo": "INFORMATIVO",
            "titulo": "Dados insuficientes",
            "mensagem": "Ainda há poucos dados para gerar análises completas. Cadastre mais transações para receber insights melhores.",
            "prioridade": "BAIXA",
        })
        return {
            "insights": insights,
            "resumo": {
                "totalReceitas": rec_a,
                "totalDespesas": dep_a,
                "saldo": rec_a - dep_a,
                "maiorCategoriaDespesa": None,
            },
        }

    saldo = rec_a - dep_a

    # ── saldo do período ──────────────────────────────────────────────────────
    if saldo > 0:
        insights.append({
            "tipo": "POSITIVO",
            "titulo": "Saldo positivo no período",
            "mensagem": f"Você teve saldo positivo de {_fmt(saldo)} neste período.",
            "prioridade": "ALTA",
        })
    elif saldo < 0:
        insights.append({
            "tipo": "NEGATIVO",
            "titulo": "Despesas superaram receitas",
            "mensagem": f"Suas despesas superaram suas receitas em {_fmt(abs(saldo))} neste período.",
            "prioridade": "ALTA",
        })

    # ── relação receitas × despesas ───────────────────────────────────────────
    if rec_a > 0 and dep_a > 0:
        pct_consumido = (dep_a / rec_a) * 100
        if pct_consumido <= 70:
            insights.append({
                "tipo": "POSITIVO",
                "titulo": "Boa relação receitas vs despesas",
                "mensagem": f"Suas despesas consumiram {pct_consumido:.0f}% das suas receitas no período.",
                "prioridade": "MEDIA",
            })
        elif pct_consumido <= 90:
            insights.append({
                "tipo": "ALERTA",
                "titulo": "Atenção às despesas",
                "mensagem": f"Suas despesas consumiram {pct_consumido:.0f}% das suas receitas no período.",
                "prioridade": "MEDIA",
            })
        else:
            insights.append({
                "tipo": "NEGATIVO",
                "titulo": "Despesas muito elevadas",
                "mensagem": f"Suas despesas representaram {pct_consumido:.0f}% das suas receitas — acima do ideal.",
                "prioridade": "ALTA",
            })

    # ── maior categoria de despesa ─────────────────────────────────────────────
    maior_cat: Optional[str] = None
    if cats_a:
        maior_cat = max(cats_a, key=lambda k: cats_a[k])
        valor_maior = cats_a[maior_cat]
        pct_cat = (valor_maior / dep_a * 100) if dep_a > 0 else 0
        insights.append({
            "tipo": "INFORMATIVO",
            "titulo": f"Maior gasto em {maior_cat}",
            "mensagem": f"{maior_cat} representou {pct_cat:.0f}% das suas despesas ({_fmt(valor_maior)}) no período.",
            "prioridade": "MEDIA",
        })

    # ── comparação com período anterior ──────────────────────────────────────
    if transacoes_anterior:
        if rec_p > 0 and rec_a > 0:
            diff_rec = ((rec_a - rec_p) / rec_p) * 100
            if abs(diff_rec) >= 5:
                tipo = "POSITIVO" if diff_rec > 0 else "ALERTA"
                verbo = "aumentaram" if diff_rec > 0 else "diminuíram"
                insights.append({
                    "tipo": tipo,
                    "titulo": f"Receitas {verbo} em relação ao período anterior",
                    "mensagem": f"Suas receitas {verbo} {abs(diff_rec):.0f}% em relação ao período anterior.",
                    "prioridade": "MEDIA",
                })

        if dep_p > 0 and dep_a > 0:
            diff_dep = ((dep_a - dep_p) / dep_p) * 100
            if abs(diff_dep) >= 5:
                tipo = "ALERTA" if diff_dep > 0 else "POSITIVO"
                verbo = "aumentaram" if diff_dep > 0 else "diminuíram"
                insights.append({
                    "tipo": tipo,
                    "titulo": f"Despesas {verbo}",
                    "mensagem": f"Suas despesas {verbo} {abs(diff_dep):.0f}% em relação ao período anterior.",
                    "prioridade": "MEDIA",
                })

        # Categorias em crescimento
        for cat, val_a in cats_a.items():
            val_p = cats_p.get(cat, 0.0)
            if val_p > 0:
                crescimento = ((val_a - val_p) / val_p) * 100
                if crescimento >= 20:
                    insights.append({
                        "tipo": "ALERTA",
                        "titulo": f"Aumento em {cat}",
                        "mensagem": f"Seus gastos com {cat} aumentaram {crescimento:.0f}% em relação ao período anterior.",
                        "prioridade": "MEDIA",
                    })

    # ── economia acumulada ─────────────────────────────────────────────────────
    if saldo > 0 and rec_a > 0:
        pct_poupado = (saldo / rec_a) * 100
        if pct_poupado >= 10:
            insights.append({
                "tipo": "POSITIVO",
                "titulo": "Boa taxa de poupança",
                "mensagem": f"Você economizou {_fmt(saldo)} ({pct_poupado:.0f}% das receitas) neste período.",
                "prioridade": "BAIXA",
            })

    # Limita a 6 insights para não poluir o Dashboard
    insights = insights[:6]

    return {
        "insights": insights,
        "resumo": {
            "totalReceitas": rec_a,
            "totalDespesas": dep_a,
            "saldo": saldo,
            "maiorCategoriaDespesa": maior_cat,
        },
    }
