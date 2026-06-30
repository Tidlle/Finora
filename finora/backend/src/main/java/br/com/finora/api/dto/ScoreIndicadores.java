package br.com.finora.api.dto;

public record ScoreIndicadores(
        Double taxaEconomia,
        Double percentualDespesasSobreReceitas,
        Double saldoMedioMensal,
        Boolean riscoSaldoNegativo,
        Integer quantidadeAnomalias,
        String maiorCategoriaDespesa,
        Double percentualMaiorCategoria,
        Integer metasAtivas,
        Double progressoMedioMetas
) {}
