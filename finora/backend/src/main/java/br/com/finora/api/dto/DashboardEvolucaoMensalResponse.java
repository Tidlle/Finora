package br.com.finora.api.dto;

import java.math.BigDecimal;

public record DashboardEvolucaoMensalResponse(
        String mes,
        BigDecimal receitas,
        BigDecimal despesas
) {
}