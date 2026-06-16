package br.com.finora.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResumoResponse(
        String mesReferencia,
        BigDecimal saldo,
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        DashboardCategoriaResponse maiorCategoriaGasto,
        List<DashboardCategoriaResponse> gastosPorCategoria,
        List<TransacaoResponse> ultimasTransacoes,
        List<DashboardEvolucaoMensalResponse> evolucaoMensal
) {
}