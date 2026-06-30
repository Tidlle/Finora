package br.com.finora.api.dto;

import java.util.List;

public record RecomendacoesEconomiaResponse(
        List<RecomendacaoEconomiaItem> recomendacoes,
        RecomendacaoEconomiaResumo resumo
) {}
