package br.com.finora.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarCategoriaRequest(

        @NotBlank(message = "O nome da categoria é obrigatório.")
        @Size(min = 2, max = 80, message = "O nome da categoria deve possuir entre 2 e 80 caracteres.")
        String nome
) {
}