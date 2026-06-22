package br.com.finora.api.dto;

import br.com.finora.api.enums.TipoTransacao;

public record IntelligenceCategoriaDto(
        Long id,
        String nome,
        TipoTransacao tipo
) {
}
