import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const removeBoltBranding = () => {
  const patterns = [
    '[class*="bolt" i]',
    '[id*="bolt" i]',
    '[class*="watermark" i]',
    '[id*="watermark" i]',
    '[class*="badge" i]',
    '[id*="badge" i]',
    '.bolt-badge',
    '.bolt-watermark',
    '.bolt-logo',
    '.bolt-branding',
    '.powered-by-bolt',
    '.bolt-powered',
    '[data-testid*="bolt" i]',
    '[data-testid*="badge" i]',
    '[data-testid*="watermark" i]',
  ];

  patterns.forEach((pattern) => {
    try {
      document.querySelectorAll(pattern).forEach((el) => {
        el.remove();
      });
    } catch {
      // Ignore selector errors
    }
  });

  document.querySelectorAll('iframe[src*="bolt" i], embed[src*="bolt" i]').forEach((el) => {
    el.remove();
  });

  document.querySelectorAll('script[src*="bolt" i]').forEach((el) => {
    el.remove();
  });
};

removeBoltBranding();

const observer = new MutationObserver(() => {
  removeBoltBranding();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
