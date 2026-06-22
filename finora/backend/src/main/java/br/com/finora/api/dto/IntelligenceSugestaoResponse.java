package br.com.finora.api.dto;

public record IntelligenceSugestaoResponse(
        Long categoriaId,
        String categoriaNome,
        Double confianca,
        String motivo
) {
}
