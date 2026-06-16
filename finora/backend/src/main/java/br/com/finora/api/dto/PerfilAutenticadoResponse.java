package br.com.finora.api.dto;

public record PerfilAutenticadoResponse(
        Long id,
        String nome,
        String email
) {
}