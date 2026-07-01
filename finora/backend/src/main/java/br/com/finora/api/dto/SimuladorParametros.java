package br.com.finora.api.dto;

import java.util.List;

public record SimuladorParametros(
        Double valorMeta,
        Double valorAtual,
        Double economiaMensalPlanejada,
        Integer prazoDesejadoMeses,
        String categoria,
        Double percentualReducaoDespesa,
        List<String> categoriasReducao,
        Double aumentoReceitaMensal
) {}
