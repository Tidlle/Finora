from collections import defaultdict


def sugerir_economias(
    transacoes_atual: list[dict],
    transacoes_anterior: list[dict],
    total_receitas: float,
    total_despesas: float,
) -> dict:
    despesas_atual = [t for t in transacoes_atual if (t.get("tipo") or "").upper() == "DESPESA" and (t.get("valor") or 0) > 0]

    if not despesas_atual or total_despesas <= 0:
        return _sem_dados()

    # Agrupar por categoria
    por_cat: dict[str, float] = defaultdict(float)
    for t in despesas_atual:
        cat = (t.get("categoria") or "Outros").strip() or "Outros"
        por_cat[cat] += float(t.get("valor") or 0)

    # Período anterior por categoria
    por_cat_ant: dict[str, float] = defaultdict(float)
    for t in transacoes_anterior:
        if (t.get("tipo") or "").upper() != "DESPESA":
            continue
        cat = (t.get("categoria") or "Outros").strip() or "Outros"
        por_cat_ant[cat] += float(t.get("valor") or 0)

    categorias_ord = sorted(por_cat.items(), key=lambda x: x[1], reverse=True)

    recomendacoes: list[dict] = []
    tipos_usados: set[str] = set()
    economia_total = 0.0

    # 1. Maior oportunidade (primeira categoria)
    cat_maior, val_maior = categorias_ord[0]
    pct_maior = round((val_maior / total_despesas) * 100, 1)
    eco_maior = round(val_maior * 0.10, 2)
    recomendacoes.append({
        "tipo": "MAIOR_OPORTUNIDADE",
        "categoria": cat_maior,
        "titulo": "Maior oportunidade de economia",
        "mensagem": (
            f"{cat_maior} é sua maior categoria de despesa, representando {pct_maior}% dos gastos do período. "
            f"Reduzindo 10%, você economizaria cerca de R$ {eco_maior:,.2f}.".replace(",", "X").replace(".", ",").replace("X", ".")
        ),
        "economiaEstimada": eco_maior,
        "percentualReducaoSugerido": 10,
        "percentualDaDespesaTotal": pct_maior,
        "prioridade": "ALTA",
    })
    tipos_usados.add("MAIOR_OPORTUNIDADE")
    economia_total += eco_maior

    # 2. Concentração de gastos (> 40%)
    if pct_maior > 40 and "CONCENTRACAO_DE_GASTOS" not in tipos_usados:
        recomendacoes.append({
            "tipo": "CONCENTRACAO_DE_GASTOS",
            "categoria": cat_maior,
            "titulo": f"Concentração de gastos em {cat_maior}",
            "mensagem": (
                f"{cat_maior} concentra {pct_maior}% das suas despesas. "
                "Isso pode limitar sua margem de economia mensal."
            ),
            "economiaEstimada": 0.0,
            "percentualReducaoSugerido": 0,
            "percentualDaDespesaTotal": pct_maior,
            "prioridade": "ALTA",
        })
        tipos_usados.add("CONCENTRACAO_DE_GASTOS")

    # 3. Demais categorias relevantes (>=10% ou top 4)
    for cat, val in categorias_ord[1:4]:
        if cat == cat_maior:
            continue
        pct = round((val / total_despesas) * 100, 1)
        pct_red = 15 if pct < 20 else 10
        eco = round(val * pct_red / 100, 2)

        # Crescimento em relação ao período anterior?
        val_ant = por_cat_ant.get(cat, 0)
        cresceu = val_ant > 0 and (val - val_ant) / val_ant > 0.20

        if cresceu and "CATEGORIA_EM_CRESCIMENTO" not in tipos_usados:
            pct_cresc = round(((val - val_ant) / val_ant) * 100, 1)
            recomendacoes.append({
                "tipo": "CATEGORIA_EM_CRESCIMENTO",
                "categoria": cat,
                "titulo": f"{cat} em crescimento",
                "mensagem": (
                    f"Os gastos com {cat} cresceram {pct_cresc}% em relação ao período anterior. "
                    "Vale revisar se foi um gasto pontual ou recorrente."
                ),
                "economiaEstimada": eco,
                "percentualReducaoSugerido": pct_red,
                "percentualDaDespesaTotal": pct,
                "prioridade": "MEDIA",
            })
            tipos_usados.add("CATEGORIA_EM_CRESCIMENTO")
            economia_total += eco
        elif pct >= 10:
            recomendacoes.append({
                "tipo": "REDUCAO_CATEGORIA",
                "categoria": cat,
                "titulo": f"Economia possível em {cat}",
                "mensagem": (
                    f"Reduzindo {pct_red}% dos gastos com {cat}, você economizaria cerca de "
                    f"R$ {eco:,.2f} no período.".replace(",", "X").replace(".", ",").replace("X", ".")
                ),
                "economiaEstimada": eco,
                "percentualReducaoSugerido": pct_red,
                "percentualDaDespesaTotal": pct,
                "prioridade": "MEDIA" if pct < 30 else "ALTA",
            })
            economia_total += eco

    # 4. Categorias do período anterior que cresceram e ainda não foram listadas
    for cat, val_ant in por_cat_ant.items():
        if cat not in por_cat or cat == cat_maior:
            continue
        val = por_cat[cat]
        if val_ant > 0 and (val - val_ant) / val_ant > 0.20:
            if "CATEGORIA_EM_CRESCIMENTO" not in tipos_usados:
                pct_cresc = round(((val - val_ant) / val_ant) * 100, 1)
                pct = round((val / total_despesas) * 100, 1)
                eco = round(val * 0.10, 2)
                recomendacoes.append({
                    "tipo": "CATEGORIA_EM_CRESCIMENTO",
                    "categoria": cat,
                    "titulo": f"{cat} em crescimento",
                    "mensagem": (
                        f"Os gastos com {cat} cresceram {pct_cresc}% em relação ao período anterior. "
                        "Vale revisar se foi um gasto pontual ou recorrente."
                    ),
                    "economiaEstimada": eco,
                    "percentualReducaoSugerido": 10,
                    "percentualDaDespesaTotal": pct,
                    "prioridade": "MEDIA",
                })
                tipos_usados.add("CATEGORIA_EM_CRESCIMENTO")
                economia_total += eco

    economia_total = round(economia_total, 2)
    pct_eco_sobre_desp = round((economia_total / total_despesas) * 100, 1) if total_despesas > 0 else 0.0
    cat_maior_pot = recomendacoes[0]["categoria"] if recomendacoes else None

    if economia_total > 0:
        msg_principal = "Você pode aumentar seu saldo reduzindo pequenas porcentagens nas maiores categorias de despesa."
    else:
        msg_principal = "Pequenos ajustes nas suas maiores categorias podem gerar economia relevante no período."

    return {
        "recomendacoes": recomendacoes,
        "resumo": {
            "economiaTotalPotencial": economia_total,
            "categoriaComMaiorPotencial": cat_maior_pot,
            "percentualEconomiaSobreDespesas": pct_eco_sobre_desp,
            "mensagemPrincipal": msg_principal,
        },
    }


def _sem_dados() -> dict:
    return {
        "recomendacoes": [
            {
                "tipo": "INFORMATIVO",
                "categoria": None,
                "titulo": "Poucos dados disponíveis",
                "mensagem": "Ainda há poucos dados para gerar recomendações de economia confiáveis. Cadastre mais despesas para receber sugestões melhores.",
                "economiaEstimada": 0.0,
                "percentualReducaoSugerido": 0,
                "percentualDaDespesaTotal": 0.0,
                "prioridade": "BAIXA",
            }
        ],
        "resumo": {
            "economiaTotalPotencial": 0.0,
            "categoriaComMaiorPotencial": None,
            "percentualEconomiaSobreDespesas": 0.0,
            "mensagemPrincipal": "Cadastre mais despesas para que o Finora consiga sugerir oportunidades de economia.",
        },
    }
