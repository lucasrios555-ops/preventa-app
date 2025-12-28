import { useState, useEffect } from 'react'
import './App.css'

// ⚠️ ASEGÚRATE DE QUE ESTA URL SEA LA DE TU ÚLTIMA IMPLEMENTACIÓN (V3)
const URL_API = "https://script.google.com/macros/s/AKfycbzWKSOYfL4VMBlwmjikVG086eE-YUJ18LPrqE-0ffEV2Mf9vK2NwJf4m93IeqWpWfaX/exec"; 

function Sincronizar({ onVolver }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const historial = JSON.parse(localStorage.getItem('pedidos')) || []
    setPedidos(historial)
  }, [])

  // 1. BAJAR DATOS
  const descargarDatos = async () => {
    setLoading(true); setMensaje('Conectando con Google...')
    try {
      const resProd = await fetch(`${URL_API}?op=productos`)
      const dataProd = await resProd.json()
      localStorage.setItem('productos', JSON.stringify(dataProd))

      const resCli = await fetch(`${URL_API}?op=clientes`)
      const dataCli = await resCli.json()
      localStorage.setItem('clientes', JSON.stringify(dataCli))

      setMensaje(`✅ Sincronizado: ${dataProd.length} productos y ${dataCli.length} clientes.`)
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al bajar datos. Verifica la URL y tu conexión.')
    }
    setLoading(false)
  }

  // 2. SUBIR PEDIDOS (CON DIAGNÓSTICO)
  const subirPedidos = async () => {
    if (pedidos.length === 0) return alert('No hay pedidos para subir')
    
    // --- ZONA DE DIAGNÓSTICO ---
    const primerPedido = pedidos[0];
    const tieneObs = primerPedido.hasOwnProperty('observacion');
    const textoObs = primerPedido.observacion;

    // ESTA ALERTA TE DIRÁ LA VERDAD
    alert(`🕵️‍♂️ DIAGNÓSTICO DE ENVÍO:\n\nCliente: ${primerPedido.cliente}\nCampo 'observacion' existe: ${tieneObs ? 'SI' : 'NO'}\nContenido: "${textoObs}"`);

    if (!tieneObs || textoObs === undefined) {
      alert("⚠️ ALERTA: La App NO está guardando la observación. El problema está en Pedidos.jsx");
      return; // Detenemos el envío para no ensuciar el Excel
    }
    // ---------------------------

    setLoading(true); setMensaje('Subiendo pedidos...')
    try {
      await fetch(URL_API, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidos)
      })

      setMensaje('✅ Pedidos enviados (Verifica el Excel).')
      
      if(window.confirm('Se enviaron los pedidos. ¿Borrar historial local?')) {
         localStorage.removeItem('pedidos')
         setPedidos([])
      }

    } catch (error) {
      setMensaje('❌ Error al subir pedidos.')
    }
    setLoading(false)
  }

  return (
    <div className="main-container">
      <h2>☁️ Sincronización Nube</h2>
      {loading && <p style={{color: 'orange'}}>⏳ Procesando...</p>}
      {mensaje && <p style={{fontWeight: 'bold', color: 'white'}}>{mensaje}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', width: '300px' }}>
        <button className="menu-btn" onClick={descargarDatos} disabled={loading} style={{ background: '#e1bee7', borderColor: '#8e24aa' }}>
          ⬇️ BAJAR Datos
        </button>

        <button className="menu-btn" onClick={subirPedidos} disabled={loading || pedidos.length === 0} style={{ background: '#c8e6c9', borderColor: '#2e7d32' }}>
          ⬆️ SUBIR {pedidos.length} Pedidos
        </button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'left', width: '300px' }}>
        <h3>Historial Local ({pedidos.length})</h3>
        <ul style={{ maxHeight: '200px', overflowY: 'auto', background: '#333', padding: '10px', borderRadius: '5px' }}>
          {pedidos.map(p => (
            <li key={p.id} style={{ color: 'white', borderBottom: '1px solid #555', marginBottom: '5px' }}>
              <div>{p.cliente} - ${p.total}</div>
              <div style={{fontSize: '0.8rem', color: '#ff9800'}}>Nota: {p.observacion || '(vacío)'}</div>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onVolver} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>⬅ Volver</button>
    </div>
  )
}

export default Sincronizar