import { useState } from 'react'
import './App.css'
import Productos from './Productos'
import Clientes from './Clientes'
import Pedidos from './Pedidos'
import Sincronizar from './Sincronizar'
import Objetivos from './Objetivos' // <--- IMPORTAR

function App() {
  const [vista, setVista] = useState('menu')

  if (vista === 'productos') return <Productos onVolver={() => setVista('menu')} />
  if (vista === 'clientes') return <Clientes onVolver={() => setVista('menu')} />
  if (vista === 'pedidos') return <Pedidos onVolver={() => setVista('menu')} />
  if (vista === 'sincronizar') return <Sincronizar onVolver={() => setVista('menu')} />
  
  // Nueva vista
  if (vista === 'objetivos') return <Objetivos onVolver={() => setVista('menu')} />

  return (
    <div className="main-container">
      <h1>App Preventa</h1>
      <p>Seleccione una operación</p>
      
      <div className="menu-grid">
        <button className="menu-btn" onClick={() => setVista('pedidos')}>
          📝 Tomar Pedidos
        </button>
        
        {/* Nuevo botón insertado aquí para relevancia */}
        <button className="menu-btn" onClick={() => setVista('objetivos')} style={{ borderLeft: '5px solid #ff9800' }}>
          🎯 Ver Objetivos
        </button>

        <button className="menu-btn" onClick={() => setVista('clientes')}>
          👥 Clientes
        </button>
        
        <button className="menu-btn" onClick={() => setVista('productos')}>
          📦 Productos
        </button>
        
        <button className="menu-btn sync-btn" onClick={() => setVista('sincronizar')}>
          🔄 Sincronizar
        </button>
      </div>
    </div>
  )
}

export default App