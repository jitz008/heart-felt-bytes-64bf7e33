import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installApiInterceptor } from './lib/apiInterceptor';
import { setGeminiApiKey } from './lib/geminiClient';

// One-time seed of the Gemini key the user provided for this preview.
// Override anytime via: setGeminiKey('your-new-key') in the browser console.
const SEEDED_KEY = 'AQ.Ab8RN6LeDbQydjZ7i4_iAL-rAWZntNDr_wMnvBpP09YjvOQcBQ';
if (!localStorage.getItem('pulse_gemini_api_key')) {
  setGeminiApiKey(SEEDED_KEY);
}
(window as any).setGeminiKey = setGeminiApiKey;

installApiInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
