package com.sistemagastos.api.movimentacao;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SupabaseMovimentacaoService {

    private static final ParameterizedTypeReference<List<MovimentacaoResponse>> RESPONSE_LIST =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final String supabaseAnonKey;
    private final boolean configured;

    public SupabaseMovimentacaoService(
            RestClient.Builder restClientBuilder,
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.anon-key:}") String supabaseAnonKey
    ) {
        this.supabaseAnonKey = supabaseAnonKey;
        this.configured = StringUtils.hasText(supabaseUrl) && StringUtils.hasText(supabaseAnonKey);
        this.restClient = restClientBuilder
                .baseUrl(StringUtils.hasText(supabaseUrl) ? supabaseUrl : "http://localhost")
                .build();
    }

    public List<MovimentacaoResponse> listar(String authorization) {
        validateConfiguration();

        try {
            List<MovimentacaoResponse> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/rest/v1/movimentacoes")
                            .queryParam("select", "*")
                            .queryParam("order", "data.desc,created_at.desc")
                            .build())
                    .headers(headers -> applyAuthentication(headers, authorization))
                    .retrieve()
                    .body(RESPONSE_LIST);

            return response == null ? List.of() : response;
        } catch (RestClientResponseException exception) {
            throw translateException(exception);
        }
    }

    public MovimentacaoResponse criar(String authorization, MovimentacaoRequest request) {
        return write(authorization, request, null);
    }

    public MovimentacaoResponse atualizar(
            String authorization,
            UUID id,
            MovimentacaoRequest request
    ) {
        return write(authorization, request, id);
    }

    public void excluir(String authorization, UUID id) {
        validateConfiguration();

        try {
            restClient.delete()
                    .uri(uriBuilder -> uriBuilder
                            .path("/rest/v1/movimentacoes")
                            .queryParam("id", "eq." + id)
                            .build())
                    .headers(headers -> applyAuthentication(headers, authorization))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw translateException(exception);
        }
    }

    private MovimentacaoResponse write(
            String authorization,
            MovimentacaoRequest request,
            UUID id
    ) {
        validateConfiguration();

        try {
            List<MovimentacaoResponse> response;

            if (id == null) {
                System.out.println("" + request);
                response = restClient.post()
                        .uri("/rest/v1/movimentacoes")
                        .headers(headers -> applyWriteHeaders(headers, authorization))
                        .body(request)
                        .retrieve()
                        .body(RESPONSE_LIST);
            } else {
                response = restClient.patch()
                        .uri(uriBuilder -> uriBuilder
                                .path("/rest/v1/movimentacoes")
                                .queryParam("id", "eq." + id)
                                .build())
                        .headers(headers -> applyWriteHeaders(headers, authorization))
                        .body(request)
                        .retrieve()
                        .body(RESPONSE_LIST);
            }

            if (response == null || response.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimentacao nao encontrada.");
            }

            return response.getFirst();
        } catch (RestClientResponseException exception) {
            throw translateException(exception);
        }
    }

    private void applyAuthentication(HttpHeaders headers, String authorization) {
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de acesso ausente.");
        }

        headers.set("apikey", supabaseAnonKey);
        headers.set(HttpHeaders.AUTHORIZATION, authorization);
    }

    private void applyWriteHeaders(HttpHeaders headers, String authorization) {
        applyAuthentication(headers, authorization);
        headers.set("Prefer", "return=representation");
    }

    private void validateConfiguration() {
        if (!configured) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Configure SUPABASE_URL e SUPABASE_ANON_KEY no backend."
            );
        }
    }

    private ResponseStatusException translateException(RestClientResponseException exception) {
        HttpStatus status = exception.getStatusCode().is4xxClientError()
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.BAD_GATEWAY;

        if (exception.getStatusCode().value() == 401 || exception.getStatusCode().value() == 403) {
            status = HttpStatus.UNAUTHORIZED;
        }

        return new ResponseStatusException(
                status,
                "Falha ao acessar os dados no Supabase.",
                exception
        );
    }
}
