import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { useThemeStore } from './store/themeStore.ts'
import './index.css'

// Check on load
useThemeStore.getState().initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
