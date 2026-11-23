import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { isAuthenticated, onAuthExpired } from './utils/auth';
import LoginDialog from './components/LoginDialog';
import './utils/version'; // Force cache refresh

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    onAuthExpired(() => setAuthed(false));
  }, []);

  return (
    <>
      {authed && <RouterProvider router={router} />}
      <LoginDialog open={!authed} onSuccess={() => setAuthed(true)} />
    </>
  );
}
