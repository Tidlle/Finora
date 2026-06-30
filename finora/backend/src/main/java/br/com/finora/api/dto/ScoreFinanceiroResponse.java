package br.com.finora.api.dto;

import java.util.List;

public record ScoreFinanceiroResponse(
        Integer score,
        String classificacao,
        String mensagemPrincipal,
        List<String> pontosFortes,
        List<String> pontosAtencao,
        ScoreIndicadores indicadores,
        List<ScoreComponente> componentes
) {}
