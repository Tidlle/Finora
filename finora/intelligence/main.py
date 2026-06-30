from fastapi import FastAPI
from pydantic import BaseModel
from services.categorizer import sugerir_categoria, sugerir_categorias_lote
from services.insights import gerar_insights
from services.anomalias import detectar_anomalias
from services.projecoes import projetar_financas
from services.economias import sugerir_economias
from services.score import calcular_score_financeiro
from services.normalizer import normalizar_extrato

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
