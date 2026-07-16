import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, UserRound, WalletCards } from 'lucide-react';

const SIGN_UP_COOLDOWN_SECONDS = 60;

function getSubmitLabel({ submitting, isBlockedByCooldown, cooldownRemaining, mode }) {
  if (submitting) {
    return 'Aguarde...';
  }

  if (isBlockedByCooldown) {
    return `Tente novamente em ${cooldownRemaining}s`;
  }

  if (mode === 'signUp') {
    return 'Criar conta';
  }

  if (mode === 'forgotPassword') {
    return 'Enviar link de recuperacao';
  }

  if (mode === 'resetPassword') {
    return 'Salvar nova senha';
  }

  return 'Entrar';
}

export default function LoginPage({
  configMissing,
  recoveringPassword,
  onPasswordReset,
  onSignIn,
  onSignUp,
  onUpdatePassword,
}) {
  const [mode, setMode] = useState(recoveringPassword ? 'resetPassword' : 'signIn');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const isSignIn = mode === 'signIn';
  const isSignUp = mode === 'signUp';
  const isForgotPassword = mode === 'forgotPassword';
  const isResetPassword = mode === 'resetPassword';
  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const isBlockedByCooldown = (isSignUp || isForgotPassword) && cooldownRemaining > 0;

  useEffect(() => {
    if (recoveringPassword) {
      setMode('resetPassword');
      setFeedback({ type: 'success', message: 'Informe sua nova senha para concluir a recuperacao.' });
    }
  }, [recoveringPassword]);

  useEffect(() => {
    if (!cooldownUntil) {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  function startCooldown(seconds = SIGN_UP_COOLDOWN_SECONDS) {
    setNow(Date.now());
    setCooldownUntil(Date.now() + seconds * 1000);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFeedback({ type: null, message: null });
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    if ((isSignIn || isSignUp || isForgotPassword) && !form.email.trim()) {
      return 'Informe o email.';
    }

    if ((isSignIn || isSignUp || isResetPassword) && form.password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (isSignUp && !form.name.trim()) {
      return 'Informe o nome.';
    }

    if (isResetPassword && form.password !== form.confirmPassword) {
      return 'A confirmacao de senha nao confere.';
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isBlockedByCooldown) {
      setFeedback({
        type: 'error',
        message: `Aguarde ${cooldownRemaining}s antes de tentar novamente.`,
      });
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setFeedback({ type: 'error', message: validationMessage });
      return;
    }

    setFeedback({ type: null, message: null });
    setSubmitting(true);

    try {
      if (isSignUp) {
        const session = await onSignUp(form);

        if (!session) {
          startCooldown();
          setFeedback({
            type: 'success',
            message: 'Cadastro criado. Verifique seu email para liberar o acesso.',
          });
        }
      } else if (isForgotPassword) {
        await onPasswordReset(form);
        startCooldown();
        setFeedback({
          type: 'success',
          message: 'Enviamos um link de recuperacao para o email informado.',
        });
      } else if (isResetPassword) {
        await onUpdatePassword(form);
        setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
        setMode('signIn');
        setFeedback({ type: 'success', message: 'Senha alterada com sucesso. Entre com a nova senha.' });
      } else {
        await onSignIn(form);
      }
    } catch (error) {
      if (error.isRateLimit) {
        startCooldown(error.retryAfterSeconds);
      }

      if (error.isUserAlreadyRegistered) {
        setMode('forgotPassword');
      }

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

        {!isResetPassword && (
          <div className="mode-switch" aria-label="Modo de acesso">
            <button
              className={isSignIn ? 'active' : ''}
              type="button"
              onClick={() => changeMode('signIn')}
            >
              Entrar
            </button>
            <button
              className={isSignUp ? 'active' : ''}
              type="button"
              onClick={() => changeMode('signUp')}
            >
              Criar conta
            </button>
          </div>
        )}

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
                  disabled={configMissing || submitting || isBlockedByCooldown}
                  name="name"
                  onChange={updateField}
                  required
                  type="text"
                  value={form.name}
                />
              </div>
            </label>
          )}

          {!isResetPassword && (
            <label className="field">
              <span>Email</span>
              <div className="input-control">
                <Mail size={18} aria-hidden="true" />
                <input
                  autoComplete="email"
                  disabled={configMissing || submitting || isBlockedByCooldown}
                  name="email"
                  onChange={updateField}
                  required
                  type="email"
                  value={form.email}
                />
              </div>
            </label>
          )}

          {!isForgotPassword && (
            <label className="field">
              <span>{isResetPassword ? 'Nova senha' : 'Senha'}</span>
              <div className="input-control">
                <Lock size={18} aria-hidden="true" />
                <input
                  autoComplete={isSignUp || isResetPassword ? 'new-password' : 'current-password'}
                  disabled={configMissing || submitting || isBlockedByCooldown}
                  minLength={6}
                  name="password"
                  onChange={updateField}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                />
                <button
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="password-toggle"
                  disabled={configMissing || submitting || isBlockedByCooldown}
                  onClick={() => setShowPassword((current) => !current)}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>
          )}

          {isResetPassword && (
            <label className="field">
              <span>Confirmar nova senha</span>
              <div className="input-control">
                <KeyRound size={18} aria-hidden="true" />
                <input
                  autoComplete="new-password"
                  disabled={configMissing || submitting}
                  minLength={6}
                  name="confirmPassword"
                  onChange={updateField}
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                />
                <button
                  aria-label={showConfirmPassword ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
                  className="password-toggle"
                  disabled={configMissing || submitting}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  title={showConfirmPassword ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
                  type="button"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>
          )}

          {feedback.message && (
            <p className={feedback.type === 'error' ? 'status-error' : 'status-success'}>
              {feedback.message}
            </p>
          )}

          <button
            className="primary-action"
            disabled={configMissing || submitting || isBlockedByCooldown}
            type="submit"
          >
            {getSubmitLabel({ submitting, isBlockedByCooldown, cooldownRemaining, mode })}
          </button>

          {!isResetPassword && (
            <button
              className="link-action"
              disabled={configMissing || submitting}
              type="button"
              onClick={() => changeMode(isForgotPassword ? 'signIn' : 'forgotPassword')}
            >
              {isForgotPassword ? 'Voltar para entrar' : 'Recuperar senha'}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}