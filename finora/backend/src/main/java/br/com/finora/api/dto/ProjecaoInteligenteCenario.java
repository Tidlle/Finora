package br.com.finora.api.dto;

public record ProjecaoInteligenteCenario(
        String nome,
        String descricao,
        Double saldoFinalProjetado,
        Double diferencaVsAtual
) {}
