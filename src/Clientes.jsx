import { useState, useEffect } from 'react'
import './App.css'

function Clientes({ onVolver }) {
  // Datos
  const [listaClientes, setListaClientes] = useState([])
  
  // Formulario
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  // --- ESTADOS PARA GPS ---
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [gpsStatus, setGpsStatus] = useState('') 
  // ------------------------
  
  const [idEdicion, setIdEdicion] = useState(null)

  // Cargar datos al iniciar
  useEffect(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem('clientes')) || []
      setListaClientes(guardados)
    } catch (error) {
      console.error("Error al leer clientes:", error)
      setListaClientes([])
    }
  }, [])

  // --- LOGICA FILTRO ---
  const clientesFiltrados = listaClientes.filter(c => 
    c.nombre && String(c.nombre).toLowerCase().includes(nombre.toLowerCase())
  )

  // --- CAPTURAR GPS ---
  const capturarUbicacion = (e) => {
    e.preventDefault() 
    
    if (!navigator.geolocation) {
      setGpsStatus('❌ GPS no soportado en este dispositivo')
      return
    }

    setGpsStatus('⏳ Obteniendo satélites...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ÉXITO
        setLat(position.coords.latitude)
        setLon(position.coords.longitude)
        setGpsStatus('✅ Ubicación capturada')
      },
      (error) => {
        // ERROR
        console.error(error)
        let msg = '❌ Error GPS'
        if (error.code === 1) msg = '❌ Permiso denegado'
        if (error.code === 2) msg = '❌ Señal no disponible'
        if (error.code === 3) msg = '❌ Tiempo de espera agotado'
        setGpsStatus(msg)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // --- LOGICA GUARDAR ---
  const handleGuardar = (e) => {
    e.preventDefault()
    if (!nombre) return alert('El nombre es obligatorio')

    const clienteObj = {
      nombre: String(nombre).toUpperCase(),
      direccion,
      lat,  
      lon   
    }

    if (idEdicion) {
      // EDITAR
      const actualizados = listaClientes.map(c => 
        c.id === idEdicion ? { ...c, ...clienteObj } : c
      )
      setListaClientes(actualizados)
      localStorage.setItem('clientes', JSON.stringify(actualizados))
      alert('✅ Cliente actualizado')
    } else {
      // NUEVO
      const nuevo = { id: Date.now(), ...clienteObj }
      const nuevaLista = [...listaClientes, nuevo]
      setListaClientes(nuevaLista)
      localStorage.setItem('clientes', JSON.stringify(nuevaLista))
      alert('✅ Cliente creado')
    }

    // Limpiar form
    limpiarForm()
  }

  const cargarParaEditar = (cliente) => {
    setNombre(cliente.nombre)
    setDireccion(cliente.direccion || '')
    setLat(cliente.lat || '')
    setLon(cliente.lon || '')
    setGpsStatus(cliente.lat ? '✅ Ubicación guardada previamente' : '')
    setIdEdicion(cliente.id)
    // Enfocar input
    document.querySelector('input[name="nombreCliente"]')?.focus()
  }

  const borrarCliente = (id) => {
    if (confirm('¿Seguro borrar este cliente?')) {
      const nuevaLista = listaClientes.filter(c => c.id !== id)
      setListaClientes(nuevaLista)
      localStorage.setItem('clientes', JSON.stringify(nuevaLista))
      if (id === idEdicion) limpiarForm()
    }
  }

  const limpiarForm = () => {
    setNombre('')
    setDireccion('')
    setLat('')
    setLon('')
    setGpsStatus('')
    setIdEdicion(null)
  }

  // Estilos auxiliares
  const inputStyle = {
    padding: '10px', 
    borderRadius: '8px', 
    border: '1px solid #555',
    background: '#222',
    color: 'white',
    width: '100%',
    boxSizing: 'border-box'
  }

  return (
    // 1. Contenedor principal con altura fija y sin scroll global
    <div className="main-container" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* 2. CABECERA Y FORMULARIO (FIJO ARRIBA) */}
      <div style={{ width: '100%', maxWidth: '350px', flexShrink: 0, paddingBottom: '10px' }}>
        <h2 style={{ textAlign: 'center', margin: '10px 0' }}>👥 Gestión de Clientes</h2>
        
        <form onSubmit={handleGuardar} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          background: '#1e1e1e',
          padding: '15px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: idEdicion ? '1px solid #ff9800' : '1px solid #333'
        }}>
          <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {idEdicion ? 'EDITANDO CLIENTE:' : 'NUEVO CLIENTE / BUSCAR:'}
          </label>

          <input 
            name="nombreCliente"
            type="text" 
            placeholder="Nombre / Negocio" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
            autoComplete="off"
          />
          
          <input 
            type="text" 
            placeholder="Dirección" 
            value={direccion} 
            onChange={(e) => setDireccion(e.target.value)}
            style={inputStyle}
          />

          {/* --- SECCIÓN GPS --- */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={capturarUbicacion}
              style={{ 
                background: '#2196f3', 
                color: 'white', 
                border: 'none', 
                padding: '8px', 
                borderRadius: '5px',
                cursor: 'pointer',
                flex: 1,
                fontSize: '0.9rem'
              }}
            >
              📍 Capturar GPS
            </button>
            
            {(lat || lon) && (
              <div style={{ fontSize: '0.7rem', color: '#aaa', marginLeft: '5px', lineHeight: '1.1' }}>
                Lat: {parseFloat(lat).toFixed(4)}<br/>
                Lon: {parseFloat(lon).toFixed(4)}
              </div>
            )}
          </div>
          
          {gpsStatus && <p style={{ margin: 0, fontSize: '0.8rem', color: gpsStatus.includes('✅') ? '#4caf50' : 'orange' }}>{gpsStatus}</p>}

          {/* Botones Acción */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: idEdicion ? '#ff9800' : '#4caf50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              {idEdicion ? '💾 Actualizar' : '➕ Crear'}
            </button>
            
            {idEdicion && (
              <button type="button" onClick={limpiarForm} style={{ padding: '10px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. LISTA SCROLLEABLE (OCUPA EL ESPACIO CENTRAL) */}
      <div style={{ flex: 1, width: '100%', maxWidth: '350px', overflowY: 'auto', paddingRight: '5px', marginTop: '10px' }}>
        
        <h3 style={{ textAlign: 'left', margin: '0 0 10px 0', fontSize: '1rem', color: '#ddd' }}>
          Lista Local ({clientesFiltrados.length})
        </h3>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {clientesFiltrados.map(cliente => (
            <li key={cliente.id} style={{ 
              background: idEdicion === cliente.id ? '#3e2723' : '#333', 
              marginBottom: '8px', 
              padding: '12px', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              borderLeft: idEdicion === cliente.id ? '4px solid #ff9800' : '4px solid transparent',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '65%' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cliente.nombre}</span>
                <span style={{ color: '#bbb', fontSize: '0.85rem' }}>{cliente.direccion}</span>
                {cliente.lat && <span style={{ color: '#64b5f6', fontSize: '0.75rem', marginTop: '2px' }}>📍 GPS OK</span>}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => cargarParaEditar(cliente)} style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Editar">✏️</button>
                <button onClick={() => borrarCliente(cliente.id)} style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Borrar">🗑</button>
              </div>
            </li>
          ))}
        </ul>
        
        {clientesFiltrados.length === 0 && !nombre && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '30px' }}>No hay clientes cargados.</p>
        )}
      </div>

      {/* 4. BOTÓN VOLVER (FIJO ABAJO) */}
      <div style={{ padding: '15px 0', width: '100%', maxWidth: '350px', flexShrink: 0 }}>
        <button onClick={onVolver} style={{ padding: '12px', background: 'transparent', border: '1px solid #666', color: '#aaa', width: '100%', borderRadius: '25px', cursor: 'pointer' }}>
          ⬅️ Volver al Menú
        </button>
      </div>
    </div>
  )
}

export default Clientes