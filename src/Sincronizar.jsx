import { useState, useEffect } from 'react'
import './App.css'

// ⚠️ ASEGÚRATE DE QUE ESTA URL SEA LA DE TU ÚLTIMA IMPLEMENTACIÓN (V3)
const URL_API = "https://script.google.com/macros/s/AKfycbz5rUzfuqVAXiIQ2CSG8YFN4dWOY-teAeWmPj6Y4T9F3onqErBdapXAKFSlZGPcRYgi/exec"; 

function Sincronizar({ onVolver }) {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([]) // Nuevo estado para clientes
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    // Cargar historial de pedidos
    const historial = JSON.parse(localStorage.getItem('pedidos')) || []
    setPedidos(historial)

    // Cargar clientes para ver quiénes tienen GPS
    const listaClientes = JSON.parse(localStorage.getItem('clientes')) || []
    setClientes(listaClientes)
  }, [])

// En Sincronizar.jsx

  // 1. BAJAR DATOS
  const descargarDatos = async () => {
    setLoading(true); setMensaje('Conectando con Google...')
    try {
      // 1. Productos
      const resProd = await fetch(`${URL_API}?op=productos`)
      const dataProd = await resProd.json()
      localStorage.setItem('productos', JSON.stringify(dataProd))

      // 2. Clientes
      const resCli = await fetch(`${URL_API}?op=clientes`)
      const dataCli = await resCli.json()
      localStorage.setItem('clientes', JSON.stringify(dataCli))
      setClientes(dataCli) // Actualizar estado local

      // 3. OBJETIVOS (NUEVO) ---------------------------
      const resObj = await fetch(`${URL_API}?op=objetivos`)
      const dataObj = await resObj.json()
      localStorage.setItem('objetivos', JSON.stringify(dataObj))
      // ------------------------------------------------

      setMensaje(`✅ Sincronizado: ${dataProd.length} prod, ${dataCli.length} cli y Datos de Objetivos.`)
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al bajar datos. Verifica la URL y tu conexión.')
    }
    setLoading(false)
  }


  

  // 2. SUBIR PEDIDOS
  const subirPedidos = async () => {
    if (pedidos.length === 0) return alert('No hay pedidos para subir')
    
    // --- ZONA DE DIAGNÓSTICO ---
    const primerPedido = pedidos[0];
    const tieneObs = primerPedido.hasOwnProperty('observacion');
    const textoObs = primerPedido.observacion;

    alert(`🕵️‍♂️ DIAGNÓSTICO DE ENVÍO:\n\nCliente: ${primerPedido.cliente}\nCampo 'observacion' existe: ${tieneObs ? 'SI' : 'NO'}\nContenido: "${textoObs}"`);

    if (!tieneObs || textoObs === undefined) {
      alert("⚠️ ALERTA: La App NO está guardando la observación. El problema está en Pedidos.jsx");
      return; 
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

  // 3. NUEVO: SUBIR CLIENTES CON GPS
  const subirClientesGPS = async () => {
    // Filtramos solo los que tienen latitud y longitud
    const clientesConGPS = clientes.filter(c => c.lat && c.lon)

    if (clientesConGPS.length === 0) {
      return alert("No hay clientes con datos GPS registrados en este dispositivo.")
    }

    const confirmar = confirm(`Se encontraron ${clientesConGPS.length} clientes con ubicación GPS.\n\n¿Desea subirlos a la nube para actualizar la base de datos?`)
    if (!confirmar) return;

    setLoading(true); setMensaje(`Subiendo ${clientesConGPS.length} clientes con GPS...`)
    
    try {
      // Agregamos ?op=guardar_clientes para que el Script sepa que NO son pedidos
      await fetch(`${URL_API}?op=guardar_clientes`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientesConGPS)
      })

      setMensaje('✅ Datos GPS enviados a la nube.')
      alert('✅ Envío realizado.\n\nNota: Asegúrate de que tu Google Script tenga la lógica para recibir "op=guardar_clientes" en la función doPost.')

    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al subir clientes.')
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

        {/* --- BOTÓN NUEVO --- */}
        <button className="menu-btn" onClick={subirClientesGPS} disabled={loading} style={{ background: '#bbdefb', borderColor: '#1976d2' }}>
           📡 SUBIR GPS ({clientes.filter(c => c.lat).length})
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