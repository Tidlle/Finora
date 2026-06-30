package br.com.finora.api.dto;

public record RecomendacaoEconomiaItem(
        String tipo,
        String categoria,
        String titulo,
        String mensagem,
        Double economiaEstimada,
        Integer percentualReducaoSugerido,
        Double percentualDaDespesaTotal,
        String prioridade
) {}
