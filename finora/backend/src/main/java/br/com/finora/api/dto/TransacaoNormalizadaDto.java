package br.com.finora.api.dto;

import java.util.List;

public record TransacaoNormalizadaDto(
        int linha,
        String descricaoOriginal,
        String descricaoLimpa,
        String dataOriginal,
        String dataNormalizada,
        String valorOriginal,
        Double valorNormalizado,
        String tipoDetectado,
        Long categoriaSugeridaId,
        String categoriaSugeridaNome,
        double confianca,
        String origemSugestao,
        boolean possivelDuplicada,
        String motivoDuplicidade,
        String status,
        List<String> mensagens
) {}
