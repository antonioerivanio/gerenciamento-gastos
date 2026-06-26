import { getSupabaseClient } from './supabase.js';

function normalizeAuthError(error) {
  if (!error) {
    return null;
  }

  if (error.message === 'Invalid login credentials') {
    return 'Email ou senha invalidos.';
  }

  if (error.message === 'Email not confirmed') {
    return 'Confirme seu email antes de acessar.';
  }

  return error.message ?? 'Nao foi possivel concluir a autenticacao.';
}

export async function getCurrentSession() {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw new Error(normalizeAuthError(error));
  }

  return data.session;
}

export function subscribeToAuthChanges(callback) {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(normalizeAuthError(error));
  }

  return data.session;
}

export async function signUpWithEmail({ email, password, name }) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    throw new Error(normalizeAuthError(error));
  }

  return data.session;
}

export async function signOutUser() {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw new Error(normalizeAuthError(error));
  }
}
