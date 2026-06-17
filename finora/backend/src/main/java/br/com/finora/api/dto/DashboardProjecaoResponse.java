package br.com.finora.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardProjecaoResponse(
        BigDecimal saldoEstimadoAtual,
        BigDecimal mediaReceitas,
        BigDecimal mediaDespesas,
        BigDecimal economiaMedia,
        String maiorCategoriaGasto,
        List<ProjecaoMensalResponse> projecoes,
        List<String> alertas,
        boolean dadosInsuficientes
) {
}
