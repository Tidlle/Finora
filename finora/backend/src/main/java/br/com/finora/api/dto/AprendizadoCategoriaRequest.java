package br.com.finora.api.dto;

import br.com.finora.api.enums.TipoTransacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AprendizadoCategoriaRequest(
        @NotBlank String descricaoOriginal,
        @NotNull TipoTransacao tipo,
        @NotNull Long categoriaId,
        @NotBlank String categoriaNome
) {}
