package br.com.finora.api.dto;

public record ResumoNormalizacaoDto(
        int totalLinhas,
        int prontasParaImportar,
        int precisamRevisao,
        int possiveisDuplicadas,
        int semCategoria,
        int comErro
) {}
