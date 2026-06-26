import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installApiInterceptor } from './lib/apiInterceptor';
import { setGeminiApiKey } from './lib/geminiClient';

// Optional preview override: setGeminiKey('your-google-ai-studio-key') in the browser console.
(window as any).setGeminiKey = setGeminiApiKey;

installApiInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
