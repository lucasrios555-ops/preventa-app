import { useState, useEffect } from 'react'
import './App.css'

// URL DE TU SCRIPT DE GOOGLE (Asegúrate que sea el mismo que en Sincronizar.jsx)
// ⚠️ IMPORTANTE: Necesitaremos actualizar el Google Apps Script para que soporte esto.
const URL_API = "https://script.google.com/macros/s/AKfycbyICo_zY-cW3-4JrgN_FQ7Kl9Bd8GsL0o_8RoIfJ2zfRN7m5-C-gDJMUhzHATDr0AiQ/exec"; 

function Compras({ onVolver }) {
  const [listaCompra, setListaCompra] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Cargar persistencia local al iniciar
  useEffect(() => {
    const localData = JSON.parse(localStorage.getItem('compras_active')) || []
    setListaCompra(localData)
  }, [])

  // Guardar en local cada vez que cambia algo (para no perder datos si cierras la app)
  useEffect(() => {
    localStorage.setItem('compras_active', JSON.stringify(listaCompra))
  }, [listaCompra])

  // --- 1. DESCARGAR LISTA DESDE LA NUBE ---
  const descargarLista = async () => {
    setLoading(true)
    setMensaje('Buscando lista en Drive...')
    try {
      // Enviamos acción 'leer_compras'
      const response = await fetch(`${URL_API}?action=leer_compras`)
      const data = await response.json()
      
      if (data.exito) {
        // Mapeamos para asegurar tipos de datos numéricos
        const listaLimpia = data.datos.map(item => ({
          ...item,
          Cant_Solicitada: Number(item.Cant_Solicitada) || 0,
          Cant_Comprada: Number(item.Cant_Comprada) || 0, // Por defecto 0 o lo que venga
          Nuevo_Costo: Number(item.Nuevo_Costo) || 0,
          Nuevo_Precio: Number(item.Nuevo_Precio) || 0
        }))
        setListaCompra(listaLimpia)
        setMensaje(`✅ Lista descargada: ${listaLimpia.length} items`)
      } else {
        setMensaje('⚠️ No se encontró lista activa o hubo error.')
      }
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error de conexión')
    }
    setLoading(false)
  }

  // --- 2. SUBIR LISTA ACTUALIZADA ---
  const subirCambios = async () => {
    if (listaCompra.length === 0) return
    
    // Validación rápida
    if (!confirm("¿Confirmar compra y subir cambios a la nube?")) return

    setLoading(true)
    setMensaje('Subiendo datos...')

    try {
      const response = await fetch(URL_API, {
        method: 'POST',
        body: JSON.stringify({
          action: 'subir_compras',
          datos: listaCompra
        })
      })
      const resultado = await response.json()
      if (resultado.exito) {
        setMensaje('✅ ¡Compra actualizada en la nube!')
        // Opcional: Limpiar local si ya se subió con éxito
        // setListaCompra([]) 
      } else {
        setMensaje('❌ Error al guardar en Drive')
      }
    } catch (error) {
      setMensaje('❌ Error de red al subir')
    }
    setLoading(false)
  }

  // --- MANEJO DE INPUTS ---
  const handleChange = (index, campo, valor) => {
    const nuevaLista = [...listaCompra]
    nuevaLista[index][campo] = parseFloat(valor) || 0
    setListaCompra(nuevaLista)
  }

  // Auto-llenar cantidad comprada con solicitada (Atajo)
  const matchCantidad = (index) => {
    const nuevaLista = [...listaCompra]
    nuevaLista[index].Cant_Comprada = nuevaLista[index].Cant_Solicitada
    setListaCompra(nuevaLista)
  }

  return (
    <div className="main-container" style={{ justifyContent: 'flex-start', paddingTop: '20px' }}>
      <h2>🛒 Modo Compras</h2>
      
      {/* BOTONERA SUPERIOR */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={descargarLista} disabled={loading} style={{ background: '#2196f3', color: 'white' }}>
          {loading ? '⏳...' : '☁️ Descargar Lista'}
        </button>
        <button onClick={subirCambios} disabled={loading || listaCompra.length === 0} style={{ background: '#4caf50', color: 'white' }}>
          {loading ? '⏳...' : '☁️ Subir Compra'}
        </button>
      </div>

      {mensaje && <div style={{ marginBottom: '10px', color: '#ffeb3b' }}>{mensaje}</div>}

      {/* LISTA DE ITEMS */}
      <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '80px' }}>
        {listaCompra.map((item, index) => (
          <div key={index} style={{ 
            background: item.Cant_Comprada >= item.Cant_Solicitada ? '#1b5e20' : '#333', // Verde oscuro si completó
            padding: '15px', 
            borderRadius: '10px', 
            marginBottom: '10px',
            border: '1px solid #555'
          }}>
            {/* CABECERA ITEM */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.Producto}</span>
              <span style={{ color: '#aaa' }}>Pide: <b style={{color:'white'}}>{item.Cant_Solicitada}</b></span>
            </div>

            {/* GRILLA DE INPUTS */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              
              {/* INPUT CANTIDAD REAL */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#aaa' }}>COMPRADO</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      value={item.Cant_Comprada} 
                      onChange={(e) => handleChange(index, 'Cant_Comprada', e.target.value)}
                      style={{ width: '100%', padding: '8px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold', color: item.Cant_Comprada < item.Cant_Solicitada ? '#ff5252' : '#4caf50' }}
                    />
                    {/* Botón rápido para igualar stock */}
                    <button onClick={() => matchCantidad(index)} style={{ padding: '5px 10px', marginLeft: '5px', fontSize: '0.8rem' }}>=</button>
                </div>
              </div>

              {/* INPUT NUEVO COSTO */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#aaa' }}>$ COSTO</label>
                <input 
                  type="number" 
                  placeholder={item.Nuevo_Costo || "0"} 
                  value={item.Nuevo_Costo || ''}
                  onChange={(e) => handleChange(index, 'Nuevo_Costo', e.target.value)}
                  style={{ width: '100%', padding: '8px', textAlign: 'center' }}
                />
              </div>

              {/* INPUT NUEVO PRECIO VENTA */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#aaa' }}>$ VENTA</label>
                <input 
                  type="number" 
                  placeholder={item.Nuevo_Precio || "0"}
                  value={item.Nuevo_Precio || ''}
                  onChange={(e) => handleChange(index, 'Nuevo_Precio', e.target.value)}
                  style={{ width: '100%', padding: '8px', textAlign: 'center' }}
                />
              </div>

            </div>
          </div>
        ))}
        
        {listaCompra.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: '#666' }}>No hay lista activa.<br/>Genérala desde la PC primero.</p>
        )}
      </div>

      <button onClick={onVolver} style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 30px', borderRadius: '30px', background: '#444', border: '1px solid #666' }}>
        Volver al Menú
      </button>
    </div>
  )
}

export default Compras