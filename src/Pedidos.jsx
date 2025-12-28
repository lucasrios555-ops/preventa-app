import { useState, useEffect } from 'react'
import './App.css'

function Pedidos({ onVolver }) {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])

  const [clienteId, setClienteId] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false)

  const [productoId, setProductoId] = useState('')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mostrarSugerenciasProductos, setMostrarSugerenciasProductos] = useState(false)
  
  const [cantidad, setCantidad] = useState(1)
  const [carrito, setCarrito] = useState([])
  
  // Estado para la observación
  const [observacion, setObservacion] = useState('')

  // --- CARGA INICIAL ---
  useEffect(() => {
    try {
      const cRaw = JSON.parse(localStorage.getItem('clientes')) || [];
      const pRaw = JSON.parse(localStorage.getItem('productos')) || [];

      // Normalizamos Productos (según tu Excel)
      const pMapeados = pRaw.map(p => ({
        id: p.ID || p.id, // Acepta ID (CRM) o id (App)
        nombre: p.nombre || p.Nombre,
        precio: parseFloat(p.precio) || 0,
        stock: parseInt(p.stock) || 0,
        categoria: p.categoria || "Sin categoría"
      }));

      // Normalizamos Clientes (asumiendo estructura similar)
      const cMapeados = cRaw.map(c => ({
        id: c.ID || c.id,
        nombre: c.nombre || c.Nombre,
        // Agregá acá otros campos que necesites de clientes
      }));

      setClientes(cMapeados);
      setProductos(pMapeados);

    } catch (error) {
      console.error("Error cargando y normalizando datos:", error);
    }
  }, [])

  // --- FILTROS BLINDADOS (CORRECCIÓN AQUÍ) ---
  const clientesFiltrados = clientes.filter(c => 
    // Usamos String() para convertir números a texto y evitar el error
    c.nombre && String(c.nombre).toLowerCase().includes(busquedaCliente.toLowerCase())
  )

  const productosFiltrados = productos.filter(p => 
    p.nombre && String(p.nombre).toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  // --- SELECCIONAR ---
  const seleccionarCliente = (cliente) => {
    setClienteId(cliente.id)
    setBusquedaCliente(String(cliente.nombre)) // Aseguramos que sea texto
    setMostrarSugerenciasClientes(false)
  }

  const seleccionarProducto = (producto) => {
    setProductoId(producto.id)
    setBusquedaProducto(String(producto.nombre)) // Aseguramos que sea texto
    setMostrarSugerenciasProductos(false)
  }

  // --- AGREGAR ---
  const agregarItem = (e) => {
    e.preventDefault()
    if (!clienteId) return alert('Selecciona un cliente')
    if (!productoId) return alert('Selecciona un producto')
    if (cantidad < 1) return alert('Cantidad incorrecta')

    const productoReal = productos.find(p => p.id === parseInt(productoId))
    if (!productoReal) return

    const nuevoItem = {
      id: Date.now(),
      productoId: productoReal.id,
      nombre: productoReal.nombre,
      precio: parseFloat(productoReal.precio),
      cantidad: parseInt(cantidad),
      subtotal: parseFloat(productoReal.precio) * parseInt(cantidad)
    }

    setCarrito([...carrito, nuevoItem])
    setProductoId('')
    setBusquedaProducto('')
    setCantidad(1)
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
  }

  // --- FINALIZAR ---
  const finalizarPedido = () => {
    if (carrito.length === 0) return alert('Carrito vacío')
    if (!clienteId) return alert('Falta Cliente')

    const clienteReal = clientes.find(c => c.id === parseInt(clienteId))
    if (!clienteReal) return alert('Error identificando al cliente')

    const nuevoPedido = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      cliente: clienteReal.nombre,
      items: carrito,
      total: carrito.reduce((acc, item) => acc + item.subtotal, 0),
      observacion: observacion || '' 
    }

    const historial = JSON.parse(localStorage.getItem('pedidos')) || []
    localStorage.setItem('pedidos', JSON.stringify([...historial, nuevoPedido]))

    alert('✅ Pedido Guardado')
    
    // Resetear formulario
    setCarrito([])
    setClienteId('')
    setBusquedaCliente('')
    setObservacion('')
  }

  // --- ESTILOS ---
  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #555',
    background: '#222',
    color: 'white',
    outline: 'none',
    fontSize: '1rem',
    boxSizing: 'border-box'
  }

  const dropdownStyle = {
    position: 'absolute',
    zIndex: 100,
    background: '#333',
    width: '100%',
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #555',
    listStyle: 'none',
    padding: 0,
    margin: '5px 0 0 0',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  }

  // --- RENDERIZADO ---
  return (
    <div className="main-container">
      <h2>📝 Nuevo Pedido</h2>

      {/* SECCION CLIENTE */}
      <div style={{ width: '100%', maxWidth: '350px', marginBottom: '25px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Cliente</label>
        <input 
          type="text"
          placeholder="🔍 Buscar cliente..."
          value={busquedaCliente}
          onChange={(e) => {
            setBusquedaCliente(e.target.value)
            setMostrarSugerenciasClientes(true)
            setClienteId('')
          }}
          onFocus={() => setMostrarSugerenciasClientes(true)}
          style={inputStyle}
        />
        
        {mostrarSugerenciasClientes && busquedaCliente && (
          <ul style={dropdownStyle}>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map(c => (
                <li key={c.id} onClick={() => seleccionarCliente(c)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #444', color: 'white' }}>
                  {c.nombre}
                </li>
              ))
            ) : (
              <li style={{ padding: '12px', color: '#888' }}>No encontrado</li>
            )}
          </ul>
        )}
      </div>

      {/* SECCION PRODUCTO */}
      <div style={{ width: '100%', maxWidth: '350px', marginBottom: '30px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Producto</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text"
              placeholder="🔍 Buscar producto..."
              value={busquedaProducto}
              onChange={(e) => {
                setBusquedaProducto(e.target.value)
                setMostrarSugerenciasProductos(true)
                setProductoId('')
              }}
              onFocus={() => setMostrarSugerenciasProductos(true)}
              style={inputStyle}
            />
            {mostrarSugerenciasProductos && busquedaProducto && (
              <ul style={dropdownStyle}>
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map(p => (
                    <li key={p.id} onClick={() => seleccionarProducto(p)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #444', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.nombre}</span>
                      <span style={{ color: '#4caf50' }}>${p.precio}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ padding: '12px', color: '#888' }}>No encontrado</li>
                )}
              </ul>
            )}
          </div>
          <input 
            type="number" 
            min="1"
            value={cantidad} 
            onChange={(e) => setCantidad(e.target.value)}
            style={{ ...inputStyle, width: '70px', textAlign: 'center' }} 
          />
        </div>
        <button onClick={agregarItem} style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          + AGREGAR
        </button>
      </div>

      {/* CARRITO Y TOTALES */}
      <div style={{ width: '100%', maxWidth: '350px', borderTop: '1px solid #444', paddingTop: '20px' }}>
        {carrito.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>El carrito está vacío</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {carrito.map(item => (
              <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333', color: '#eee' }}>
                <span><b>{item.cantidad}</b> x {item.nombre}</span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span>${item.subtotal}</span>
                  <button onClick={() => eliminarDelCarrito(item.id)} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer' }}>X</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: '20px', fontSize: '1.4rem', fontWeight: 'bold', color: 'white', textAlign: 'right' }}>
          Total: ${carrito.reduce((acc, i) => acc + i.subtotal, 0)}
        </div>

        {/* --- CAMPO OBSERVACIONES --- */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Observaciones (Opcional):</label>
          <textarea 
            rows="3"
            placeholder="Ej: Paga con $20.000 / Entregar a la tarde"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <button 
          onClick={finalizarPedido} 
          style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}
        >
          ✅ FINALIZAR PEDIDO
        </button>
      </div>

      <button onClick={onVolver} style={{ marginTop: '30px', background: 'transparent', border: '1px solid #666', color: '#aaa', padding: '10px 20px', borderRadius: '20px' }}>
        ⬅ Volver
      </button>
    </div>
  )
}

export default Pedidos