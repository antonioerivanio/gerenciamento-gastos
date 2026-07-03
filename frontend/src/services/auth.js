import { getSupabaseClient } from './supabase.js';

function createAuthError(message, options = {}) {
  return Object.assign(new Error(message), options);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeAuthError(error) {
  if (!error) {
    return createAuthError('Nao foi possivel concluir a autenticacao.');
  }

  const message = error.message ?? '';
  const normalizedMessage = message.toLowerCase();

  if (message === 'Invalid login credentials') {
    return createAuthError('Email ou senha invalidos.');
  }

  if (message === 'Email not confirmed') {
    return createAuthError('Confirme seu email antes de acessar.');
  }

  if (
    normalizedMessage.includes('already registered') ||
    normalizedMessage.includes('user already registered') ||
    normalizedMessage.includes('already exists')
  ) {
    return createAuthError('Este email ja possui cadastro. Use Entrar ou Recuperar senha.', {
      isUserAlreadyRegistered: true,
    });
  }

  if (
    normalizedMessage.includes('email rate limit exceeded') ||
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('too many requests')
  ) {
    return createAuthError(
      'Limite de envio de email atingido no Supabase. Aguarde alguns minutos antes de tentar novamente.',
      { isRateLimit: true, retryAfterSeconds: 60 }
    );
  }

  return createAuthError(message || 'Nao foi possivel concluir a autenticacao.');
}

function assertNewSupabaseUser(data) {
  const identities = data?.user?.identities;

  if (Array.isArray(identities) && identities.length === 0) {
    throw createAuthError('Este email ja possui cadastro. Use Entrar ou Recuperar senha.', {
      isUserAlreadyRegistered: true,
    });
  }
}

export async function getCurrentSession() {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw normalizeAuthError(error);
  }

  return data.session;
}

export function subscribeToAuthChanges(callback) {
  const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
    callback(session, event);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    throw normalizeAuthError(error);
  }

  return data.session;
}

export async function signUpWithEmail({ email, password, name }) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    throw normalizeAuthError(error);
  }

  assertNewSupabaseUser(data);
  return data.session;
}

export async function requestPasswordReset({ email }) {
  const redirectTo = `${window.location.origin}/`;
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo,
  });

  if (error) {
    throw normalizeAuthError(error);
  }
}

export async function updatePassword({ password }) {
  const { error } = await getSupabaseClient().auth.updateUser({ password });

  if (error) {
    throw normalizeAuthError(error);
  }
}

export async function signOutUser() {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw normalizeAuthError(error);
  }
}