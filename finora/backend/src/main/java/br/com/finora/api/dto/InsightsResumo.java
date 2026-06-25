package br.com.finora.api.dto;

public record InsightsResumo(
        Double totalReceitas,
        Double totalDespesas,
        Double saldo,
        String maiorCategoriaDespesa
) {}
