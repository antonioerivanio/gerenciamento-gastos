package com.sistemagastos.api.movimentacao;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/movimentacoes")
public class MovimentacaoController {

    private final SupabaseMovimentacaoService service;

    public MovimentacaoController(SupabaseMovimentacaoService service) {
        this.service = service;
    }

    @GetMapping
    public List<MovimentacaoResponse> listar(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return service.listar(authorization);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoResponse criar(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @Valid @RequestBody MovimentacaoRequest request
    ) {
        return service.criar(authorization, request);
    }

    @PatchMapping("/{id}")
    public MovimentacaoResponse atualizar(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @PathVariable UUID id,
            @Valid @RequestBody MovimentacaoRequest request
    ) {
        return service.atualizar(authorization, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @PathVariable UUID id
    ) {
        service.excluir(authorization, id);
    }
}
