package br.com.finora.api.dto;

import java.util.List;

public record InsightsResponse(
        List<InsightItem> insights,
        InsightsResumo resumo
) {}
