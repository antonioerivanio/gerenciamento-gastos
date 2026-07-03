import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import LoginPage from './components/LoginPage.jsx';
import {
  getCurrentSession,
  requestPasswordReset,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthChanges,
  updatePassword,
} from './services/auth.js';
import { isSupabaseConfigured } from './services/supabase.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(isSupabaseConfigured);
  const [recoveringPassword, setRecoveringPassword] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    let active = true;

    getCurrentSession()
      .then((currentSession) => {
        if (active) {
          setSession(currentSession);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingSession(false);
        }
      });

    const unsubscribe = subscribeToAuthChanges((currentSession, event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveringPassword(true);
      }

      setSession(currentSession);
      setLoadingSession(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(payload) {
    await updatePassword(payload);
    setRecoveringPassword(false);
  }

  if (loadingSession) {
    return (
      <main className="loading-shell">
        <div className="loading-panel">
          <span className="loading-dot" aria-hidden="true" />
          <p>Validando acesso...</p>
        </div>
      </main>
    );
  }

  if (!session || recoveringPassword) {
    return (
      <LoginPage
        configMissing={!isSupabaseConfigured}
        recoveringPassword={recoveringPassword}
        onPasswordReset={requestPasswordReset}
        onSignIn={signInWithEmail}
        onSignUp={signUpWithEmail}
        onUpdatePassword={handleUpdatePassword}
      />
    );
  }

  return <Dashboard onSignOut={signOutUser} session={session} />;
}