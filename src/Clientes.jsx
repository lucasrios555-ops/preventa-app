import { useState, useEffect } from 'react'
import './App.css'

function Clientes({ onVolver }) {
  // Datos
  const [listaClientes, setListaClientes] = useState([])
  
  // Formulario
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [idEdicion, setIdEdicion] = useState(null)

  // Cargar datos al iniciar
  useEffect(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem('clientes')) || []
      setListaClientes(guardados)
    } catch (error) {
      console.error("Error al leer clientes:", error)
    }
  }, [])

  // --- LOGICA FILTRO BLINDADA (AQUÍ ESTÁ EL ARREGLO) ---
  const clientesFiltrados = listaClientes.filter(c => 
    // Convertimos a String antes de filtrar para evitar errores con números
    c.nombre && String(c.nombre).toLowerCase().includes(nombre.toLowerCase())
  )

  // --- LOGICA GUARDAR ---
  const handleGuardar = (e) => {
    e.preventDefault()
    if (!nombre) return alert('El nombre es obligatorio')

    if (idEdicion) {
      // EDITAR
      const actualizados = listaClientes.map(c => 
        c.id === idEdicion ? { ...c, nombre: String(nombre).toUpperCase(), direccion } : c
      )
      setListaClientes(actualizados)
      localStorage.setItem('clientes', JSON.stringify(actualizados))
      alert('✅ Cliente actualizado')
      setIdEdicion(null)
      setNombre('') 
      setDireccion('')
    } else {
      // CREAR
      const existe = listaClientes.some(c => String(c.nombre).toUpperCase() === nombre.toUpperCase())
      if (existe && !window.confirm('Ya existe un cliente con este nombre. ¿Crearlo igual?')) {
        return
      }
      
      const nuevo = { 
        id: Date.now(), 
        nombre: String(nombre).toUpperCase(), // Guardamos siempre como texto
        direccion: direccion || 'Sin dirección' 
      }
      const nuevaLista = [nuevo, ...listaClientes]
      setListaClientes(nuevaLista)
      localStorage.setItem('clientes', JSON.stringify(nuevaLista))
      setNombre('') 
      setDireccion('')
    }
  }

  // --- MODO EDICION ---
  const cargarParaEditar = (cliente) => {
    setNombre(String(cliente.nombre)) // Aseguramos texto al cargar
    setDireccion(cliente.direccion || '')
    setIdEdicion(cliente.id)
    // Enfocar el input
    document.querySelector('input[name="nombreCliente"]')?.focus()
  }

  const cancelarEdicion = () => {
    setNombre('')
    setDireccion('')
    setIdEdicion(null)
  }

  const borrarCliente = (id) => {
    if (window.confirm('¿Eliminar este cliente?')) {
      const filtrados = listaClientes.filter(c => c.id !== id)
      setListaClientes(filtrados)
      localStorage.setItem('clientes', JSON.stringify(filtrados))
      if (id === idEdicion) cancelarEdicion()
    }
  }

  // --- ESTILOS ---
  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #555',
    background: '#222',
    color: 'white',
    marginBottom: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box'
  }

  return (
    <div className="main-container" style={{ height: '100vh', overflow: 'hidden' }}>
      
      {/* CABECERA FIJA */}
      <div className="form-container" style={{ width: '100%', maxWidth: '350px', paddingBottom: '10px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>👥 Clientes ({listaClientes.length})</h2>

        <form onSubmit={handleGuardar} style={{ 
          background: '#1e1e1e', 
          padding: '20px', 
          borderRadius: '12px', 
          border: idEdicion ? '2px solid #ff9800' : '1px solid #333',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            {idEdicion ? 'EDITANDO CLIENTE:' : 'NOMBRE / BUSCADOR:'}
          </label>
          
          <input 
            name="nombreCliente"
            type="text" 
            placeholder="Escribe para buscar o crear..." 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
            autoComplete="off"
          />
          
          <input 
            type="text" 
            placeholder="Dirección / Teléfono" 
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <button type="submit" style={{ flex: 1, padding: '12px', background: idEdicion ? '#ff9800' : '#2196f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              {idEdicion ? 'Actualizar' : 'Guardar Cliente'}
            </button>
            
            {idEdicion && (
              <button type="button" onClick={cancelarEdicion} style={{ padding: '12px', background: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LISTA SCROLLEABLE */}
      <div style={{ flex: 1, width: '100%', maxWidth: '350px', overflowY: 'auto', paddingBottom: '20px', paddingRight: '5px' }}>
        
        {nombre && (
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px', textAlign: 'center' }}>
            {clientesFiltrados.length === 0 ? '✨ Nombre nuevo (Crear)' : `🔍 Resultados: ${clientesFiltrados.length}`}
          </p>
        )}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {clientesFiltrados.map(cliente => (
            <li key={cliente.id} style={{ 
              background: idEdicion === cliente.id ? '#3e2723' : '#333', 
              borderLeft: idEdicion === cliente.id ? '4px solid #ff9800' : '4px solid transparent',
              marginBottom: '8px', 
              padding: '15px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{cliente.nombre}</span>
                <span style={{ color: '#bbb', fontSize: '0.9rem' }}>{cliente.direccion}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
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

      <div style={{ padding: '10px', width: '100%', maxWidth: '350px' }}>
        <button onClick={onVolver} style={{ padding: '12px', background: 'transparent', border: '1px solid #666', color: '#aaa', borderRadius: '25px', width: '100%', cursor: 'pointer' }}>
          ⬅ Volver al Menú
        </button>
      </div>
    </div>
  )
}

export default Clientes