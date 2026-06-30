package br.com.finora.api.dto;

public record ScoreComponente(
        String nome,
        Integer pontuacao,
        Integer pontuacaoMaxima,
        String mensagem
) {}
