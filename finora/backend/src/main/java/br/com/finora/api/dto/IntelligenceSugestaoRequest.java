package br.com.finora.api.dto;

import br.com.finora.api.enums.TipoTransacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IntelligenceSugestaoRequest(
        @NotBlank String descricao,
        @NotNull TipoTransacao tipo
) {
}
