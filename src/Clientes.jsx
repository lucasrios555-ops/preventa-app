import { useState, useEffect } from 'react'
import './App.css'

function Clientes({ onVolver }) {
  // Datos
  const [listaClientes, setListaClientes] = useState([])
  
  // Formulario (Nuevo/Editar)
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [listaPrecios, setListaPrecios] = useState('General') 

  // Filtro de Búsqueda (Separado del formulario)
  const [filtroNombre, setFiltroNombre] = useState('') 

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
    c.nombre && String(c.nombre).toLowerCase().includes(filtroNombre.toLowerCase())
  )

  // --- CAPTURAR GPS ---
  const capturarUbicacion = (e) => {
    e.preventDefault() 
    if (!navigator.geolocation) return alert("GPS no soportado")
    
    setGpsStatus('Buscando señal...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        setGpsStatus('✅ GPS OK')
      },
      (err) => {
        console.error(err)
        setGpsStatus('❌ Error GPS')
      },
      { enableHighAccuracy: true }
    )
  }

  // --- GUARDAR / EDITAR ---
  const handleGuardar = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return alert("El nombre es obligatorio")

    const nuevoCliente = {
      id: idEdicion || Date.now(),
      nombre: nombre.toUpperCase(),
      direccion: direccion || '',
      telefono: telefono || '',
      lista: listaPrecios, 
      lat: lat || null,
      lon: lon || null,
      top10: idEdicion ? (listaClientes.find(c => c.id === idEdicion)?.top10 || []) : []
    }

    let nuevaLista;
    if (idEdicion) {
      nuevaLista = listaClientes.map(c => c.id === idEdicion ? nuevoCliente : c)
      alert("Cliente actualizado correctamente.")
    } else {
      nuevaLista = [...listaClientes, nuevoCliente]
      alert("Cliente creado correctamente.")
    }

    setListaClientes(nuevaLista)
    localStorage.setItem('clientes', JSON.stringify(nuevaLista))
    limpiarFormulario()
  }

  const cargarParaEditar = (cliente) => {
    setIdEdicion(cliente.id)
    setNombre(cliente.nombre)
    setDireccion(cliente.direccion)
    setTelefono(cliente.telefono)
    setLat(cliente.lat)
    setLon(cliente.lon)
    setGpsStatus(cliente.lat ? '✅ GPS Registrado' : '')
    
    if (cliente.lista && String(cliente.lista).toLowerCase().includes('may')) {
        setListaPrecios('Mayorista');
    } else {
        setListaPrecios('General');
    }
    setFiltroNombre('') 
  }

  const borrarCliente = (id) => {
    if (!confirm("¿Seguro de borrar este cliente?")) return
    const filtrada = listaClientes.filter(c => c.id !== id)
    setListaClientes(filtrada)
    localStorage.setItem('clientes', JSON.stringify(filtrada))
  }

  const limpiarFormulario = () => {
    setIdEdicion(null)
    setNombre('')
    setDireccion('')
    setTelefono('')
    setLat('')
    setLon('')
    setGpsStatus('')
    setListaPrecios('General')
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '6px',
    border: '1px solid #555',
    background: '#222',
    color: 'white',
    fontSize: '0.9rem'
  }

  // --- RENDER ---
  return (
    <div className="main-container" style={{ 
        height: '100vh', // Ocupa toda la altura de la pantalla
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start',
        overflow: 'hidden', // Evita scroll general
        padding: '10px',
        boxSizing: 'border-box'
    }}>
      
      <h2 style={{margin: '0 0 10px 0', fontSize:'1.5rem'}}>👥 Gestión Clientes</h2>
      
      {/* 1. SECCIÓN FIJA SUPERIOR (FORMULARIO) */}
      <div style={{ 
          flexShrink: 0, // No se encoge
          background: '#1e1e1e', 
          padding: '10px', 
          borderRadius: '8px', 
          width: '100%', 
          maxWidth: '350px', 
          border: '1px solid #333',
          marginBottom: '10px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#4caf50', fontSize:'1rem' }}>
            {idEdicion ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
        </h3>
        
        <form onSubmit={handleGuardar}>
          <div style={{display:'flex', gap:'5px'}}>
              <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} style={inputStyle} />
          </div>
          <div style={{display:'flex', gap:'5px'}}>
              <input type="tel" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
              <select value={listaPrecios} onChange={e => setListaPrecios(e.target.value)} style={{...inputStyle, background: '#333', cursor:'pointer'}}>
                <option value="General">🛒 General</option>
                <option value="Mayorista">🏭 Mayorista</option>
              </select>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <button type="button" onClick={capturarUbicacion} style={{ background: '#2196f3', fontSize: '0.8rem', padding: '6px' }}>📍 GPS</button>
            <span style={{ fontSize: '0.7rem', color: lat ? '#4caf50' : '#888' }}>{gpsStatus || 'Sin GPS'}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, background: '#4caf50', padding:'8px' }}>{idEdicion ? 'Actualizar' : 'Guardar'}</button>
            {idEdicion && <button type="button" onClick={limpiarFormulario} style={{ background: '#666', padding:'8px' }}>Cancelar</button>}
          </div>
        </form>
      </div>

      {/* 2. SECCIÓN CENTRAL (LISTA CON SCROLL) */}
      {/* Esta sección ocupará todo el espacio disponible (flex: 1) y tendrá scroll interno */}
      <div style={{ 
          flex: 1, // Toma el espacio restante
          overflowY: 'auto', // Scroll interno solo aquí
          width: '100%', 
          maxWidth: '350px',
          borderTop: '1px solid #333',
          borderBottom: '1px solid #333',
          marginBottom: '10px',
          paddingRight: '5px' // Espacio para el scrollbar
      }}>
         {!idEdicion && (
             <div style={{position: 'sticky', top: 0, background: '#242424', paddingTop: '5px', paddingBottom:'5px', zIndex: 10}}>
                <input 
                  type="text" 
                  placeholder="🔍 Buscar cliente..." 
                  value={filtroNombre} 
                  onChange={e => setFiltroNombre(e.target.value)}
                  style={{...inputStyle, margin: 0, border:'1px solid #666'}}
                />
             </div>
         )}

        <ul style={{ listStyle: 'none', padding: 0, marginTop: '5px' }}>
          {clientesFiltrados.map(cliente => (
            <li key={cliente.id} style={{ 
              background: '#2a2a2a', 
              marginBottom: '8px', 
              padding: '10px', 
              borderRadius: '6px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderLeft: cliente.lista && String(cliente.lista).toLowerCase().includes('may') ? '4px solid #e91e63' : '4px solid #4caf50'
            }}>
              <div style={{flex: 1}}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white' }}>{cliente.nombre}</div>
                
                <div style={{marginTop: '2px', marginBottom: '2px'}}>
                   {cliente.lista && String(cliente.lista).toLowerCase().includes('may') 
                     ? <span style={{fontSize:'0.65rem', background:'#e91e63', color:'white', padding:'1px 5px', borderRadius:'3px'}}>MAYORISTA</span>
                     : <span style={{fontSize:'0.65rem', background:'#333', color:'#aaa', padding:'1px 5px', borderRadius:'3px', border:'1px solid #444'}}>GENERAL</span>
                   }
                </div>
                
                {cliente.telefono && <span style={{ color: '#4caf50', fontSize: '0.75rem', display:'block' }}>📞 {cliente.telefono}</span>}
                <span style={{ color: '#bbb', fontSize: '0.8rem' }}>{cliente.direccion}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => cargarParaEditar(cliente)} style={{ fontSize: '1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', padding:'2px' }} title="Editar">✏️</button>
                <button onClick={() => borrarCliente(cliente.id)} style={{ fontSize: '1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', padding:'2px' }} title="Borrar">🗑</button>
              </div>
            </li>
          ))}
        </ul>
        
        {clientesFiltrados.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>Sin resultados.</p>
        )}
      </div>

      {/* 3. SECCIÓN FIJA INFERIOR (BOTÓN VOLVER) */}
      <div style={{ flexShrink: 0, width: '100%', maxWidth: '350px' }}>
        <button onClick={onVolver} style={{ background: '#333', border: '1px solid #555', color: '#ddd', borderRadius: '8px', width: '100%', padding:'12px', fontWeight:'bold' }}>
          ⬅ Volver al Menú
        </button>
      </div>
    </div>
  )
}

export default Clientes