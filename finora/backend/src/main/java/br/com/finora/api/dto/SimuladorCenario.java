package br.com.finora.api.dto;

public record SimuladorCenario(
        String nome,
        String descricao,
        Double valorMensal,
        Integer mesesParaAtingir,
        Double saldoFinalProjetado,
        Double economiaMensal,
        Double percentualReducao
) {}
