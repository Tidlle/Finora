package br.com.finora.api.dto;

import java.util.List;

public record NormalizarExtratoResponse(
        List<TransacaoNormalizadaDto> transacoesNormalizadas,
        ResumoNormalizacaoDto resumo
) {}
