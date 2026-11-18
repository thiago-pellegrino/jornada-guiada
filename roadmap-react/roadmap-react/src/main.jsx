import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { JourneyProvider } from './journey/JourneyContext.jsx';
import ArtifactViewer from './components/journey/ArtifactViewer.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import AuthGate from './auth/AuthGate.jsx';
import '@fontsource-variable/montserrat/wght.css';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/simulator.css';
import './styles/roadmap-matrix.css';
import './styles/journey.css';
import './styles/darklab.css';
import './styles/notebooks.css';
import './styles/settings.css';
import './styles/login.css';
import './styles/refinements.css';
import './styles/print.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <JourneyProvider>
          <App />
          <ArtifactViewer />
        </JourneyProvider>
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
);
