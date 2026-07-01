package br.com.finora.api.dto;

public record SimuladorRequest(
        String tipoSimulacao,
        Integer mesesProjecao,
        SimuladorParametros parametros
) {}
