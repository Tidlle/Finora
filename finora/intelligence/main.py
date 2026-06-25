from fastapi import FastAPI
from pydantic import BaseModel
from services.categorizer import sugerir_categoria, sugerir_categorias_lote
from services.insights import gerar_insights

app = FastAPI(title="Finora Intelligence", version="1.0.0")


# ── Schemas ──────────────────────────────────────────────────────────────────

class CategoriaDisponivel(BaseModel):
    id: int
    nome: str
    tipo: str


class SugestaoRequest(BaseModel):
    descricao: str
    tipo: str
    categoriasDisponiveis: list[CategoriaDisponivel]


class SugestaoResponse(BaseModel):
    categoriaId: int | None
    categoriaNome: str | None
    confianca: float
    motivo: str


class TransacaoSimples(BaseModel):
    descricao: str
    tipo: str


class LoteRequest(BaseModel):
    transacoes: list[TransacaoSimples]
    categoriasDisponiveis: list[CategoriaDisponivel]


class SugestaoLote(BaseModel):
    descricao: str
    categoriaId: int | None
    categoriaNome: str | None
    confianca: float
    motivo: str


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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/status")
def status():
    return {"status": "online", "service": "finora-intelligence"}


@app.post("/sugerir-categoria", response_model=SugestaoResponse)
def sugerir(request: SugestaoRequest):
    categorias = [c.model_dump() for c in request.categoriasDisponiveis]
    resultado = sugerir_categoria(
        descricao=request.descricao,
        tipo=request.tipo,
        categorias_disponiveis=categorias,
    )
    return SugestaoResponse(**resultado)


@app.post("/sugerir-categorias-lote", response_model=LoteResponse)
def sugerir_lote(request: LoteRequest):
    transacoes = [t.model_dump() for t in request.transacoes]
    categorias = [c.model_dump() for c in request.categoriasDisponiveis]
    sugestoes = sugerir_categorias_lote(
        transacoes=transacoes,
        categorias_disponiveis=categorias,
    )
    return LoteResponse(sugestoes=[SugestaoLote(**s) for s in sugestoes])


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
