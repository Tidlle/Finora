package br.com.finora.api.dto;

public record IndicadoresRelatorioDto(
        double totalReceitas,
        double totalDespesas,
        double saldo,
        int scoreFinanceiro,
        double economiaPotencial,
        String maiorCategoria,
        boolean riscoSaldoNegativo
) {}
