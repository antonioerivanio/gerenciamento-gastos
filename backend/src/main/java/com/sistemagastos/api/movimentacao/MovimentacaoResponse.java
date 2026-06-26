package com.sistemagastos.api.movimentacao;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MovimentacaoResponse(
        UUID id,
        @JsonProperty("user_id") UUID userId,
        MovimentacaoTipo tipo,
        String descricao,
        String categoria,
        BigDecimal valor,
        LocalDate data,
        @JsonProperty("created_at") Instant createdAt
) {
}
