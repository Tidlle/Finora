package br.com.finora.api.dto;

public record InsightItem(
        String tipo,
        String titulo,
        String mensagem,
        String prioridade
) {}
