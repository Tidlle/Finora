from fastapi import FastAPI
from pydantic import BaseModel
from services.categorizer import sugerir_categoria, sugerir_categorias_lote

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
