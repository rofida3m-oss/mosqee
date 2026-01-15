import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to mount React application:", error);
  const container = document.getElementById('error-container');
  if (container) {
      container.style.display = 'block';
      container.innerHTML = `
        <div style="padding:20px;text-align:center;color:#ef4444">
            <h1 style="font-size:1.5rem;font-weight:bold;margin-bottom:1rem">عذراً، حدث خطأ في تحميل التطبيق</h1>
            <p>${error instanceof Error ? error.message : String(error)}</p>
            <button onclick="window.location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#059669;color:white;border:none;border-radius:0.5rem;cursor:pointer">إعادة التحميل</button>
        </div>
      `;
  }
}