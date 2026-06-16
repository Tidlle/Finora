package br.com.finora.api.dto;

public record CadastroResponse(
        Long id,
        String nome,
        String email,
        int categoriasCriadas,
        String mensagem
) {
}