package br.com.finora.api.dto;

import java.time.OffsetDateTime;

public record PerfilResponse(
        Long id,
        String nome,
        String email,
        OffsetDateTime criadoEm
) {
}