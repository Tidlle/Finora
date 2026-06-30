package br.com.finora.api.dto;

import java.util.List;

public record ProjecoesInteligenteResponse(
        List<ProjecaoInteligenteItem> projecoes,
        ProjecaoInteligenteAnalise analise,
        List<ProjecaoInteligenteCenario> cenarios,
        List<ProjecaoInteligenteMeta> metas
) {}
