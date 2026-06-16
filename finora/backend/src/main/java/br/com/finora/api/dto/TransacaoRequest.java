package br.com.finora.api.dto;

import br.com.finora.api.enums.TipoTransacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoRequest(

        @NotBlank(message = "A descrição é obrigatória.")
        @Size(min = 2, max = 150, message = "A descrição deve possuir entre 2 e 150 caracteres.")
        String descricao,

        @NotNull(message = "O valor é obrigatório.")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.")
        BigDecimal valor,

        @NotNull(message = "O tipo da transação é obrigatório.")
        TipoTransacao tipo,

        @NotNull(message = "A data da transação é obrigatória.")
        LocalDate dataTransacao,

        @Size(max = 255, message = "A observação deve possuir no máximo 255 caracteres.")
        String observacao,

        @NotNull(message = "A categoria é obrigatória.")
        Long categoriaId
) {
}