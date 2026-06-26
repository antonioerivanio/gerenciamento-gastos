import { useState } from 'react';
import { Lock, Mail, UserRound, WalletCards } from 'lucide-react';

export default function LoginPage({ configMissing, onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signIn');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signUp';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback({ type: null, message: null });
    setSubmitting(true);

    try {
      if (isSignUp) {
        const session = await onSignUp(form);

        if (!session) {
          setFeedback({
            type: 'success',
            message: 'Cadastro criado. Verifique seu email para liberar o acesso.',
          });
        }
      } else {
        await onSignIn(form);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="brand-mark">
            <WalletCards size={28} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Acesso seguro</p>
            <h1 id="login-title">Sistema de Gastos</h1>
          </div>
        </div>

        <div className="mode-switch" aria-label="Modo de acesso">
          <button
            className={!isSignUp ? 'active' : ''}
            type="button"
            onClick={() => {
              setMode('signIn');
              setFeedback({ type: null, message: null });
            }}
          >
            Entrar
          </button>
          <button
            className={isSignUp ? 'active' : ''}
            type="button"
            onClick={() => {
              setMode('signUp');
              setFeedback({ type: null, message: null });
            }}
          >
            Criar conta
          </button>
        </div>

        {configMissing && (
          <p className="status-error">
            Configure o Supabase no arquivo .env.local para habilitar o acesso.
          </p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label className="field">
              <span>Nome</span>
              <div className="input-control">
                <UserRound size={18} aria-hidden="true" />
                <input
                  autoComplete="name"
                  disabled={configMissing || submitting}
                  name="name"
                  onChange={updateField}
                  required
                  type="text"
                  value={form.name}
                />
              </div>
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <div className="input-control">
              <Mail size={18} aria-hidden="true" />
              <input
                autoComplete="email"
                disabled={configMissing || submitting}
                name="email"
                onChange={updateField}
                required
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <label className="field">
            <span>Senha</span>
            <div className="input-control">
              <Lock size={18} aria-hidden="true" />
              <input
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={configMissing || submitting}
                minLength={6}
                name="password"
                onChange={updateField}
                required
                type="password"
                value={form.password}
              />
            </div>
          </label>

          {feedback.message && (
            <p className={feedback.type === 'error' ? 'status-error' : 'status-success'}>
              {feedback.message}
            </p>
          )}

          <button className="primary-action" disabled={configMissing || submitting} type="submit">
            {submitting ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
