package br.com.finora.api.dto;

public record LoginResponse(
        Long id,
        String nome,
        String email,
        String token,
        String tipoToken,
        long expiraEmSegundos,
        String mensagem
) {
}