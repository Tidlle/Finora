package br.com.finora.api.dto;

import br.com.finora.api.enums.TipoTransacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record TransacaoResponse(
        Long id,
        String descricao,
        BigDecimal valor,
        TipoTransacao tipo,
        LocalDate dataTransacao,
        String observacao,
        Long categoriaId,
        String categoriaNome,
        OffsetDateTime criadoEm
) {
}