package br.com.finora.api.dto;

import java.util.List;

public record AnomaliasResponse(
        List<AnomaliaItem> anomalias,
        AnomaliasResumo resumo
) {}
