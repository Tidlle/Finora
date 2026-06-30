from math import ceil
from collections import defaultdict


def _add_meses(ano: int, mes: int, n: int) -> tuple[int, int]:
    total = (ano - 1) * 12 + (mes - 1) + n
    return total // 12 + 1, total % 12 + 1


_NOMES_MES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


def _nome_mes(mes_str: str) -> str:
    try:
        ano, num = mes_str.split("-")
        return f"{_NOMES_MES[int(num) - 1]} de {ano}"
    except Exception:
        return mes_str


def projetar_financas(
    meses_projecao: int,
    data_base: str,
    saldo_atual: float,
    transacoes_historicas: list[dict],
    metas: list[dict],
) -> dict:
    if not transacoes_historicas:
        return _sem_dados()

    meses_projecao = max(1, min(12, meses_projecao))

    # Agrupar transações por mês
    por_mes: dict[str, dict] = defaultdict(lambda: {"receitas": 0.0, "despesas": 0.0})
    por_cat_desp: dict[str, float] = defaultdict(float)

    for t in transacoes_historicas:
        data = (t.get("data") or "")
        if len(data) < 7:
            continue
        mes = data[:7]
        valor = float(t.get("valor") or 0)
        tipo = (t.get("tipo") or "").upper()
        if tipo == "RECEITA":
            por_mes[mes]["receitas"] += valor
        elif tipo == "DESPESA":
            por_mes[mes]["despesas"] += valor
            cat = t.get("categoria") or "Sem categoria"
            por_cat_desp[cat] += valor

    if not por_mes:
        return _sem_dados()

    meses_ord = sorted(por_mes.keys())
    n_meses = len(meses_ord)

    # Usar últimos 6 meses para médias
    meses_ref = meses_ord[-6:]
    media_rec = sum(por_mes[m]["receitas"] for m in meses_ref) / len(meses_ref)
    media_desp = sum(por_mes[m]["despesas"] for m in meses_ref) / len(meses_ref)
    economia_media = media_rec - media_desp

    # Calcular tendência de crescimento das despesas
    fator_tendencia = 1.0
    if n_meses >= 2:
        meio = max(1, n_meses // 2)
        desp_ini = sum(por_mes[m]["despesas"] for m in meses_ord[:meio]) / meio
        desp_fim = sum(por_mes[m]["despesas"] for m in meses_ord[meio:]) / (n_meses - meio)
        if desp_ini > 0:
            crescimento = (desp_fim / desp_ini - 1) / max(n_meses, 1)
            fator_tendencia = 1.0 + max(-0.05, min(0.05, crescimento))

    # Tendência geral
    if economia_media < 0:
        tendencia = "NEGATIVA"
    elif fator_tendencia > 1.02 and media_desp > media_rec * 0.85:
        tendencia = "ATENCAO"
    elif economia_media > 0 and fator_tendencia <= 1.01:
        tendencia = "POSITIVA"
    else:
        tendencia = "ESTAVEL"

    # Observações
    observacoes: list[str] = []
    if n_meses < 3:
        observacoes.append(
            "Histórico com poucos meses — projeção com baixa confiança. "
            "Cadastre mais transações para maior precisão."
        )

    if por_cat_desp:
        maior_cat = max(por_cat_desp, key=lambda c: por_cat_desp[c])
        observacoes.append(f"Sua maior pressão de gastos está em {maior_cat}.")

    if media_rec > 0:
        taxa = (economia_media / media_rec) * 100
        if taxa >= 20:
            observacoes.append(
                f"Você mantém uma boa margem mensal de economia ({taxa:.0f}% das receitas)."
            )
        elif taxa >= 5:
            observacoes.append(f"Sua taxa de poupança é de {taxa:.0f}% das receitas mensais.")
        else:
            observacoes.append("Sua margem de economia está baixa. Considere reduzir despesas.")

    if tendencia == "ATENCAO":
        observacoes.append("Suas despesas estão crescendo mais rápido que suas receitas.")
    elif tendencia == "POSITIVA":
        observacoes.append("Suas receitas estão acima das despesas no histórico analisado.")
    elif tendencia == "NEGATIVA":
        observacoes.append("Suas despesas superam suas receitas. Atenção ao controle financeiro.")

    # Projetar meses futuros
    try:
        ano_base = int(data_base[:4])
        mes_base = int(data_base[5:7])
    except Exception:
        from datetime import date
        hoje = date.today()
        ano_base, mes_base = hoje.year, hoje.month

    projecoes = []
    saldo_ac = float(saldo_atual or 0)
    risco_negativo = False
    mes_risco: str | None = None

    for i in range(1, meses_projecao + 1):
        ano_p, mes_p = _add_meses(ano_base, mes_base, i)
        mes_str = f"{ano_p:04d}-{mes_p:02d}"

        rec_prev = media_rec
        # Aplica tendência gradual com teto de +30%
        desp_prev = min(media_desp * (fator_tendencia ** i), media_desp * 1.30)
        saldo_prev = rec_prev - desp_prev
        saldo_ac += saldo_prev

        projecoes.append({
            "mes": mes_str,
            "receitasPrevistas": round(rec_prev, 2),
            "despesasPrevistas": round(desp_prev, 2),
            "saldoPrevisto": round(saldo_prev, 2),
            "saldoAcumulado": round(saldo_ac, 2),
        })

        if saldo_ac < 0 and not risco_negativo:
            risco_negativo = True
            mes_risco = mes_str

    # Mensagem principal
    if risco_negativo and mes_risco:
        msg_principal = (
            f"Existe risco de saldo negativo em {_nome_mes(mes_risco)} "
            "se o padrão atual continuar."
        )
    elif tendencia == "NEGATIVA":
        msg_principal = "Suas despesas estão superando suas receitas. Recomendamos revisar seus gastos."
    elif tendencia == "ATENCAO":
        msg_principal = "Suas despesas estão crescendo mais rápido que suas receitas. Fique atento."
    elif tendencia == "POSITIVA":
        msg_principal = (
            f"Mantendo seu padrão atual, sua projeção financeira é positiva "
            f"para os próximos {meses_projecao} meses."
        )
    else:
        msg_principal = f"Sua situação financeira está estável para os próximos {meses_projecao} meses."

    saldo_final = projecoes[-1]["saldoAcumulado"] if projecoes else float(saldo_atual or 0)

    # Cenários
    def _saldo_cenario(f_desp: float, f_rec: float) -> float:
        s = float(saldo_atual or 0)
        for i in range(1, meses_projecao + 1):
            desp = min(media_desp * f_desp * (fator_tendencia ** i), media_desp * 1.30)
            s += media_rec * f_rec - desp
        return round(s, 2)

    saldo_red10 = _saldo_cenario(0.90, 1.0)
    saldo_aum10 = _saldo_cenario(1.0, 1.10)

    cenarios = [
        {
            "nome": "Cenário atual",
            "descricao": "Mantendo o padrão financeiro atual.",
            "saldoFinalProjetado": saldo_final,
            "diferencaVsAtual": 0.0,
        },
        {
            "nome": "Reduzindo despesas em 10%",
            "descricao": "Simulação considerando redução de 10% nas despesas mensais.",
            "saldoFinalProjetado": saldo_red10,
            "diferencaVsAtual": round(saldo_red10 - saldo_final, 2),
        },
        {
            "nome": "Aumentando receitas em 10%",
            "descricao": "Simulação considerando aumento de 10% nas receitas mensais.",
            "saldoFinalProjetado": saldo_aum10,
            "diferencaVsAtual": round(saldo_aum10 - saldo_final, 2),
        },
    ]

    # Metas
    metas_result = []
    for m in metas:
        nome = m.get("nome") or "Meta"
        alvo = float(m.get("valorAlvo") or 0)
        atual_m = float(m.get("valorAtual") or 0)
        status = (m.get("status") or "").upper()

        if alvo <= 0:
            continue

        if status == "CONCLUIDA" or atual_m >= alvo:
            metas_result.append({
                "nome": nome,
                "valorAlvo": alvo,
                "valorAtual": atual_m,
                "valorRestante": 0.0,
                "mesesEstimadosParaConclusao": 0,
                "mensagem": f"Meta '{nome}' já foi concluída. Parabéns!",
            })
            continue

        restante = max(0.0, alvo - atual_m)
        if economia_media > 0:
            meses_est = ceil(restante / economia_media)
            prazo_txt = "1 mês" if meses_est == 1 else f"{meses_est} meses"
            msg_meta = (
                f"Com sua economia média atual, você pode atingir esta meta "
                f"em aproximadamente {prazo_txt}."
            )
        else:
            meses_est = None
            msg_meta = (
                "Com o padrão atual de gastos, não é possível estimar a conclusão "
                "desta meta. Considere aumentar sua economia."
            )

        metas_result.append({
            "nome": nome,
            "valorAlvo": alvo,
            "valorAtual": atual_m,
            "valorRestante": round(restante, 2),
            "mesesEstimadosParaConclusao": meses_est,
            "mensagem": msg_meta,
        })

    return {
        "projecoes": projecoes,
        "analise": {
            "tendencia": tendencia,
            "riscoSaldoNegativo": risco_negativo,
            "mesRiscoSaldoNegativo": mes_risco,
            "economiaMediaMensal": round(economia_media, 2),
            "mensagemPrincipal": msg_principal,
            "observacoes": observacoes,
        },
        "cenarios": cenarios,
        "metas": metas_result,
    }


def _sem_dados() -> dict:
    return {
        "projecoes": [],
        "analise": {
            "tendencia": "ESTAVEL",
            "riscoSaldoNegativo": False,
            "mesRiscoSaldoNegativo": None,
            "economiaMediaMensal": 0.0,
            "mensagemPrincipal": "Ainda há poucos dados para gerar projeções financeiras confiáveis.",
            "observacoes": ["Cadastre mais receitas e despesas para melhorar a precisão das projeções."],
        },
        "cenarios": [],
        "metas": [],
    }
