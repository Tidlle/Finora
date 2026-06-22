package br.com.finora.api.dto;

import java.util.List;

public record IntelligenceLoteResponse(
        List<IntelligenceSugestaoLoteItem> sugestoes
) {
}
