package br.com.finora.api.dto;

import java.math.BigDecimal;

public record DashboardCategoriaResponse(
        String categoria,
        BigDecimal valor,
        BigDecimal percentual
) {
}