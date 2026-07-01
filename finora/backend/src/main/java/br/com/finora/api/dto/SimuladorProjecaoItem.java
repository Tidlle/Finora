package br.com.finora.api.dto;

public record SimuladorProjecaoItem(
        String mes,
        Double receitasProjetadas,
        Double despesasProjetadas,
        Double saldoProjetado,
        Double valorAcumuladoMeta
) {}
