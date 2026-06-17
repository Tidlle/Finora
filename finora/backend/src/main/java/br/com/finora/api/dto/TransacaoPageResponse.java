package br.com.finora.api.dto;

import java.util.List;

public record TransacaoPageResponse(
        List<TransacaoResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
