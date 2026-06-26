import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import LoginPage from './components/LoginPage.jsx';
import {
  getCurrentSession,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from './services/auth.js';
import { isSupabaseConfigured } from './services/supabase.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(isSupabaseConfigured);

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

    const unsubscribe = subscribeToAuthChanges((currentSession) => {
      setSession(currentSession);
      setLoadingSession(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

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

  if (!session) {
    return (
      <LoginPage
        configMissing={!isSupabaseConfigured}
        onSignIn={signInWithEmail}
        onSignUp={signUpWithEmail}
      />
    );
  }

  return <Dashboard onSignOut={signOutUser} session={session} />;
}
