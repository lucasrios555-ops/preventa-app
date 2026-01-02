import { useState, useEffect } from 'react'
import './App.css'

function Objetivos({ onVolver }) {
  const [ultimoReporte, setUltimoReporte] = useState(null)
  const [historial, setHistorial] = useState([])

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('objetivos')) || []
      
      // Si hay datos, tomamos el último (asumiendo que es el más reciente)
      if (data.length > 0) {
        setHistorial(data)
        setUltimoReporte(data[data.length - 1])
      }
    } catch (error) {
      console.error("Error leyendo objetivos:", error)
    }
  }, [])

  // Función para formatear moneda ARS
  const formatoDinero = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(Number(valor) || 0)
  }

  // Estilo de tarjeta
  const cardStyle = {
    background: '#333',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    textAlign: 'center',
    border: '1px solid #444'
  }

  return (
    <div className="main-container">
      <h2>🎯 Tablero de Objetivos</h2>

      {!ultimoReporte ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>
          <p>⚠️ No hay datos sincronizados.</p>
          <p style={{ fontSize: '0.9rem' }}>Ve a "Sincronizar" y pulsa "Bajar Datos".</p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '350px', paddingBottom: '20px' }}>
          
          <p style={{ textAlign: 'center', color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
            📅 Reporte al: {new Date(ultimoReporte.fecha).toLocaleDateString('es-AR') || ultimoReporte.fecha}
          </p>

          {/* 1. META MENSUAL */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '1rem' }}>META MENSUAL</h3>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
              {formatoDinero(ultimoReporte.meta)}
            </span>
          </div>

          {/* 2. VENTA ACUMULADA vs FALTA */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ ...cardStyle, flex: 1, borderColor: '#4caf50' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#4caf50', fontSize: '0.9rem' }}>ACUMULADO</h3>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {formatoDinero(ultimoReporte.venta)}
              </span>
            </div>
            
            <div style={{ ...cardStyle, flex: 1, borderColor: '#f44336' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#f44336', fontSize: '0.9rem' }}>FALTA</h3>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {formatoDinero(ultimoReporte.falta)}
              </span>
            </div>
          </div>

          {/* 3. PROYECCIÓN */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #333 0%, #2c3e50 100%)', border: '1px solid #2196f3' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64b5f6', fontSize: '1rem' }}>📈 PROYECCIÓN FIN DE MES</h3>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>
              {formatoDinero(ultimoReporte.proyeccion)}
            </span>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
              (Basado en ritmo actual)
            </p>
          </div>

        </div>
      )}

      <div style={{ padding: '10px', width: '100%', maxWidth: '350px' }}>
        <button onClick={onVolver} style={{ padding: '12px', background: 'transparent', border: '1px solid #666', color: '#aaa', borderRadius: '25px', width: '100%', cursor: 'pointer' }}>
          ⬅ Volver al Menú
        </button>
      </div>
    </div>
  )
}

export default Objetivos