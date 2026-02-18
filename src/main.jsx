import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/utils/ErrorBoundary'

// Build Timestamp: 2026-02-18T19:40:00
console.log('App Version: 0.0.1 - Build 2');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
