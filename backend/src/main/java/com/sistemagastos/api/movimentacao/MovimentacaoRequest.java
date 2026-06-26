package com.sistemagastos.api.movimentacao;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MovimentacaoRequest(
        @NotNull MovimentacaoTipo tipo,
        @NotBlank @Size(max = 120) String descricao,
        @NotBlank @Size(max = 60) String categoria,
        @NotNull @DecimalMin(value = "0.01") BigDecimal valor,
        @NotNull LocalDate data
) {
}
