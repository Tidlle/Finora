package br.com.finora.api.dto;

public record TransacaoBrutaDto(
        int linha,
        String dataOriginal,
        String descricaoOriginal,
        String valorOriginal,
        String tipoOriginal,
        String categoriaOriginal
) {}
