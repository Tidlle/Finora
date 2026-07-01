import re
import unicodedata

SUGESTOES_PADRAO = [
    "Qual foi meu saldo este mês?",
    "Onde gastei mais?",
    "Como posso economizar?",
    "Como está minha saúde financeira?",
    "Tive algum gasto fora do padrão?",
    "Quando vou atingir minha meta?",
    "Faça um resumo do meu mês.",
]


def _normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w\s]", " ", sem_acento.lower()).strip()


def _fmt_brl(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _nome_mes(mes_str: str) -> str:
    MESES = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
             "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    try:
        partes = mes_str.split("-")
        return f"{MESES[int(partes[1])]} de {partes[0]}"
    except Exception:
        return mes_str


def _resposta(resposta: str, tipo: str, confianca: float,
              dados: dict | None = None, sugestoes: list[str] | None = None) -> dict:
    return {
        "resposta": resposta,
        "tipoResposta": tipo,
        "confianca": confianca,
        "dadosRelacionados": dados or {},
        "sugestoesPerguntas": sugestoes or SUGESTOES_PADRAO,
    }


# ── Detectores de intenção ────────────────────────────────────────────────────

def _detectar_resumo(q: str) -> bool:
    return any(p in q for p in ["resumo", "como foi meu mes", "como foi o mes",
                                 "me conta como", "balanço", "balanco", "relatorio"])


def _detectar_saldo(q: str) -> bool:
    return any(p in q for p in ["saldo", "sobrou", "ficou", "positivo", "negativo",
                                 "quanto tenho", "quanto sobrou", "resultado"])


def _detectar_receitas(q: str) -> bool:
    return any(p in q for p in ["receita", "recebi", "ganhei", "entrou", "entrada",
                                 "salario", "salário", "renda"])


def _detectar_despesas_total(q: str) -> bool:
    return any(p in q for p in ["despesa total", "gastei no total", "total de gasto",
                                 "quanto gastei", "total gasto", "gasto total",
                                 "despesas estao", "despesas estão"])


def _detectar_maior_categoria(q: str) -> bool:
    return any(p in q for p in ["maior gasto", "maior categoria", "onde gastei mais",
                                 "maior despesa", "mais gastei", "gastei mais"])


def _detectar_economia(q: str) -> bool:
    return any(p in q for p in ["economiz", "reduzir", "cortar", "poupar",
                                 "onde posso", "o que devo reduzir", "dicas"])


def _detectar_score(q: str) -> bool:
    return any(p in q for p in ["score", "saude financeira", "saúde financeira",
                                 "vida financeira", "situacao financeira",
                                 "situação financeira", "financeiramente"])


def _detectar_anomalia(q: str) -> bool:
    return any(p in q for p in ["anomalia", "fora do padrao", "fora do padrão",
                                 "gasto incomum", "algo chamou", "atencao", "atenção",
                                 "incomum", "estranh"])


def _detectar_projecao(q: str) -> bool:
    return any(p in q for p in ["projecao", "projeção", "futuro", "proximos meses",
                                 "próximos meses", "risco", "tendencia", "tendência",
                                 "previsao", "previsão"])


def _detectar_metas(q: str) -> bool:
    return any(p in q for p in ["meta", "objetivo", "reserva", "quando vou atingir",
                                 "quanto falta", "progresso", "sonho"])


def _detectar_categoria_especifica(q: str, categorias: list[dict]) -> dict | None:
    """Retorna a categoria se o nome dela aparecer na pergunta."""
    for cat in categorias:
        nome = _normalizar(cat.get("nome") or "")
        if nome and nome in q:
            return cat
    return None


# ── Handlers ──────────────────────────────────────────────────────────────────

def _handle_categoria(cat: dict, periodo_str: str) -> dict:
    nome = cat.get("nome", "")
    total = float(cat.get("total") or 0)
    pct = float(cat.get("percentual") or 0)
    if total == 0:
        return _resposta(
            f"Não encontrei gastos com {nome} em {periodo_str}.",
            "CATEGORIA", 0.7,
            {"categoria": nome, "valor": 0, "periodo": periodo_str},
            ["Onde gastei mais?", "Qual foi meu saldo?", "Faça um resumo do meu mês."],
        )
    return _resposta(
        f"Em {periodo_str}, você gastou {_fmt_brl(total)} com {nome}, "
        f"o que representa {pct:.1f}% das suas despesas do período.",
        "CATEGORIA", 0.92,
        {"categoria": nome, "valor": total, "percentual": pct, "periodo": periodo_str},
        ["Qual foi minha maior categoria de gasto?", "Como posso economizar?", "Qual foi meu saldo?"],
    )


def _handle_maior_categoria(categorias: list[dict], periodo_str: str) -> dict:
    despesas = [c for c in categorias if (c.get("tipo") or "").upper() == "DESPESA"]
    if not despesas:
        return _resposta(
            f"Não encontrei despesas registradas em {periodo_str}.",
            "CATEGORIA", 0.6, {}, SUGESTOES_PADRAO,
        )
    top = max(despesas, key=lambda c: float(c.get("total") or 0))
    nome = top.get("nome", "")
    total = float(top.get("total") or 0)
    pct = float(top.get("percentual") or 0)
    return _resposta(
        f"Sua maior categoria de gasto em {periodo_str} foi {nome}, "
        f"com {_fmt_brl(total)}, representando {pct:.1f}% das despesas.",
        "CATEGORIA", 0.9,
        {"categoria": nome, "valor": total, "percentual": pct},
        ["Como posso economizar?", "Qual foi meu saldo?", "Como está minha saúde financeira?"],
    )


def _handle_saldo(resumo: dict, periodo_str: str) -> dict:
    saldo = float(resumo.get("saldo") or 0)
    if saldo > 0:
        texto = f"Seu saldo em {periodo_str} foi positivo: {_fmt_brl(saldo)}. Ótimo trabalho!"
    elif saldo < 0:
        texto = f"Seu saldo em {periodo_str} foi negativo: {_fmt_brl(abs(saldo))}. Fique atento aos gastos."
    else:
        texto = f"Seu saldo em {periodo_str} foi zerado. Receitas e despesas se equilibraram."
    return _resposta(texto, "SALDO", 0.95,
                     {"saldo": saldo, "periodo": periodo_str},
                     ["Onde gastei mais?", "Como posso economizar?", "Faça um resumo do meu mês."])


def _handle_receitas(resumo: dict, periodo_str: str) -> dict:
    total = float(resumo.get("totalReceitas") or 0)
    return _resposta(
        f"Suas receitas em {periodo_str} somaram {_fmt_brl(total)}.",
        "RECEITAS", 0.93,
        {"totalReceitas": total, "periodo": periodo_str},
        ["Qual foi meu saldo?", "Quanto gastei no total?", "Faça um resumo do meu mês."],
    )


def _handle_despesas(resumo: dict, periodo_str: str) -> dict:
    total_desp = float(resumo.get("totalDespesas") or 0)
    total_rec = float(resumo.get("totalReceitas") or 0)
    pct = (total_desp / total_rec * 100) if total_rec > 0 else 0
    texto = f"Suas despesas em {periodo_str} somaram {_fmt_brl(total_desp)}"
    if pct > 0:
        texto += f", o que representa {pct:.1f}% das suas receitas."
    else:
        texto += "."
    return _resposta(texto, "DESPESAS", 0.93,
                     {"totalDespesas": total_desp, "percentualSobreReceitas": round(pct, 2)},
                     ["Onde gastei mais?", "Como posso economizar?", "Qual foi meu saldo?"])


def _handle_economia(rec: dict | None) -> dict:
    if not rec:
        return _resposta(
            "Não há recomendações de economia disponíveis para este período.",
            "ECONOMIA", 0.5, {},
            ["Onde gastei mais?", "Qual foi meu saldo?", "Como está minha saúde financeira?"],
        )
    pot = float(rec.get("economiaTotalPotencial") or 0)
    cat = rec.get("categoriaComMaiorPotencial") or ""
    msg = rec.get("mensagemPrincipal") or ""
    if pot > 0 and cat:
        texto = (f"Sua maior oportunidade de economia está em {cat}. "
                 f"Reduzindo pequenas porcentagens nas maiores categorias, "
                 f"você poderia economizar cerca de {_fmt_brl(pot)} no período.")
    elif msg:
        texto = msg
    else:
        texto = "Não há oportunidades significativas de economia identificadas neste período."
    return _resposta(texto, "ECONOMIA", 0.88,
                     {"economiaPotencial": pot, "categoriaComMaiorPotencial": cat},
                     ["Onde gastei mais?", "Qual foi meu saldo?", "Como está minha saúde financeira?"])


def _handle_score(score_data: dict | None) -> dict:
    if not score_data or not score_data.get("score"):
        return _resposta(
            "Não há dados suficientes para calcular seu score financeiro agora.",
            "SCORE", 0.5, {},
            ["Qual foi meu saldo?", "Onde gastei mais?", "Faça um resumo do meu mês."],
        )
    score = int(score_data.get("score") or 0)
    classe = score_data.get("classificacao") or ""
    msg = score_data.get("mensagemPrincipal") or ""
    LABELS = {"EXCELENTE": "excelente", "BOA": "boa", "ATENCAO": "com atenção necessária", "CRITICA": "crítica"}
    label = LABELS.get(classe.upper(), classe)
    texto = f"Seu score financeiro é {score}/100, classificado como {label}."
    if msg:
        texto += f" {msg}"
    return _resposta(texto, "SCORE", 0.9,
                     {"score": score, "classificacao": classe},
                     ["O que posso fazer para melhorar?", "Onde gastei mais?", "Como posso economizar?"])


def _handle_anomalia(anomalias: list[dict]) -> dict:
    relevantes = [a for a in anomalias if a.get("tipo") != "INFORMATIVO"]
    if not relevantes:
        return _resposta(
            "Não encontrei gastos fora do padrão relevantes neste período.",
            "ANOMALIA", 0.85, {},
            ["Qual foi meu saldo?", "Onde gastei mais?", "Faça um resumo do meu mês."],
        )
    cats = list({a.get("categoria") for a in relevantes if a.get("categoria")})
    if cats:
        texto = f"Foi identificado gasto fora do padrão em: {', '.join(cats[:3])}. Vale revisar essas categorias."
    else:
        texto = relevantes[0].get("mensagem") or "Foram identificados gastos fora do padrão neste período."
    return _resposta(texto, "ANOMALIA", 0.88,
                     {"quantidadeAnomalias": len(relevantes), "categorias": cats},
                     ["Como posso economizar?", "Onde gastei mais?", "Qual foi meu saldo?"])


def _handle_projecao(proj: dict | None) -> dict:
    if not proj:
        return _resposta(
            "Não há dados de projeção disponíveis para este período.",
            "PROJECAO", 0.5, {},
            ["Qual foi meu saldo?", "Como está minha saúde financeira?", "Como posso economizar?"],
        )
    risco = bool(proj.get("riscoSaldoNegativo"))
    tendencia = (proj.get("tendencia") or "").upper()
    msg = proj.get("mensagemPrincipal") or ""
    if risco:
        texto = "Existe risco de saldo negativo nos próximos meses se o padrão atual continuar. Recomendo revisar os gastos."
    elif tendencia == "POSITIVA":
        texto = "Sua projeção financeira é positiva para os próximos meses e não há risco de saldo negativo identificado."
    elif tendencia in ("ATENCAO", "NEGATIVA"):
        texto = "Sua projeção indica atenção: os gastos atuais podem comprometer os próximos meses."
    elif msg:
        texto = msg
    else:
        texto = "Não há projeção disponível para este período."
    return _resposta(texto, "PROJECAO", 0.85,
                     {"tendencia": tendencia, "riscoSaldoNegativo": risco},
                     ["Como posso economizar?", "Qual foi meu saldo?", "Como está minha saúde financeira?"])


def _handle_metas(metas: list[dict], economia_media: float) -> dict:
    ativas = [m for m in metas if m.get("status") not in ("CONCLUIDA", "CANCELADA")]
    if not ativas:
        return _resposta(
            "Você não possui metas ativas no momento. Que tal criar uma meta financeira?",
            "META", 0.7, {},
            ["Como posso economizar?", "Qual foi meu saldo?", "Como está minha saúde financeira?"],
        )
    partes = []
    dados_metas = []
    for m in ativas[:3]:
        nome = m.get("nome") or "Meta"
        alvo = float(m.get("valorAlvo") or 0)
        atual = float(m.get("valorAtual") or 0)
        falta = max(0, alvo - atual)
        pct = min(100, atual / alvo * 100) if alvo > 0 else 0
        linha = f"{nome}: {_fmt_brl(atual)} de {_fmt_brl(alvo)} ({pct:.0f}% concluída, faltam {_fmt_brl(falta)})."
        if economia_media > 0 and falta > 0:
            meses_est = round(falta / economia_media)
            if meses_est > 0:
                linha += f" Com sua economia média atual, pode atingir essa meta em aproximadamente {meses_est} {'mês' if meses_est == 1 else 'meses'}."
        partes.append(linha)
        dados_metas.append({"nome": nome, "alvo": alvo, "atual": atual, "falta": falta})
    return _resposta(
        " ".join(partes),
        "META", 0.9,
        {"metas": dados_metas},
        ["Como posso economizar mais?", "Qual foi meu saldo?", "Como está minha saúde financeira?"],
    )


def _handle_resumo(resumo: dict, categorias: list[dict], score_data: dict | None,
                   anomalias: list[dict], periodo_str: str) -> dict:
    rec = float(resumo.get("totalReceitas") or 0)
    desp = float(resumo.get("totalDespesas") or 0)
    saldo = float(resumo.get("saldo") or 0)
    saldo_label = "positivo" if saldo >= 0 else "negativo"

    texto = (f"Em {periodo_str}, você teve saldo {saldo_label} de {_fmt_brl(abs(saldo))}. "
             f"Suas receitas somaram {_fmt_brl(rec)} e suas despesas {_fmt_brl(desp)}.")

    despesas_cat = sorted(
        [c for c in categorias if (c.get("tipo") or "").upper() == "DESPESA"],
        key=lambda c: float(c.get("total") or 0), reverse=True
    )
    if despesas_cat:
        top = despesas_cat[0]
        texto += f" Sua maior categoria de gasto foi {top.get('nome')}, com {_fmt_brl(float(top.get('total') or 0))}."

    if score_data and score_data.get("score"):
        texto += f" Seu score financeiro foi {score_data['score']}/100."

    relevantes = [a for a in anomalias if a.get("tipo") != "INFORMATIVO"]
    if relevantes:
        cats = list({a.get("categoria") for a in relevantes if a.get("categoria")})
        if cats:
            texto += f" Ponto de atenção: gasto fora do padrão em {', '.join(cats[:2])}."

    return _resposta(texto, "RELATORIO", 0.9,
                     {"saldo": saldo, "totalReceitas": rec, "totalDespesas": desp},
                     ["Onde gastei mais?", "Como posso economizar?", "Tive algum gasto fora do padrão?"])


# ── Entrada principal ─────────────────────────────────────────────────────────

def responder_assistente(
    pergunta: str,
    periodo: dict,
    resumo_financeiro: dict,
    categorias: list[dict],
    transacoes: list[dict],
    metas: list[dict],
    score_financeiro: dict | None,
    insights: list[dict],
    anomalias: list[dict],
    projecao: dict | None,
    recomendacoes_economia: dict | None,
) -> dict:
    if not pergunta or not pergunta.strip():
        return _resposta(
            "Digite uma pergunta para que eu possa ajudar.",
            "AJUDA", 0.5, {}, SUGESTOES_PADRAO,
        )

    rec = float((resumo_financeiro or {}).get("totalReceitas") or 0)
    desp = float((resumo_financeiro or {}).get("totalDespesas") or 0)
    if rec == 0 and desp == 0:
        return _resposta(
            "Ainda há poucos dados financeiros para responder com precisão. "
            "Cadastre mais receitas e despesas para que eu possa ajudar melhor.",
            "AJUDA", 0.5, {},
            ["Como cadastrar uma transação?", "Como importar um extrato?", "Como criar uma meta?"],
        )

    periodo_str = _nome_mes(periodo.get("mes") or "") if periodo else ""
    q = _normalizar(pergunta[:500])

    economia_media = float((projecao or {}).get("economiaMediaMensal") or 0)

    # Prioridade: categoria específica → intenções gerais
    cat_match = _detectar_categoria_especifica(q, categorias or [])

    if _detectar_resumo(q):
        return _handle_resumo(resumo_financeiro or {}, categorias or [],
                              score_financeiro, anomalias or [], periodo_str)
    if _detectar_maior_categoria(q):
        return _handle_maior_categoria(categorias or [], periodo_str)
    if cat_match:
        return _handle_categoria(cat_match, periodo_str)
    if _detectar_saldo(q):
        return _handle_saldo(resumo_financeiro or {}, periodo_str)
    if _detectar_receitas(q):
        return _handle_receitas(resumo_financeiro or {}, periodo_str)
    if _detectar_despesas_total(q):
        return _handle_despesas(resumo_financeiro or {}, periodo_str)
    if _detectar_economia(q):
        return _handle_economia(recomendacoes_economia)
    if _detectar_score(q):
        return _handle_score(score_financeiro)
    if _detectar_anomalia(q):
        return _handle_anomalia(anomalias or [])
    if _detectar_projecao(q):
        return _handle_projecao(projecao)
    if _detectar_metas(q):
        return _handle_metas(metas or [], economia_media)

    return _resposta(
        "Ainda não consegui entender essa pergunta. "
        "Tente perguntar sobre saldo, despesas, categorias, metas, score ou economia.",
        "NAO_ENTENDIDO", 0.2, {},
        ["Qual foi meu saldo este mês?", "Onde gastei mais?", "Como posso economizar?"],
    )
