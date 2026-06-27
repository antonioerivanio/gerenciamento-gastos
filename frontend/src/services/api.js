const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function getHealthStatus() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Erro ao consultar status da API");
  }

  return response.json();
}

async function request(path, accessToken, options = {}) {
  console.log("API_BASE_URL", API_BASE_URL);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.detail ??
        errorBody?.message ??
        "Nao foi possivel concluir a operacao.",
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function listMovimentacoes(accessToken) {
  return request("/api/movimentacoes", accessToken);
}

export function createMovimentacao(accessToken, movimentacao) {
  return request("/api/movimentacoes", accessToken, {
    method: "POST",
    body: JSON.stringify(movimentacao),
  });
}

export function updateMovimentacao(accessToken, id, movimentacao) {
  return request(`/api/movimentacoes/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(movimentacao),
  });
}

export function deleteMovimentacao(accessToken, id) {
  return request(`/api/movimentacoes/${id}`, accessToken, {
    method: "DELETE",
  });
}
