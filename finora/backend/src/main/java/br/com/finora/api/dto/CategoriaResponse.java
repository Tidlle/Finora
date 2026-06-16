package br.com.finora.api.dto;

import br.com.finora.api.enums.TipoTransacao;

public record CategoriaResponse(
        Long id,
        String nome,
        TipoTransacao tipo,
        boolean padrao,
        long totalTransacoes,
        boolean permiteEdicao,
        boolean permiteExclusao
) {
}