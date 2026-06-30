package br.com.finora.api.dto;

public record ProjecaoInteligenteMeta(
        String nome,
        Double valorAlvo,
        Double valorAtual,
        Double valorRestante,
        Integer mesesEstimadosParaConclusao,
        String mensagem
) {}
