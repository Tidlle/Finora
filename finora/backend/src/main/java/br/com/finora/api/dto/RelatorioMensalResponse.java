package br.com.finora.api.dto;

import java.util.List;

public record RelatorioMensalResponse(
        String titulo,
        String subtitulo,
        String mensagemPrincipal,
        String classificacaoGeral,
        List<SecaoRelatorioDto> secoes,
        IndicadoresRelatorioDto indicadores,
        String conclusao
) {}
