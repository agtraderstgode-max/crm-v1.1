import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installFetchInterceptor } from './lib/apiAdapter'

// Activate direct Supabase fallback for Cloudflare and web deployment
installFetchInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
