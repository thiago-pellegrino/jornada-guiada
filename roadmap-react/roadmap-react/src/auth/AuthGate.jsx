import { useAuth } from './AuthContext.jsx';
import LoginScreen from '../components/auth/LoginScreen.jsx';

/** Mostra a tela de acesso até haver sessão; depois, a aplicação. */
export default function AuthGate({ children }) {
  const { session } = useAuth();
  return session ? children : <LoginScreen />;
}
