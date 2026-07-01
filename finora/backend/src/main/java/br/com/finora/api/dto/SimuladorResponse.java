package br.com.finora.api.dto;

import java.util.List;
import java.util.Map;

public record SimuladorResponse(
        String tipoSimulacao,
        String titulo,
        String mensagemPrincipal,
        Map<String, Object> resultado,
        List<SimuladorProjecaoItem> projecaoMensal,
        List<SimuladorCenario> cenariosComparativos,
        List<String> alertas,
        List<String> recomendacoes
) {}
