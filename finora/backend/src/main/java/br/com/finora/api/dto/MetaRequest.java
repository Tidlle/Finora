package br.com.finora.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MetaRequest(

        @NotBlank(message = "O nome da meta é obrigatório.")
        @Size(min = 2, max = 120, message = "O nome da meta deve possuir entre 2 e 120 caracteres.")
        String nome,

        @Size(max = 255, message = "A descrição deve possuir no máximo 255 caracteres.")
        String descricao,

        @NotNull(message = "O valor objetivo é obrigatório.")
        @DecimalMin(value = "0.01", message = "O valor objetivo deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "O valor objetivo deve possuir no máximo 10 dígitos inteiros e 2 casas decimais.")
        BigDecimal valorObjetivo,

        LocalDate prazo
) {
}