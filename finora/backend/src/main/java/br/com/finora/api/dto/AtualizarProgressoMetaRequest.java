package br.com.finora.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AtualizarProgressoMetaRequest(

        @NotNull(message = "O valor acumulado é obrigatório.")
        @DecimalMin(value = "0.00", message = "O valor acumulado não pode ser negativo.")
        @Digits(integer = 10, fraction = 2, message = "O valor acumulado deve possuir no máximo 10 dígitos inteiros e 2 casas decimais.")
        BigDecimal valorAcumulado
) {
}