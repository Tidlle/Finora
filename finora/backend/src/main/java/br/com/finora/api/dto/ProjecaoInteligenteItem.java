package br.com.finora.api.dto;

public record ProjecaoInteligenteItem(
        String mes,
        Double receitasPrevistas,
        Double despesasPrevistas,
        Double saldoPrevisto,
        Double saldoAcumulado
) {}
