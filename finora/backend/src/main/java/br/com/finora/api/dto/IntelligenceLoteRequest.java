package br.com.finora.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record IntelligenceLoteRequest(
        @NotEmpty @Valid List<IntelligenceSugestaoRequest> transacoes
) {
}
