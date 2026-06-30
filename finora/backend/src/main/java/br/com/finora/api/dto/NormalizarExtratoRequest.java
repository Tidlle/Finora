package br.com.finora.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record NormalizarExtratoRequest(
        @NotNull @Valid List<TransacaoBrutaDto> transacoesBrutas
) {}
