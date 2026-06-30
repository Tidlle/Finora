package br.com.finora.api.dto;

import java.util.List;

public record ProjecaoInteligenteAnalise(
        String tendencia,
        Boolean riscoSaldoNegativo,
        String mesRiscoSaldoNegativo,
        Double economiaMediaMensal,
        String mensagemPrincipal,
        List<String> observacoes
) {}
