package br.com.finora.api.dto;

public record AnomaliaItem(
        String tipo,
        String categoria,
        String descricao,
        Double valor,
        String mensagem,
        String severidade,
        Double percentualAcimaMedia
) {}
