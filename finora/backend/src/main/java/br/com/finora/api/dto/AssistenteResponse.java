package br.com.finora.api.dto;

import java.util.List;
import java.util.Map;

public record AssistenteResponse(
        String resposta,
        String tipoResposta,
        double confianca,
        Map<String, Object> dadosRelacionados,
        List<String> sugestoesPerguntas
) {}
