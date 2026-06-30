package br.com.finora.api.dto;

import java.time.OffsetDateTime;

public record PreferenciaCategoriaDto(
        Long id,
        String descricaoOriginal,
        String descricaoNormalizada,
        String tipo,
        Long categoriaId,
        String categoriaNome,
        Integer quantidadeUsos,
        OffsetDateTime atualizadoEm
) {}
