import { useState } from 'react'
import './App.css'
import Productos from './Productos'
import Clientes from './Clientes'
import Pedidos from './Pedidos'
import Sincronizar from './Sincronizar' // <--- Importar

function App() {
  const [vista, setVista] = useState('menu')

  if (vista === 'productos') return <Productos onVolver={() => setVista('menu')} />
  if (vista === 'clientes') return <Clientes onVolver={() => setVista('menu')} />
  if (vista === 'pedidos') return <Pedidos onVolver={() => setVista('menu')} />
  
  // Nueva vista conectada
  if (vista === 'sincronizar') return <Sincronizar onVolver={() => setVista('menu')} />

  return (
    <div className="main-container">
      <h1>App Preventa</h1>
      <p>Seleccione una operación</p>
      
      <div className="menu-grid">
        <button className="menu-btn" onClick={() => setVista('pedidos')}>
          📝 Tomar Pedidos
        </button>
        
        <button className="menu-btn" onClick={() => setVista('clientes')}>
          👥 Cargar Clientes
        </button>
        
        <button className="menu-btn" onClick={() => setVista('productos')}>
          📦 Cargar Productos
        </button>
        
        {/* Botón activo */}
        <button className="menu-btn sync-btn" onClick={() => setVista('sincronizar')}>
          🔄 Sincronizar
        </button>
      </div>
    </div>
  )
}

export default App