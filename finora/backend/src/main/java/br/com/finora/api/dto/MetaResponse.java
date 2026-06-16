package br.com.finora.api.dto;

import br.com.finora.api.enums.StatusMeta;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MetaResponse(
        Long id,
        String nome,
        String descricao,
        BigDecimal valorObjetivo,
        BigDecimal valorAcumulado,
        BigDecimal progressoPercentual,
        BigDecimal valorRestante,
        LocalDate prazo,
        StatusMeta status
) {
}