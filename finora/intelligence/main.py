from fastapi import FastAPI
from pydantic import BaseModel
from services.categorizer import sugerir_categoria, sugerir_categorias_lote
from services.insights import gerar_insights
from services.anomalias import detectar_anomalias
from services.projecoes import projetar_financas
from services.economias import sugerir_economias
from services.score import calcular_score_financeiro
from services.normalizer import normalizar_extrato
from services.relatorio import gerar_relatorio_mensal
from services.assistente import responder_assistente
from services.simulador import simular_cenario_financeiro

app = FastAPI(title="Finora Intelligence", version="1.0.0")


# ── Schemas ──────────────────────────────────────────────────────────────────

class CategoriaDisponivel(BaseModel):
    id: int
    nome: str
    tipo: str


class PreferenciaUsuario(BaseModel):
    descricaoNormalizada: str
    categoriaId: int
    categoriaNome: str
    tipo: str
    quantidadeUsos: int = 1


class SugestaoRequest(BaseModel):
    descricao: str
    tipo: str
    categoriasDisponiveis: list[CategoriaDisponivel]
    preferenciasUsuario: list[PreferenciaUsuario] = []


class SugestaoResponse(BaseModel):
    categoriaId: int | None
    categoriaNome: str | None
    confianca: float
    motivo: str
    origem: str = "SEM_SUGESTAO"


class TransacaoSimples(BaseModel):
    descricao: str
    tipo: str


class LoteRequest(BaseModel):
    transacoes: list[TransacaoSimples]
    categoriasDisponiveis: list[CategoriaDisponivel]
    preferenciasUsuario: list[PreferenciaUsuario] = []


class SugestaoLote(BaseModel):
    descricao: str
    categoriaId: int | None
    categoriaNome: str | None
    confianca: float
    motivo: str
    origem: str = "SEM_SUGESTAO"


class LoteResponse(BaseModel):
    sugestoes: list[SugestaoLote]


# ── Schemas de insights ───────────────────────────────────────────────────────

class Periodo(BaseModel):
    dataInicial: str
    dataFinal: str


class TransacaoInsight(BaseModel):
    descricao: str
    valor: float
    tipo: str
    categoria: str | None = None
    data: str | None = None


class InsightsRequest(BaseModel):
    periodoAtual: Periodo
    periodoAnterior: Periodo | None = None
    transacoesAtual: list[TransacaoInsight]
    transacoesAnterior: list[TransacaoInsight] = []


class InsightItem(BaseModel):
    tipo: str
    titulo: str
    mensagem: str
    prioridade: str


class InsightsResumo(BaseModel):
    totalReceitas: float
    totalDespesas: float
    saldo: float
    maiorCategoriaDespesa: str | None


class InsightsResponse(BaseModel):
    insights: list[InsightItem]
    resumo: InsightsResumo | None


# ── Schemas de anomalias ─────────────────────────────────────────────────────

class TransacaoAnomalia(BaseModel):
    descricao: str
    valor: float
    tipo: str
    categoria: str | None = None
    data: str | None = None


class AnomaliasRequest(BaseModel):
    periodoAtual: Periodo
    periodoReferencia: Periodo | None = None
    transacoesAtual: list[TransacaoAnomalia]
    transacoesReferencia: list[TransacaoAnomalia] = []


class AnomaliaItem(BaseModel):
    tipo: str
    categoria: str | None
    descricao: str | None
    valor: float | None
    mensagem: str
    severidade: str
    percentualAcimaMedia: float | None


class AnomaliasResumo(BaseModel):
    totalAnomalias: int
    anomaliasAltaSeveridade: int
    categoriaMaisCritica: str | None


class AnomaliasResponse(BaseModel):
    anomalias: list[AnomaliaItem]
    resumo: AnomaliasResumo | None


# ── Schemas de projeções ──────────────────────────────────────────────────────

class TransacaoHistorica(BaseModel):
    descricao: str | None = None
    valor: float
    tipo: str
    categoria: str | None = None
    data: str | None = None


class MetaInput(BaseModel):
    nome: str | None = None
    valorAlvo: float = 0.0
    valorAtual: float = 0.0
    status: str | None = None


class ProjecaoRequest(BaseModel):
    mesesProjecao: int = 6
    dataBase: str
    saldoAtual: float = 0.0
    transacoesHistoricas: list[TransacaoHistorica] = []
    metas: list[MetaInput] = []


class ProjecaoItem(BaseModel):
    mes: str
    receitasPrevistas: float
    despesasPrevistas: float
    saldoPrevisto: float
    saldoAcumulado: float


class ProjecaoAnalise(BaseModel):
    tendencia: str
    riscoSaldoNegativo: bool
    mesRiscoSaldoNegativo: str | None
    economiaMediaMensal: float
    mensagemPrincipal: str
    observacoes: list[str]


class ProjecaoCenario(BaseModel):
    nome: str
    descricao: str
    saldoFinalProjetado: float
    diferencaVsAtual: float


class ProjecaoMetaResult(BaseModel):
    nome: str
    valorAlvo: float
    valorAtual: float
    valorRestante: float
    mesesEstimadosParaConclusao: int | None
    mensagem: str


class ProjecaoResponse(BaseModel):
    projecoes: list[ProjecaoItem]
    analise: ProjecaoAnalise
    cenarios: list[ProjecaoCenario]
    metas: list[ProjecaoMetaResult]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/status")
def status():
    return {"status": "online", "service": "finora-intelligence"}


@app.post("/sugerir-categoria", response_model=SugestaoResponse)
def sugerir(request: SugestaoRequest):
    categorias = [c.model_dump() for c in request.categoriasDisponiveis]
    prefs = [p.model_dump() for p in request.preferenciasUsuario]
    resultado = sugerir_categoria(
        descricao=request.descricao,
        tipo=request.tipo,
        categorias_disponiveis=categorias,
        preferencias_usuario=prefs,
    )
    return SugestaoResponse(**resultado)


@app.post("/sugerir-categorias-lote", response_model=LoteResponse)
def sugerir_lote(request: LoteRequest):
    transacoes = [t.model_dump() for t in request.transacoes]
    categorias = [c.model_dump() for c in request.categoriasDisponiveis]
    prefs = [p.model_dump() for p in request.preferenciasUsuario]
    sugestoes = sugerir_categorias_lote(
        transacoes=transacoes,
        categorias_disponiveis=categorias,
        preferencias_usuario=prefs,
    )
    return LoteResponse(sugestoes=[SugestaoLote(**s) for s in sugestoes])


@app.post("/detectar-anomalias", response_model=AnomaliasResponse)
def anomalias(request: AnomaliasRequest):
    resultado = detectar_anomalias(
        transacoes_atual=[t.model_dump() for t in request.transacoesAtual],
        transacoes_referencia=[t.model_dump() for t in request.transacoesReferencia],
        periodo_atual=request.periodoAtual.model_dump(),
        periodo_referencia=request.periodoReferencia.model_dump() if request.periodoReferencia else {},
    )
    return AnomaliasResponse(
        anomalias=[AnomaliaItem(**a) for a in resultado["anomalias"]],
        resumo=AnomaliasResumo(**resultado["resumo"]) if resultado.get("resumo") else None,
    )


@app.post("/projetar-financas", response_model=ProjecaoResponse)
def projecoes(request: ProjecaoRequest):
    resultado = projetar_financas(
        meses_projecao=request.mesesProjecao,
        data_base=request.dataBase,
        saldo_atual=request.saldoAtual,
        transacoes_historicas=[t.model_dump() for t in request.transacoesHistoricas],
        metas=[m.model_dump() for m in request.metas],
    )
    return ProjecaoResponse(
        projecoes=[ProjecaoItem(**p) for p in resultado["projecoes"]],
        analise=ProjecaoAnalise(**resultado["analise"]),
        cenarios=[ProjecaoCenario(**c) for c in resultado["cenarios"]],
        metas=[ProjecaoMetaResult(**m) for m in resultado["metas"]],
    )


# ── Schemas de sugestões de economia ─────────────────────────────────────────

class PeriodoEconomia(BaseModel):
    dataInicial: str
    dataFinal: str


class TransacaoEconomia(BaseModel):
    descricao: str | None = None
    valor: float
    tipo: str
    categoria: str | None = None
    data: str | None = None


class EconomiasRequest(BaseModel):
    periodo: PeriodoEconomia
    periodoAnterior: PeriodoEconomia | None = None
    totalReceitas: float = 0.0
    totalDespesas: float = 0.0
    saldo: float = 0.0
    transacoesAtual: list[TransacaoEconomia] = []
    transacoesAnterior: list[TransacaoEconomia] = []


class RecomendacaoItem(BaseModel):
    tipo: str
    categoria: str | None
    titulo: str
    mensagem: str
    economiaEstimada: float
    percentualReducaoSugerido: int
    percentualDaDespesaTotal: float
    prioridade: str


class EconomiasResumo(BaseModel):
    economiaTotalPotencial: float
    categoriaComMaiorPotencial: str | None
    percentualEconomiaSobreDespesas: float
    mensagemPrincipal: str


class EconomiasResponse(BaseModel):
    recomendacoes: list[RecomendacaoItem]
    resumo: EconomiasResumo


# ── Schemas de score financeiro ───────────────────────────────────────────────

class MetaScore(BaseModel):
    nome: str | None = None
    valorAlvo: float = 0.0
    valorAtual: float = 0.0
    status: str | None = None


class AnomaliaScore(BaseModel):
    tipo: str | None = None
    categoria: str | None = None
    severidade: str = "BAIXA"
    valor: float | None = None


class ProjecaoScore(BaseModel):
    tendencia: str | None = None
    riscoSaldoNegativo: bool = False
    economiaMediaMensal: float = 0.0
    saldoFinalProjetado: float = 0.0


class RecomendacoesEconomiaScore(BaseModel):
    economiaTotalPotencial: float = 0.0
    categoriaComMaiorPotencial: str | None = None


class TransacaoScore(BaseModel):
    descricao: str | None = None
    valor: float = 0.0
    tipo: str = "DESPESA"
    categoria: str | None = None
    data: str | None = None


class ScoreRequest(BaseModel):
    periodo: PeriodoEconomia
    periodoAnterior: PeriodoEconomia | None = None
    totalReceitas: float = 0.0
    totalDespesas: float = 0.0
    saldo: float = 0.0
    transacoesAtual: list[TransacaoScore] = []
    transacoesAnteriores: list[TransacaoScore] = []
    metas: list[MetaScore] = []
    anomalias: list[AnomaliaScore] = []
    projecao: ProjecaoScore | None = None
    recomendacoesEconomia: RecomendacoesEconomiaScore | None = None


class ScoreComponenteOut(BaseModel):
    nome: str
    pontuacao: int
    pontuacaoMaxima: int
    mensagem: str


class ScoreIndicadoresOut(BaseModel):
    taxaEconomia: float
    percentualDespesasSobreReceitas: float
    saldoMedioMensal: float
    riscoSaldoNegativo: bool
    quantidadeAnomalias: int
    maiorCategoriaDespesa: str | None
    percentualMaiorCategoria: float
    metasAtivas: int
    progressoMedioMetas: float


class ScoreResponse(BaseModel):
    score: int
    classificacao: str
    mensagemPrincipal: str
    pontosFortes: list[str]
    pontosAtencao: list[str]
    indicadores: ScoreIndicadoresOut
    componentes: list[ScoreComponenteOut]


@app.post("/calcular-score-financeiro", response_model=ScoreResponse)
def score_financeiro(request: ScoreRequest):
    resultado = calcular_score_financeiro(
        total_receitas=request.totalReceitas,
        total_despesas=request.totalDespesas,
        saldo=request.saldo,
        transacoes_atual=[t.model_dump() for t in request.transacoesAtual],
        metas=[m.model_dump() for m in request.metas],
        anomalias=[a.model_dump() for a in request.anomalias],
        projecao=request.projecao.model_dump() if request.projecao else None,
    )
    return ScoreResponse(
        score=resultado["score"],
        classificacao=resultado["classificacao"],
        mensagemPrincipal=resultado["mensagemPrincipal"],
        pontosFortes=resultado["pontosFortes"],
        pontosAtencao=resultado["pontosAtencao"],
        indicadores=ScoreIndicadoresOut(**resultado["indicadores"]),
        componentes=[ScoreComponenteOut(**c) for c in resultado["componentes"]],
    )


@app.post("/sugerir-economias", response_model=EconomiasResponse)
def economias(request: EconomiasRequest):
    resultado = sugerir_economias(
        transacoes_atual=[t.model_dump() for t in request.transacoesAtual],
        transacoes_anterior=[t.model_dump() for t in request.transacoesAnterior],
        total_receitas=request.totalReceitas,
        total_despesas=request.totalDespesas,
    )
    return EconomiasResponse(
        recomendacoes=[RecomendacaoItem(**r) for r in resultado["recomendacoes"]],
        resumo=EconomiasResumo(**resultado["resumo"]),
    )


# ── Schemas de normalização de extrato ───────────────────────────────────────

class TransacaoBruta(BaseModel):
    linha: int = 0
    dataOriginal: str = ""
    descricaoOriginal: str = ""
    valorOriginal: str = ""
    tipoOriginal: str = ""
    categoriaOriginal: str = ""


class TransacaoExistente(BaseModel):
    descricao: str = ""
    valor: float = 0.0
    tipo: str = ""
    categoria: str | None = None
    data: str = ""


class NormalizarExtratoRequest(BaseModel):
    transacoesBrutas: list[TransacaoBruta] = []
    categoriasDisponiveis: list[CategoriaDisponivel] = []
    preferenciasUsuario: list[PreferenciaUsuario] = []
    transacoesExistentes: list[TransacaoExistente] = []


class TransacaoNormalizada(BaseModel):
    linha: int
    descricaoOriginal: str
    descricaoLimpa: str
    dataOriginal: str
    dataNormalizada: str | None
    valorOriginal: str
    valorNormalizado: float | None
    tipoDetectado: str | None
    categoriaSugeridaId: int | None
    categoriaSugeridaNome: str | None
    confianca: float
    origemSugestao: str
    possivelDuplicada: bool
    motivoDuplicidade: str | None
    status: str
    mensagens: list[str]


class ResumoNormalizacao(BaseModel):
    totalLinhas: int
    prontasParaImportar: int
    precisamRevisao: int
    possiveisDuplicadas: int
    semCategoria: int
    comErro: int


class NormalizarExtratoResponse(BaseModel):
    transacoesNormalizadas: list[TransacaoNormalizada]
    resumo: ResumoNormalizacao


@app.post("/normalizar-extrato", response_model=NormalizarExtratoResponse)
def normalizar(request: NormalizarExtratoRequest):
    resultado = normalizar_extrato(
        transacoes_brutas=[t.model_dump() for t in request.transacoesBrutas],
        categorias_disponiveis=[c.model_dump() for c in request.categoriasDisponiveis],
        preferencias_usuario=[p.model_dump() for p in request.preferenciasUsuario],
        transacoes_existentes=[e.model_dump() for e in request.transacoesExistentes],
    )
    return NormalizarExtratoResponse(
        transacoesNormalizadas=[TransacaoNormalizada(**t) for t in resultado["transacoesNormalizadas"]],
        resumo=ResumoNormalizacao(**resultado["resumo"]),
    )


# ── Schemas de relatório mensal ───────────────────────────────────────────────

class PeriodoRelatorio(BaseModel):
    mes: str = ""
    dataInicial: str = ""
    dataFinal: str = ""


class ResumoFinanceiroRelatorio(BaseModel):
    totalReceitas: float = 0.0
    totalDespesas: float = 0.0
    saldo: float = 0.0


class CategoriaRelatorio(BaseModel):
    nome: str = ""
    tipo: str = ""
    total: float = 0.0
    percentual: float = 0.0


class TransacaoRelatorio(BaseModel):
    descricao: str = ""
    valor: float = 0.0
    tipo: str = ""
    categoria: str | None = None
    data: str | None = None


class InsightRelatorio(BaseModel):
    tipo: str = ""
    titulo: str = ""
    mensagem: str = ""
    prioridade: str = ""


class AnomaliaRelatorio(BaseModel):
    tipo: str = ""
    categoria: str | None = None
    mensagem: str = ""
    severidade: str = ""


class ScoreRelatorio(BaseModel):
    score: int = 0
    classificacao: str = ""
    mensagemPrincipal: str = ""


class RecomendacoesRelatorio(BaseModel):
    economiaTotalPotencial: float = 0.0
    categoriaComMaiorPotencial: str | None = None
    mensagemPrincipal: str = ""


class ProjecaoRelatorio(BaseModel):
    tendencia: str = ""
    riscoSaldoNegativo: bool = False
    economiaMediaMensal: float = 0.0
    mensagemPrincipal: str = ""


class MetaRelatorio(BaseModel):
    nome: str = ""
    valorAlvo: float = 0.0
    valorAtual: float = 0.0
    status: str = ""


class RelatorioMensalRequest(BaseModel):
    periodo: PeriodoRelatorio = PeriodoRelatorio()
    periodoAnterior: PeriodoRelatorio | None = None
    resumoFinanceiro: ResumoFinanceiroRelatorio = ResumoFinanceiroRelatorio()
    categorias: list[CategoriaRelatorio] = []
    transacoes: list[TransacaoRelatorio] = []
    insights: list[InsightRelatorio] = []
    anomalias: list[AnomaliaRelatorio] = []
    scoreFinanceiro: ScoreRelatorio | None = None
    recomendacoesEconomia: RecomendacoesRelatorio | None = None
    projecao: ProjecaoRelatorio | None = None
    metas: list[MetaRelatorio] = []


class SecaoRelatorio(BaseModel):
    titulo: str
    tipo: str
    itens: list[str]


class IndicadoresRelatorio(BaseModel):
    totalReceitas: float
    totalDespesas: float
    saldo: float
    scoreFinanceiro: int
    economiaPotencial: float
    maiorCategoria: str | None
    riscoSaldoNegativo: bool


class RelatorioMensalResponse(BaseModel):
    titulo: str
    subtitulo: str
    mensagemPrincipal: str
    classificacaoGeral: str
    secoes: list[SecaoRelatorio]
    indicadores: IndicadoresRelatorio
    conclusao: str


@app.post("/gerar-relatorio-mensal", response_model=RelatorioMensalResponse)
def relatorio_mensal(request: RelatorioMensalRequest):
    resultado = gerar_relatorio_mensal(
        periodo=request.periodo.model_dump(),
        periodo_anterior=request.periodoAnterior.model_dump() if request.periodoAnterior else None,
        resumo_financeiro=request.resumoFinanceiro.model_dump(),
        categorias=[c.model_dump() for c in request.categorias],
        transacoes=[t.model_dump() for t in request.transacoes],
        insights=[i.model_dump() for i in request.insights],
        anomalias=[a.model_dump() for a in request.anomalias],
        score_financeiro=request.scoreFinanceiro.model_dump() if request.scoreFinanceiro else None,
        recomendacoes_economia=request.recomendacoesEconomia.model_dump() if request.recomendacoesEconomia else None,
        projecao=request.projecao.model_dump() if request.projecao else None,
        metas=[m.model_dump() for m in request.metas],
    )
    return RelatorioMensalResponse(
        titulo=resultado["titulo"],
        subtitulo=resultado["subtitulo"],
        mensagemPrincipal=resultado["mensagemPrincipal"],
        classificacaoGeral=resultado["classificacaoGeral"],
        secoes=[SecaoRelatorio(**s) for s in resultado["secoes"]],
        indicadores=IndicadoresRelatorio(**resultado["indicadores"]),
        conclusao=resultado["conclusao"],
    )


# ── Schemas de simulador financeiro ──────────────────────────────────────────

class SimuladorParametros(BaseModel):
    valorMeta: float | None = None
    valorAtual: float | None = None
    economiaMensalPlanejada: float | None = None
    prazoDesejadoMeses: int | None = None
    categoria: str | None = None
    percentualReducaoDespesa: float | None = None
    categoriasReducao: list[str] = []
    aumentoReceitaMensal: float | None = None


class ContextoFinanceiro(BaseModel):
    saldoAtual: float = 0.0
    mediaReceitasMensais: float | None = None
    mediaDespesasMensais: float | None = None
    economiaMediaMensal: float | None = None
    scoreFinanceiro: int | None = None
    classificacaoScore: str | None = None
    riscoSaldoNegativo: bool = False


class CategoriaSimulador(BaseModel):
    nome: str = ""
    tipo: str = ""
    totalMedioMensal: float = 0.0
    percentualDespesas: float = 0.0


class MetaSimulador(BaseModel):
    nome: str = ""
    valorAlvo: float = 0.0
    valorAtual: float = 0.0
    status: str = ""


class HistoricoMensal(BaseModel):
    mes: str = ""
    receitas: float = 0.0
    despesas: float = 0.0
    saldo: float = 0.0


class SimuladorRequest(BaseModel):
    tipoSimulacao: str
    mesesProjecao: int = 6
    parametros: SimuladorParametros = SimuladorParametros()
    contextoFinanceiro: ContextoFinanceiro = ContextoFinanceiro()
    categorias: list[CategoriaSimulador] = []
    metas: list[MetaSimulador] = []
    historicoMensal: list[HistoricoMensal] = []


class ProjecaoItem(BaseModel):
    mes: str
    receitasProjetadas: float | None = None
    despesasProjetadas: float | None = None
    saldoProjetado: float
    valorAcumuladoMeta: float | None = None


class CenarioComparativo(BaseModel):
    nome: str
    descricao: str
    valorMensal: float | None = None
    mesesParaAtingir: int | None = None
    saldoFinalProjetado: float | None = None
    economiaMensal: float | None = None
    percentualReducao: float | None = None


class SimuladorResponse(BaseModel):
    tipoSimulacao: str
    titulo: str
    mensagemPrincipal: str
    resultado: dict = {}
    projecaoMensal: list[ProjecaoItem] = []
    cenariosComparativos: list[CenarioComparativo] = []
    alertas: list[str] = []
    recomendacoes: list[str] = []


@app.post("/simular-cenario-financeiro", response_model=SimuladorResponse)
def simular_cenario(request: SimuladorRequest):
    resultado = simular_cenario_financeiro(
        tipo_simulacao=request.tipoSimulacao,
        meses_projecao=request.mesesProjecao,
        parametros=request.parametros.model_dump(),
        contexto_financeiro=request.contextoFinanceiro.model_dump(),
        categorias=[c.model_dump() for c in request.categorias],
        metas=[m.model_dump() for m in request.metas],
        historico_mensal=[h.model_dump() for h in request.historicoMensal],
    )
    return SimuladorResponse(
        tipoSimulacao=resultado["tipoSimulacao"],
        titulo=resultado["titulo"],
        mensagemPrincipal=resultado["mensagemPrincipal"],
        resultado=resultado.get("resultado") or {},
        projecaoMensal=[ProjecaoItem(**p) for p in resultado.get("projecaoMensal") or []],
        cenariosComparativos=[CenarioComparativo(**c) for c in resultado.get("cenariosComparativos") or []],
        alertas=resultado.get("alertas") or [],
        recomendacoes=resultado.get("recomendacoes") or [],
    )


# ── Schemas de assistente financeiro ─────────────────────────────────────────

class PeriodoAssistente(BaseModel):
    mes: str = ""
    dataInicial: str = ""
    dataFinal: str = ""


class ResumoFinanceiroAssistente(BaseModel):
    totalReceitas: float = 0.0
    totalDespesas: float = 0.0
    saldo: float = 0.0


class CategoriaAssistente(BaseModel):
    nome: str = ""
    tipo: str = ""
    total: float = 0.0
    percentual: float = 0.0


class TransacaoAssistente(BaseModel):
    descricao: str = ""
    valor: float = 0.0
    tipo: str = ""
    categoria: str | None = None
    data: str | None = None


class MetaAssistente(BaseModel):
    nome: str = ""
    valorAlvo: float = 0.0
    valorAtual: float = 0.0
    status: str = ""


class ScoreAssistente(BaseModel):
    score: int = 0
    classificacao: str = ""
    mensagemPrincipal: str = ""


class InsightAssistente(BaseModel):
    tipo: str = ""
    titulo: str = ""
    mensagem: str = ""
    prioridade: str = ""


class AnomaliaAssistente(BaseModel):
    tipo: str = ""
    categoria: str | None = None
    mensagem: str = ""
    severidade: str = ""


class ProjecaoAssistente(BaseModel):
    tendencia: str = ""
    riscoSaldoNegativo: bool = False
    economiaMediaMensal: float = 0.0
    mensagemPrincipal: str = ""


class RecomendacaoAssistente(BaseModel):
    economiaTotalPotencial: float = 0.0
    categoriaComMaiorPotencial: str | None = None
    mensagemPrincipal: str = ""


class AssistenteRequest(BaseModel):
    pergunta: str
    periodo: PeriodoAssistente = PeriodoAssistente()
    resumoFinanceiro: ResumoFinanceiroAssistente = ResumoFinanceiroAssistente()
    categorias: list[CategoriaAssistente] = []
    transacoes: list[TransacaoAssistente] = []
    metas: list[MetaAssistente] = []
    scoreFinanceiro: ScoreAssistente | None = None
    insights: list[InsightAssistente] = []
    anomalias: list[AnomaliaAssistente] = []
    projecao: ProjecaoAssistente | None = None
    recomendacoesEconomia: RecomendacaoAssistente | None = None


class AssistenteResponse(BaseModel):
    resposta: str
    tipoResposta: str
    confianca: float
    dadosRelacionados: dict = {}
    sugestoesPerguntas: list[str] = []


@app.post("/assistente-financeiro", response_model=AssistenteResponse)
def assistente_financeiro(request: AssistenteRequest):
    resultado = responder_assistente(
        pergunta=request.pergunta,
        periodo=request.periodo.model_dump(),
        resumo_financeiro=request.resumoFinanceiro.model_dump(),
        categorias=[c.model_dump() for c in request.categorias],
        transacoes=[t.model_dump() for t in request.transacoes],
        metas=[m.model_dump() for m in request.metas],
        score_financeiro=request.scoreFinanceiro.model_dump() if request.scoreFinanceiro else None,
        insights=[i.model_dump() for i in request.insights],
        anomalias=[a.model_dump() for a in request.anomalias],
        projecao=request.projecao.model_dump() if request.projecao else None,
        recomendacoes_economia=request.recomendacoesEconomia.model_dump() if request.recomendacoesEconomia else None,
    )
    return AssistenteResponse(**resultado)


@app.post("/gerar-insights", response_model=InsightsResponse)
def insights(request: InsightsRequest):
    resultado = gerar_insights(
        transacoes_atual=[t.model_dump() for t in request.transacoesAtual],
        transacoes_anterior=[t.model_dump() for t in request.transacoesAnterior],
        periodo_atual=request.periodoAtual.model_dump(),
        periodo_anterior=request.periodoAnterior.model_dump() if request.periodoAnterior else {},
    )
    return InsightsResponse(
        insights=[InsightItem(**i) for i in resultado["insights"]],
        resumo=InsightsResumo(**resultado["resumo"]) if resultado.get("resumo") else None,
    )
