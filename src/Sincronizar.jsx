import { useState, useEffect } from 'react'
import './App.css'

// ⚠️ ASEGÚRATE DE QUE ESTA URL SEA LA DE TU ÚLTIMA IMPLEMENTACIÓN (V3)
const URL_API = "https://script.google.com/macros/s/AKfycbwiTJVYq5D8GgsGJWYfhdwZiMcWff8bFuDdTOcJvTtzUGN7SgkvSPLzn-UBOqsr-pWb/exec"; 

function Sincronizar({ onVolver }) {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
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


  // =======================================================
  // 1. BAJAR DATOS (PRODUCTOS, CLIENTES, OBJETIVOS)
  // =======================================================
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
      setClientes(dataCli) 

      // 3. Objetivos
      const resObj = await fetch(`${URL_API}?op=objetivos`)
      const dataObj = await resObj.json()
      localStorage.setItem('objetivos', JSON.stringify(dataObj))

      setMensaje(`✅ Sincronizado: ${dataProd.length} prod, ${dataCli.length} cli y Objetivos.`)
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al bajar datos. Verifica la URL y tu conexión.')
    }
    setLoading(false)
  }

  // =======================================================
  // FUNCIONES CORE (REUTILIZABLES)
  // =======================================================
  
  // A. Lógica pura de subir Clientes
  const _apiSubirClientes = async (listaClientesGPS) => {
    if (listaClientesGPS.length === 0) return true; // Nada que subir, es un éxito técnico
    
    await fetch(`${URL_API}?op=guardar_clientes`, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listaClientesGPS)
    })
    return true;
  }

  // B. Lógica pura de subir Pedidos
  const _apiSubirPedidos = async (listaPedidos) => {
    if (listaPedidos.length === 0) return true;

    await fetch(URL_API, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listaPedidos)
    })
    return true;
  }


  // =======================================================
  // 2. BOTONES INDIVIDUALES (Mantienen tus alertas y diagnósticos)
  // =======================================================

  const botonSubirPedidosIndividual = async () => {
    if (pedidos.length === 0) return alert('No hay pedidos para subir')
    
    // --- ZONA DE DIAGNÓSTICO (PRESERVADA) ---
    const primerPedido = pedidos[0];
    const tieneObs = primerPedido.hasOwnProperty('observacion');
    const textoObs = primerPedido.observacion;
    alert(`🕵️‍♂️ DIAGNÓSTICO DE ENVÍO:\n\nCliente: ${primerPedido.cliente}\nCampo 'observacion' existe: ${tieneObs ? 'SI' : 'NO'}\nContenido: "${textoObs}"`);

    if (!tieneObs || textoObs === undefined) {
      alert("⚠️ ALERTA CRÍTICA: La observación está undefined. Revisa Pedidos.jsx");
      return; 
    }
    // ----------------------------------------

    setLoading(true); setMensaje('Subiendo pedidos (Individual)...')
    try {
      await _apiSubirPedidos(pedidos)
      setMensaje('✅ Pedidos enviados.')
      
      if(window.confirm('Se enviaron los pedidos. ¿Borrar historial local?')) {
         localStorage.removeItem('pedidos')
         setPedidos([])
      }
    } catch (error) {
      setMensaje('❌ Error al subir pedidos.')
    }
    setLoading(false)
  }

  const botonSubirClientesGPS = async () => {
    const clientesConGPS = clientes.filter(c => c.lat && c.lon)
    if (clientesConGPS.length === 0) return alert("No hay clientes con GPS para subir.")

    const confirmar = confirm(`¿Subir ${clientesConGPS.length} clientes con ubicación a la nube?`)
    if (!confirmar) return;

    setLoading(true); setMensaje(`Subiendo ${clientesConGPS.length} clientes...`)
    try {
      await _apiSubirClientes(clientesConGPS)
      setMensaje('✅ Datos GPS enviados.')
      alert('✅ Envío realizado.')
    } catch (error) {
      setMensaje('❌ Error al subir clientes.')
    }
    setLoading(false)
  }


  // =======================================================
  // 3. NUEVA FUNCIÓN: SUBIR TODO (RECOMENDADA)
  // =======================================================
  const subirTodo = async () => {
    if (pedidos.length === 0 && clientes.filter(c => c.lat).length === 0) {
      return alert("No hay nada nuevo (ni pedidos ni GPS) para subir.");
    }

    if (!confirm("¿Confirmar SUBIDA TOTAL?\n\n1. Se actualizarán clientes con GPS.\n2. Se enviarán los pedidos pendientes.")) {
      return;
    }

    setLoading(true); setMensaje('🚀 Iniciando subida total...')

    try {
      // PASO 1: CLIENTES CON GPS
      const clientesConGPS = clientes.filter(c => c.lat && c.lon)
      if (clientesConGPS.length > 0) {
        setMensaje(`📡 Subiendo ${clientesConGPS.length} clientes con GPS...`)
        await _apiSubirClientes(clientesConGPS)
      }

      // PASO 2: PEDIDOS
      if (pedidos.length > 0) {
        // Pausa de seguridad de 1 seg para no saturar Google Script (opcional pero recomendada)
        setMensaje('⏳ Esperando servidor...')
        await new Promise(r => setTimeout(r, 1000)); 

        setMensaje(`📝 Subiendo ${pedidos.length} pedidos...`)
        
        // Verificación silenciosa de observación para no romper flujo, pero loguear si falla
        const primerPedido = pedidos[0];
        if (primerPedido && primerPedido.observacion === undefined) {
           throw new Error("Estructura de pedido inválida (observación missing)");
        }

        await _apiSubirPedidos(pedidos)
        
        // BORRADO AUTOMÁTICO SEGURO
        localStorage.removeItem('pedidos')
        setPedidos([])
      }

      setMensaje('✅ ¡TODO SINCRONIZADO CORRECTAMENTE!')
      alert('✅ Sincronización completa. Los pedidos locales han sido limpiados.')

    } catch (error) {
      console.error(error)
      setMensaje('❌ Error en el proceso. Intenta subir individualmente.')
      alert('Ocurrió un error. Tus pedidos NO se han borrado por seguridad.')
    }
    setLoading(false)
  }


  return (
    <div className="main-container">
      <h2>☁️ Sincronización Nube</h2>
      {loading && <p style={{color: 'orange', fontWeight: 'bold'}}>⏳ {mensaje}</p>}
      {!loading && mensaje && <p style={{color: '#4caf50', fontWeight: 'bold'}}>{mensaje}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', width: '300px' }}>
        
        {/* BOTÓN PRINCIPAL RECOMENDADO */}
        <button className="menu-btn" onClick={subirTodo} disabled={loading} style={{ 
          background: 'linear-gradient(45deg, #1e88e5, #42a5f5)', 
          color: 'white', 
          borderColor: '#1565c0',
          padding: '20px',
          fontSize: '1.2rem',
          boxShadow: '0 4px 10px rgba(33, 150, 243, 0.4)'
        }}>
          🚀 SUBIR TODO
          <div style={{fontSize: '0.8rem', fontWeight: 'normal', marginTop: '5px'}}>
            (GPS + Pedidos)
          </div>
        </button>

        <hr style={{width: '100%', borderColor: '#444', margin: '10px 0'}} />

        {/* BOTONES INDIVIDUALES (LEGACY / DEBUG) */}
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="menu-btn" onClick={descargarDatos} disabled={loading} style={{ flex: 1, background: '#e1bee7', borderColor: '#8e24aa', fontSize: '0.9rem' }}>
            ⬇️ BAJAR
          </button>

          <button className="menu-btn" onClick={botonSubirPedidosIndividual} disabled={loading || pedidos.length === 0} style={{ flex: 1, background: '#333', color: '#ccc', borderColor: '#555', fontSize: '0.9rem' }}>
            ⬆️ Solo Pedidos
          </button>
        </div>

        <button className="menu-btn" onClick={botonSubirClientesGPS} disabled={loading} style={{ background: '#333', color: '#ccc', borderColor: '#555', fontSize: '0.9rem', padding: '10px' }}>
           📡 Solo GPS ({clientes.filter(c => c.lat).length})
        </button>

      </div>

      <div style={{ marginTop: '25px', textAlign: 'left', width: '300px' }}>
        <h3 style={{color: '#aaa', fontSize: '1rem'}}>Historial Local ({pedidos.length})</h3>
        <ul style={{ maxHeight: '150px', overflowY: 'auto', background: '#222', padding: '10px', borderRadius: '5px', border: '1px solid #444' }}>
          {pedidos.map(p => (
            <li key={p.id} style={{ color: 'white', borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '5px' }}>
              <div style={{fontWeight: 'bold'}}>{p.cliente}</div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                <span>Total: ${p.total}</span>
                <span style={{color: '#aaa'}}>{p.fecha.split(',')[0]}</span>
              </div>
            </li>
          ))}
          {pedidos.length === 0 && <li style={{color: '#666', textAlign: 'center'}}>No hay pedidos pendientes</li>}
        </ul>
      </div>

      <button onClick={onVolver} style={{ marginTop: '20px', padding: '10px', background: 'transparent', border: '1px solid #666', color: '#aaa', borderRadius: '20px', cursor: 'pointer' }}>
        ⬅ Volver
      </button>
    </div>
  )
}

export default Sincronizar