package br.com.finora.api.dto;

public record IntelligenceSugestaoLoteItem(
        String descricao,
        Long categoriaId,
        String categoriaNome,
        Double confianca,
        String motivo
) {
}
