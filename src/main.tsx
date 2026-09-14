import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installerSimulation } from './socle/simulation'
import './index.css'

// Tant que le backend Spring Boot n'est pas en ligne, la simulation repond
// aux appels /api/v1/**. Le jour de la bascule, on retiré cette ligne.
installerSimulation()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
