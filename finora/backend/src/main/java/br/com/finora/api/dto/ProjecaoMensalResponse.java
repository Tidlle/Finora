package br.com.finora.api.dto;

import java.math.BigDecimal;

public record ProjecaoMensalResponse(
        String mes,
        BigDecimal saldoProjetado
) {
}
