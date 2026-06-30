package br.com.finora.api.dto;

public record RecomendacaoEconomiaResumo(
        Double economiaTotalPotencial,
        String categoriaComMaiorPotencial,
        Double percentualEconomiaSobreDespesas,
        String mensagemPrincipal
) {}
