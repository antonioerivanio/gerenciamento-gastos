import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Edit3,
  LogOut,
  Plus,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import {
  createMovimentacao,
  deleteMovimentacao,
  listMovimentacoes,
  updateMovimentacao,
} from "../services/api.js";

const emptyForm = {
  tipo: "SAIDA",
  descricao: "",
  categoria: "",
  valor: "",
  data: new Date().toLocaleDateString("en-CA"),
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function Dashboard({ session, onSignOut }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadMovimentacoes = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      console.log("session.access_token", session.access_token);
      const data = await listMovimentacoes(session.access_token);

      setMovimentacoes(data);
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [session.access_token]);

  useEffect(() => {
    loadMovimentacoes();
  }, [loadMovimentacoes]);

  const totals = useMemo(
    () =>
      movimentacoes.reduce(
        (result, item) => {
          const value = Number(item.valor);
          result[item.tipo === "ENTRADA" ? "entradas" : "saidas"] += value;
          return result;
        },
        { entradas: 0, saidas: 0 },
      ),
    [movimentacoes],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const payload = {
      ...form,
      valor: parseCurrencyInput(form.valor),
    };

    try {
      if (editingId) {
        const updated = await updateMovimentacao(
          session.access_token,
          editingId,
          payload,
        );
        setMovimentacoes((current) =>
          current.map((item) => (item.id === editingId ? updated : item)),
        );
        setFeedback({ type: "success", message: "Movimentacao atualizada." });
      } else {
        const created = await createMovimentacao(session.access_token, payload);
        setMovimentacoes((current) => [created, ...current]);
        setFeedback({ type: "success", message: "Movimentacao cadastrada." });
      }

      resetForm();
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(item) {
    setEditingId(item.id);
    setForm({
      tipo: item.tipo,
      descricao: item.descricao,
      categoria: item.categoria,
      valor: String(item.valor),
      data: item.data,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    setFeedback(null);

    try {
      await deleteMovimentacao(session.access_token, id);
      setMovimentacoes((current) => current.filter((item) => item.id !== id));

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    }
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function formatCurrencyInput(value) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    return currencyFormatter.format(Number(digits) / 100);
  }

  function parseCurrencyInput(value) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      return 0;
    }

    return Number(digits) / 100;
  }

  return (
    <main className="app-shell">
      <header className="app-topbar">
        <div className="title-row">
          <div className="brand-mark">
            <WalletCards size={28} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Controle financeiro</p>
            <h1>Gestão Financeira</h1>
          </div>
        </div>

        <div className="session-box">
          <span>{session.user.email}</span>
          <button
            className="icon-action"
            disabled={signingOut}
            onClick={handleSignOut}
            title="Sair"
            type="button"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Resumo financeiro">
        <article className="summary-card income">
          <span>Entradas</span>
          <strong>{currency.format(totals.entradas)}</strong>
        </article>
        <article className="summary-card expense">
          <span>Saidas</span>
          <strong>{currency.format(totals.saidas)}</strong>
        </article>
        <article className="summary-card balance">
          <span>Saldo</span>
          <strong>{currency.format(totals.entradas - totals.saidas)}</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <form className="movement-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {editingId ? "Edicao" : "Novo cadastro"}
              </p>
              <h2>
                {editingId ? "Editar movimentacao" : "Adicionar movimentacao"}
              </h2>
            </div>
            {editingId && (
              <button
                className="icon-action neutral"
                onClick={resetForm}
                title="Cancelar"
                type="button"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="type-switch">
            <label
              className={
                form.tipo === "ENTRADA" ? "selected income-option" : ""
              }
            >
              <input
                checked={form.tipo === "ENTRADA"}
                name="tipo"
                onChange={updateField}
                type="radio"
                value="ENTRADA"
              />
              <ArrowUpCircle size={18} aria-hidden="true" />
              Entrada
            </label>
            <label
              className={form.tipo === "SAIDA" ? "selected expense-option" : ""}
            >
              <input
                checked={form.tipo === "SAIDA"}
                name="tipo"
                onChange={updateField}
                type="radio"
                value="SAIDA"
              />
              <ArrowDownCircle size={18} aria-hidden="true" />
              Saida
            </label>
          </div>

          <label className="field">
            <span>Descricao</span>
            <input
              maxLength={120}
              name="descricao"
              onChange={updateField}
              required
              type="text"
              value={form.descricao}
            />
          </label>

          <label className="field">
            <span>Categoria</span>
            <input
              maxLength={60}
              name="categoria"
              onChange={updateField}
              required
              type="text"
              value={form.categoria}
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Valor</span>
              <input
                type="text"
                inputMode="numeric"
                name="valor"
                value={form.valor}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    valor: formatCurrencyInput(event.target.value),
                  }))
                }
                placeholder="R$ 0,00"
              />
            </label>
            <label className="field">
              <span>Data</span>
              <input
                name="data"
                onChange={updateField}
                required
                type="date"
                value={form.data}
              />
            </label>
          </div>

          <button
            className="primary-action"
            disabled={submitting}
            type="submit"
          >
            <Plus size={18} aria-hidden="true" />
            {submitting
              ? "Salvando..."
              : editingId
                ? "Salvar alteracoes"
                : "Cadastrar"}
          </button>
        </form>

        <section className="movements-panel" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Historico</p>
              <h2>Movimentacoes</h2>
            </div>
            <span className="movement-count">{movimentacoes.length}</span>
          </div>

          {feedback && (
            <p
              className={
                feedback.type === "error" ? "status-error" : "status-success"
              }
            >
              {feedback.message}
            </p>
          )}

          {loading && (
            <p className="empty-state">Carregando movimentacoes...</p>
          )}

          {!loading && movimentacoes.length === 0 && (
            <p className="empty-state">Nenhuma movimentacao cadastrada.</p>
          )}

          {!loading && movimentacoes.length > 0 && (
            <div className="movement-list">
              {movimentacoes.map((item) => (
                <article className="movement-item" key={item.id}>
                  <div className={`movement-icon ${item.tipo.toLowerCase()}`}>
                    {item.tipo === "ENTRADA" ? (
                      <ArrowUpCircle size={20} aria-hidden="true" />
                    ) : (
                      <ArrowDownCircle size={20} aria-hidden="true" />
                    )}
                  </div>
                  <div className="movement-description">
                    <strong>{item.descricao}</strong>
                    <span>
                      {item.categoria} ·{" "}
                      {new Date(`${item.data}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </span>
                  </div>
                  <strong
                    className={
                      item.tipo === "ENTRADA" ? "value-income" : "value-expense"
                    }
                  >
                    {item.tipo === "ENTRADA" ? "+" : "-"}{" "}
                    {currency.format(Number(item.valor))}
                  </strong>
                  <div className="movement-actions">
                    <button
                      className="icon-action neutral"
                      onClick={() => startEditing(item)}
                      title="Editar"
                      type="button"
                    >
                      <Edit3 size={17} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-action danger"
                      onClick={() => handleDelete(item.id)}
                      title="Excluir"
                      type="button"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
