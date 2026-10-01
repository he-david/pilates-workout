import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './app'
import { requestPersistence } from './platform/storage'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

void requestPersistence()

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
