package br.com.finora.api.dto;

public record AprendizadoCategoriaResponse(
        String mensagem,
        String descricaoNormalizada,
        Long categoriaId,
        String categoriaNome,
        Integer quantidadeUsos
) {}
