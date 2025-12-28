import { useState, useEffect } from 'react'
import './App.css'

function Productos({ onVolver }) {
  // Datos
  const [listaProductos, setListaProductos] = useState([])
  
  // Formulario
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [idEdicion, setIdEdicion] = useState(null)

  // Cargar datos al iniciar
  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem('productos')) || []
    setListaProductos(guardados)
  }, [])

  // --- LOGICA FILTRO ---
  const productosFiltrados = listaProductos.filter(p => 
    p.nombre.toLowerCase().includes(nombre.toLowerCase())
  )

  // --- LOGICA GUARDAR ---
  const handleGuardar = (e) => {
    e.preventDefault()
    if (!nombre || !precio) return alert('Completa nombre y precio')

    if (idEdicion) {
      // EDITAR
      const actualizados = listaProductos.map(p => 
        p.id === idEdicion ? { ...p, nombre: nombre.toUpperCase(), precio } : p
      )
      setListaProductos(actualizados)
      localStorage.setItem('productos', JSON.stringify(actualizados))
      alert('✅ Producto actualizado')
      setIdEdicion(null)
      setNombre('') 
      setPrecio('')
    } else {
      // CREAR
      const existe = listaProductos.some(p => p.nombre.toUpperCase() === nombre.toUpperCase())
      if (existe && !window.confirm('Ya existe un producto con este nombre. ¿Crearlo igual?')) {
        return
      }
      
      const nuevo = { id: Date.now(), nombre: nombre.toUpperCase(), precio }
      const nuevaLista = [nuevo, ...listaProductos]
      setListaProductos(nuevaLista)
      localStorage.setItem('productos', JSON.stringify(nuevaLista))
      setNombre('') 
      setPrecio('')
    }
  }

  // --- MODO EDICION ---
  const cargarParaEditar = (producto) => {
    setNombre(producto.nombre)
    setPrecio(producto.precio)
    setIdEdicion(producto.id)
    // Enfocar el input
    document.querySelector('input[name="nombreProducto"]')?.focus()
  }

  const cancelarEdicion = () => {
    setNombre('')
    setPrecio('')
    setIdEdicion(null)
  }

  const borrarProducto = (id) => {
    if (window.confirm('¿Eliminar producto?')) {
      const filtrados = listaProductos.filter(p => p.id !== id)
      setListaProductos(filtrados)
      localStorage.setItem('productos', JSON.stringify(filtrados))
      if (id === idEdicion) cancelarEdicion()
    }
  }

  // --- ESTILOS CORREGIDOS ---
  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #555',
    background: '#222',
    color: 'white',
    marginBottom: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box' // <--- ESTO ARREGLA LA DESALINEACIÓN
  }

  return (
    <div className="main-container" style={{ height: '100vh', overflow: 'hidden' }}>
      
      {/* CABECERA FIJA */}
      <div className="form-container" style={{ width: '100%', maxWidth: '350px', paddingBottom: '10px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>📦 Inventario ({listaProductos.length})</h2>

        <form onSubmit={handleGuardar} style={{ 
          background: '#1e1e1e', 
          padding: '20px', 
          borderRadius: '12px', 
          border: idEdicion ? '2px solid #ff9800' : '1px solid #333',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            {idEdicion ? 'EDITANDO PRODUCTO:' : 'NOMBRE / BUSCADOR:'}
          </label>
          
          <input 
            name="nombreProducto"
            type="text" 
            placeholder="Escribe para buscar o crear..." 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
            autoComplete="off"
          />
          
          <input 
            type="number" 
            placeholder="Precio" 
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <button type="submit" style={{ flex: 1, padding: '12px', background: idEdicion ? '#ff9800' : '#2196f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              {idEdicion ? 'Actualizar' : 'Guardar'}
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
            {productosFiltrados.length === 0 ? '✨ Nombre nuevo (Crear)' : `🔍 Resultados: ${productosFiltrados.length}`}
          </p>
        )}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {productosFiltrados.map(prod => (
            <li key={prod.id} style={{ 
              background: idEdicion === prod.id ? '#3e2723' : '#333', // Color diferente si editas
              borderLeft: idEdicion === prod.id ? '4px solid #ff9800' : '4px solid transparent',
              marginBottom: '8px', 
              padding: '15px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{prod.nombre}</span>
                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>${prod.precio}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => cargarParaEditar(prod)} style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Editar">✏️</button>
                <button onClick={() => borrarProducto(prod.id)} style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Borrar">🗑</button>
              </div>
            </li>
          ))}
        </ul>
        
        {productosFiltrados.length === 0 && !nombre && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '30px' }}>No tienes productos cargados.</p>
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

export default Productos