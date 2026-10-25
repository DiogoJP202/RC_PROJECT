import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './ui/styles.css';
import './ui/g2a.css';
import './ui/rinkaku.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
