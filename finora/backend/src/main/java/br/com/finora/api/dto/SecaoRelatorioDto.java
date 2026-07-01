package br.com.finora.api.dto;

import java.util.List;

public record SecaoRelatorioDto(
        String titulo,
        String tipo,
        List<String> itens
) {}
