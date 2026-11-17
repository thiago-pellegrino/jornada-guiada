import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '@fontsource-variable/montserrat/wght.css';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/simulator.css';
import './styles/roadmap-matrix.css';
import './styles/print.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
