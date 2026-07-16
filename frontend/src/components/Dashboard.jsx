import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
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

const emptyReportFilters = {
  startDate: "",
  endDate: "",
  category: "ALL",
  type: "ALL",
};

const reportTypes = {
  ALL: "Todas",
  ENTRADA: "Entradas",
  SAIDA: "Saidas",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function Dashboard({ session, onSignOut }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [reportFilters, setReportFilters] = useState(emptyReportFilters);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showValues, setShowValues] = useState(true);

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

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          movimentacoes.map((item) => item.categoria?.trim()).filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second, "pt-BR")),
    [movimentacoes],
  );

  const reportMovimentacoes = useMemo(() => {
    return movimentacoes
      .filter((item) => {
        const matchesStart =
          !reportFilters.startDate || item.data >= reportFilters.startDate;
        const matchesEnd =
          !reportFilters.endDate || item.data <= reportFilters.endDate;
        const matchesCategory =
          reportFilters.category === "ALL" ||
          item.categoria === reportFilters.category;
        const matchesType =
          reportFilters.type === "ALL" || item.tipo === reportFilters.type;

        return matchesStart && matchesEnd && matchesCategory && matchesType;
      })
      .toSorted((first, second) => second.data.localeCompare(first.data));
  }, [movimentacoes, reportFilters]);

  const reportTotals = useMemo(
    () =>
      reportMovimentacoes.reduce(
        (result, item) => {
          const value = Number(item.valor);
          result[item.tipo === "ENTRADA" ? "entradas" : "saidas"] += value;
          return result;
        },
        { entradas: 0, saidas: 0 },
      ),
    [reportMovimentacoes],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateReportFilter(event) {
    const { name, value } = event.target;
    setReportFilters((current) => ({ ...current, [name]: value }));
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

  function exportCsv() {
    if (reportMovimentacoes.length === 0) {
      setFeedback({
        type: "error",
        message: "Nenhuma movimentacao encontrada para exportar.",
      });
      return;
    }

    const rows = [
      ["Data", "Tipo", "Descricao", "Categoria", "Valor"],
      ...reportMovimentacoes.map((item) => [
        formatDate(item.data),
        reportTypes[item.tipo],
        item.descricao,
        item.categoria,
        formatDecimal(Number(item.valor)),
      ]),
      [],
      ["Total entradas", "", "", "", formatDecimal(reportTotals.entradas)],
      ["Total saidas", "", "", "", formatDecimal(reportTotals.saidas)],
      [
        "Saldo",
        "",
        "",
        "",
        formatDecimal(reportTotals.entradas - reportTotals.saidas),
      ],
    ];

    downloadFile(
      buildReportFilename("csv"),
      `\uFEFF${rows.map(toCsvRow).join("\r\n")}`,
      "text/csv;charset=utf-8",
    );
  }

  function exportPdf() {
    if (reportMovimentacoes.length === 0) {
      setFeedback({
        type: "error",
        message: "Nenhuma movimentacao encontrada para exportar.",
      });
      return;
    }

    const lines = [
      "Relatorio financeiro",
      `Periodo: ${getPeriodLabel(reportFilters)}`,
      `Categoria: ${
        reportFilters.category === "ALL" ? "Todas" : reportFilters.category
      }`,
      `Tipo: ${reportTypes[reportFilters.type]}`,
      "",
      `Entradas: ${currency.format(reportTotals.entradas)}`,
      `Saidas: ${currency.format(reportTotals.saidas)}`,
      `Saldo: ${currency.format(reportTotals.entradas - reportTotals.saidas)}`,
      "",
      "Data | Tipo | Categoria | Descricao | Valor",
      ...reportMovimentacoes.map(
        (item) =>
          `${formatDate(item.data)} | ${reportTypes[item.tipo]} | ${
            item.categoria
          } | ${item.descricao} | ${currency.format(Number(item.valor))}`,
      ),
    ];

    downloadFile(
      buildReportFilename("pdf"),
      buildPdf(lines),
      "application/pdf",
    );
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
            <div className="movement-toolbar">
              <span className="movement-count">{movimentacoes.length}</span>
              <button
                aria-label={showValues ? "Ocultar valores" : "Mostrar valores"}
                className="icon-action neutral"
                onClick={() => setShowValues((current) => !current)}
                title={showValues ? "Ocultar valores" : "Mostrar valores"}
                type="button"
              >
                {showValues ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Eye size={17} aria-hidden="true" />
                )}
              </button>
            </div>
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
                    {showValues ? (
                      <>
                        {item.tipo === "ENTRADA" ? "+" : "-"}{" "}
                        {currency.format(Number(item.valor))}
                      </>
                    ) : (
                      <span className="value-hidden">••••</span>
                    )}
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

      <section className="reports-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Relatorios</p>
            <h2>Exportar por periodo e categoria</h2>
          </div>
          <span className="movement-count">{reportMovimentacoes.length}</span>
        </div>

        <div className="report-filters">
          <label className="field">
            <span>Data inicial</span>
            <input
              name="startDate"
              onChange={updateReportFilter}
              type="date"
              value={reportFilters.startDate}
            />
          </label>
          <label className="field">
            <span>Data final</span>
            <input
              name="endDate"
              onChange={updateReportFilter}
              type="date"
              value={reportFilters.endDate}
            />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select
              name="category"
              onChange={updateReportFilter}
              value={reportFilters.category}
            >
              <option value="ALL">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tipo</span>
            <select
              name="type"
              onChange={updateReportFilter}
              value={reportFilters.type}
            >
              <option value="ALL">Todas</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saidas</option>
            </select>
          </label>
        </div>

        <div className="report-summary">
          <span>Entradas: {currency.format(reportTotals.entradas)}</span>
          <span>Saidas: {currency.format(reportTotals.saidas)}</span>
          <strong>
            Saldo:{" "}
            {currency.format(reportTotals.entradas - reportTotals.saidas)}
          </strong>
        </div>

        <div className="report-actions">
          <button
            className="secondary-action"
            disabled={reportMovimentacoes.length === 0}
            onClick={exportCsv}
            type="button"
          >
            <Download size={18} aria-hidden="true" />
            CSV
          </button>
          <button
            className="secondary-action"
            disabled={reportMovimentacoes.length === 0}
            onClick={exportPdf}
            type="button"
          >
            <FileText size={18} aria-hidden="true" />
            PDF
          </button>
        </div>
      </section>
    </main>
  );
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatDecimal(value) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPeriodLabel(filters) {
  if (filters.startDate && filters.endDate) {
    return `${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`;
  }

  if (filters.startDate) {
    return `A partir de ${formatDate(filters.startDate)}`;
  }

  if (filters.endDate) {
    return `Ate ${formatDate(filters.endDate)}`;
  }

  return "Todo o periodo";
}

function toCsvRow(values) {
  return values
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(";");
}

function buildReportFilename(extension) {
  const date = new Date().toLocaleDateString("en-CA");
  return `relatorio-financeiro-${date}.${extension}`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildPdf(lines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const fontSize = 10;
  const lineHeight = 16;
  const maxChars = 96;
  const pages = [[]];
  let y = margin;

  lines
    .flatMap((line) => wrapLine(line, maxChars))
    .forEach((line) => {
      if (y > pageHeight - margin) {
        pages.push([]);
        y = margin;
      }

      pages.at(-1).push(line);
      y += lineHeight;
    });

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((page, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const stream = [
      "BT",
      `/F1 ${fontSize} Tf`,
      `${margin} ${pageHeight - margin} Td`,
      ...page.map((line, lineIndex) => {
        const lineOffset = lineIndex === 0 ? 0 : -lineHeight;
        return `0 ${lineOffset} Td (${escapePdfText(line)}) Tj`;
      }),
      "ET",
    ].join("\n");

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });

  const offsets = [0];
  let pdf = "%PDF-1.4\n";

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function wrapLine(line, maxChars) {
  if (line.length <= maxChars) {
    return [line];
  }

  const parts = [];
  let current = line;

  while (current.length > maxChars) {
    const splitAt = current.lastIndexOf(" ", maxChars);
    const index = splitAt > 20 ? splitAt : maxChars;
    parts.push(current.slice(0, index));
    current = current.slice(index).trimStart();
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function escapePdfText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()\\]/g, "\\$&");
}
