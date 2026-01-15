import { useState, useEffect } from 'react'
import './App.css'

// --- CORRECCIÓN DE PRECIO INTELIGENTE ---
const limpiarPrecio = (valor) => {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  
  let str = valor.toString();

  // DETECCIÓN INTELIGENTE:
  if (/\.\d{1,2}$/.test(str)) {
     return parseFloat(str) || 0;
  }

  // Si no, asumimos formato argentino
  const limpio = str
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
    
  return parseFloat(limpio) || 0;
};

// --- NUEVO HELPER: Formato visual de moneda ($ 1.200) ---
const formatoDinero = (valor) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(valor);
}
// --------------------------------------------------------

function Pedidos({ onVolver }) {
  // --- ESTADOS ---
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])

  const [clienteId, setClienteId] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false)

  // --- NUEVO ESTADO: LISTA DE PRECIOS ---
  const [tipoPrecio, setTipoPrecio] = useState('general') // 'general' | 'mayorista'
  // --------------------------------------

  // --- NUEVO ESTADO UI: ACORDEÓN ---
  const [verOpciones, setVerOpciones] = useState(false)
  // ---------------------------------

  const [productoId, setProductoId] = useState('')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mostrarSugerenciasProductos, setMostrarSugerenciasProductos] = useState(false)
  
  const [cantidad, setCantidad] = useState(1)
  const [carrito, setCarrito] = useState([])
  
  const [observacion, setObservacion] = useState('')

  // --- ESTADOS PARA MODALES DE RECOMENDACIÓN ---
  const [modalVisible, setModalVisible] = useState(null) // 'top10', 'sugeridos', o null
  const [listaParaMostrar, setListaParaMostrar] = useState([])
  // ----------------------------------------------------

  // --- CARGA INICIAL (CORREGIDA Y BLINDADA + RECUPERAR BORRADOR) ---
  useEffect(() => {
    try {
      // 1. Cargar datos crudos con fallback a array vacío
      const cRaw = JSON.parse(localStorage.getItem('clientes')) || [];
      const pRaw = JSON.parse(localStorage.getItem('productos')) || [];

      // PROTECCIÓN: Si por alguna razón no son arrays, forzamos arrays vacíos
      const safePRaw = Array.isArray(pRaw) ? pRaw : [];
      const safeCRaw = Array.isArray(cRaw) ? cRaw : [];

      // 2. Procesar Productos
      const pMapeados = safePRaw.map(p => {
        if (!p) return null; // <--- ESCUDO

        const parsearRelacionados = (valor) => {
          if (!valor) return []; 
          if (Array.isArray(valor)) return valor;
          if (typeof valor === 'number') return [valor];
          return String(valor).split(',').map(v => v.trim());
        };

        // --- LÓGICA MAYORISTA INTEGRADA ---
        const precioGen = limpiarPrecio(p.precio);
        // Buscamos cualquier variación de nombre de columna
        const rawMay = p.mayorista || p.preciomayorista || p.precio_mayorista;
        const precioMay = rawMay ? limpiarPrecio(rawMay) : precioGen;
        // ----------------------------------

        return {
          id: p.ID || p.id || Math.random(), // <--- ESCUDO
          nombre: String(p.nombre || p.Nombre || 'SIN NOMBRE'), // Agregamos String() para evitar crash
          precio: precioGen,
          precioMayorista: precioMay, // Guardamos el precio mayorista
          stock: parseInt(p.stock) || 0,
          categoria: p.categoria || "Sin categoría",
          sugerencias: parsearRelacionados(p.sugerencias || p.Sugerencias || p.sugerido) 
        }
      }).filter(Boolean); // <--- LIMPIEZA

      // 3. Procesar Clientes
      const cMapeados = safeCRaw.map(c => {
        if (!c) return null; // <--- ESCUDO

        const parsearIds = (valor) => {
          if (!valor) return [];
          if (Array.isArray(valor)) return valor; 
          return String(valor).split(',').map(v => v.trim()); 
        };

        // --- DETECTAR LISTA POR DEFECTO ---
        let listaPref = 'general';
        if (c.lista && String(c.lista).toLowerCase().includes('may')) {
            listaPref = 'mayorista';
        }
        // ----------------------------------

        return {
          id: c.ID || c.id || Math.random(),
          nombre: String(c.nombre || c.Nombre || 'SIN NOMBRE'), // Agregamos String()
          direccion: c.direccion || '',
          telefono: c.telefono || c.Telefono || '',
          lat: c.lat || null, 
          lon: c.lon || null,
          top10: parsearIds(c.top10),
          listaDefecto: listaPref // Guardamos la preferencia
        };
      }).filter(Boolean);

      setClientes(cMapeados);
      setProductos(pMapeados);

      // --- RECUPERACIÓN AUTOMÁTICA DE BORRADOR ---
      const borrador = JSON.parse(localStorage.getItem('pedido_borrador'));
      if (borrador) {
          if (borrador.clienteId) setClienteId(borrador.clienteId);
          if (borrador.busquedaCliente) setBusquedaCliente(borrador.busquedaCliente);
          if (borrador.tipoPrecio) setTipoPrecio(borrador.tipoPrecio);
          if (borrador.carrito) setCarrito(borrador.carrito);
          if (borrador.observacion) setObservacion(borrador.observacion);
      }
      // -------------------------------------------

    } catch (error) {
      console.error("❌ Error FATAL cargando datos:", error);
    }
  }, [])

  // --- NUEVO: GUARDADO AUTOMÁTICO DE BORRADOR ---
  useEffect(() => {
    // Solo guardamos si hay un cliente seleccionado O cosas en el carrito
    if (clienteId || carrito.length > 0) {
        const estadoActual = {
            clienteId,
            busquedaCliente,
            tipoPrecio,
            carrito,
            observacion
        };
        localStorage.setItem('pedido_borrador', JSON.stringify(estadoActual));
    } else {
        // Si el pedido está vacío, limpiamos el borrador para no guardar basura
        localStorage.removeItem('pedido_borrador');
    }
  }, [clienteId, busquedaCliente, tipoPrecio, carrito, observacion]); 
  // ----------------------------------------------

  // --- NUEVO: PREVENIR RECARGA ACCIDENTAL ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Solo activamos la alerta si hay cosas en el carrito
      if (carrito.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Requerido por Chrome/navegadores modernos
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [carrito]); // Se re-ejecuta si cambia el carrito  
  

  // --- FILTROS (Con protección String) ---
  const clientesFiltrados = clientes.filter(c => 
    c.nombre && String(c.nombre).toLowerCase().includes(busquedaCliente.toLowerCase())
  )

  const productosFiltrados = productos.filter(p => 
    p.nombre && String(p.nombre).toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  // --- HELPER PARA OBTENER PRECIO ACTUAL ---
  const getPrecioVigente = (prod) => {
     if (!prod) return 0;
     return tipoPrecio === 'mayorista' ? prod.precioMayorista : prod.precio;
  }
  // -----------------------------------------

  // --- SELECCIONAR ---
  const seleccionarCliente = (cliente) => {
    setClienteId(cliente.id)
    setBusquedaCliente(String(cliente.nombre))
    
    // --- CAMBIO AUTOMÁTICO DE LISTA ---
    setTipoPrecio(cliente.listaDefecto || 'general');
    // ----------------------------------

    setMostrarSugerenciasClientes(false)
    setModalVisible(null)
  }

  const seleccionarProducto = (producto) => {
    setProductoId(producto.id)
    setBusquedaProducto(String(producto.nombre))
    setMostrarSugerenciasProductos(false)
    setModalVisible(null) 
  }

  // --- LOGICA DE BOTONES INTELIGENTES ---
  
  // Función auxiliar para recuperar objetos producto desde IDs
  const obtenerProductosDesdeIds = (arrayIds) => {
    if (!arrayIds || arrayIds.length === 0) return [];
    
    return arrayIds.map(id => {
      // Buscamos el producto en la base maestra
      return productos.find(p => String(p.id) === String(id));
    }).filter(Boolean); // Eliminamos nulos si un producto dejó de existir
  }

  const abrirTop10 = () => {
    if (!clienteId) return alert("Selecciona un cliente primero para ver su histórico.");
    
    const clienteObj = clientes.find(c => String(c.id) === String(clienteId));
    
    if (!clienteObj.top10 || clienteObj.top10.length === 0) {
      return alert("☁️ Sin historial histórico para este cliente.");
    }

    const productosReales = obtenerProductosDesdeIds(clienteObj.top10);
    setListaParaMostrar(productosReales);
    setModalVisible('top10');
  }

  // --- NUEVA LÓGICA: SUGERENCIAS CONTEXTUALES (DATA MINING) ---
  const abrirSugerencias = () => {
    // CASO 1: CARRITO VACÍO -> Buscar "COMBO" u "OFERTA"
    if (carrito.length === 0) {
      if (productos.length === 0) return alert("No hay productos cargados.");
      
      const ofertas = productos.filter(p => {
         const n = String(p.nombre).toLowerCase();
         return n.includes('combo') || n.includes('oferta');
      });

      if (ofertas.length === 0) {
         return alert("No hay artículos de 'Combo' u 'Oferta' disponibles.");
      }
 
      setListaParaMostrar(ofertas);
      setModalVisible('sugeridos');
      return;
    }

    // CASO 2: VENTA CRUZADA (MINERÍA)
    const ultimoItem = carrito[carrito.length - 1];
    const productoPadre = productos.find(p => String(p.id) === String(ultimoItem.productoId));

    if (!productoPadre || !productoPadre.sugerencias || productoPadre.sugerencias.length === 0) {
      return alert(`El producto "${ultimoItem.nombre}" no tiene sugerencias asociadas en el sistema.`);
    }

    const productosSugeridos = obtenerProductosDesdeIds(productoPadre.sugerencias);

    if (productosSugeridos.length === 0) {
      return alert("Los productos sugeridos no se encontraron en la lista de precios activa.");
    }

    setListaParaMostrar(productosSugeridos);
    setModalVisible('sugeridos');
  }
  // ----------------------------------------------------

  // --- AGREGAR AL CARRITO ---
  const agregarItem = (e) => {
    if(e) e.preventDefault()
    if (!clienteId) return alert('Selecciona un cliente')
    if (!productoId) return alert('Selecciona un producto')
    if (cantidad < 1) return alert('Cantidad incorrecta')

    const productoReal = productos.find(p => String(p.id) === String(productoId))
    
    if (!productoReal) return

    // --- USAMOS EL PRECIO VIGENTE ---
    const precioFinal = getPrecioVigente(productoReal);
    // --------------------------------
    
    const cantidadFinal = parseInt(cantidad) || 1;
    const subtotalFinal = precioFinal * cantidadFinal;

    const nuevoItem = {
      id: Date.now(),
      productoId: productoReal.id,
      nombre: productoReal.nombre,
      precio: precioFinal,
      listaAplicada: tipoPrecio, // Guardamos qué lista se usó
      cantidad: cantidadFinal,
      subtotal: subtotalFinal
    }

    setCarrito([...carrito, nuevoItem])
    setProductoId('')
    setBusquedaProducto('')
    setCantidad(1)
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
  }

  // --- CANCELAR BORRADOR (NUEVA FUNCIÓN) ---
  const cancelarBorrador = () => {
    if (confirm("¿Estás seguro de cancelar este pedido y borrar los datos?")) {
        setCarrito([]);
        setClienteId('');
        setBusquedaCliente('');
        setObservacion('');
        setTipoPrecio('general');
        localStorage.removeItem('pedido_borrador');
    }
  }
  // -----------------------------------------

  // --- FINALIZAR PEDIDO ---
  const finalizarPedido = () => {
    if (carrito.length === 0) return alert('Carrito vacío')
    if (!clienteId) return alert('Falta Cliente')

    const clienteReal = clientes.find(c => String(c.id) === String(clienteId))
    if (!clienteReal) return alert('Error identificando al cliente')

    const totalSafe = carrito.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

    const nuevoPedido = {
      id: Date.now(),
      fecha: new Date().toLocaleString('es-AR'),
      cliente: clienteReal.nombre,
      items: carrito,
      total: totalSafe,
      observacion: observacion || '' 
    }

    const historial = JSON.parse(localStorage.getItem('pedidos')) || []
    localStorage.setItem('pedidos', JSON.stringify([...historial, nuevoPedido]))

    // IMPORTANTE: LIMPIAR BORRADOR AL FINALIZAR
    localStorage.removeItem('pedido_borrador');

    const procesarWhatsAppYLimpiar = () => {
      let mensaje = `*NUEVO PEDIDO* 📋\n`;
      mensaje += `👤 *Cliente:* ${clienteReal.nombre}\n`;
      // Aviso de lista
      if (clienteReal.listaDefecto === 'mayorista') mensaje += `🏷️ *Lista:* Mayorista\n`;
      mensaje += `📅 *Fecha:* ${new Date().toLocaleDateString('es-AR')}\n`;
      mensaje += `--------------------------\n`;
      
      carrito.forEach(item => {
        const sub = Number(item.subtotal).toLocaleString('es-AR');
        // Tag si fue mayorista
        const tag = item.listaAplicada === 'mayorista' ? '(May)' : '';
        mensaje += `▪️ ${item.cantidad} x ${item.nombre} ${tag} ($ ${sub})\n`;
      });

      mensaje += `--------------------------\n`;
      mensaje += `💰 *TOTAL: ${formatoDinero(totalSafe)}*\n`;
      if (observacion) mensaje += `📝 *Nota:* ${observacion}`;

      let telefonoDestino = '';
      if (clienteReal.telefono) {
        let sucio = String(clienteReal.telefono).replace(/\D/g, '');
        if (sucio.length === 10) {
          telefonoDestino = '549' + sucio;
        } else {
          telefonoDestino = sucio;
        }
      }

      const urlWhatsApp = `https://wa.me/${telefonoDestino}?text=${encodeURIComponent(mensaje)}`;
      window.open(urlWhatsApp, '_blank');

      setCarrito([])
      setClienteId('')
      setBusquedaCliente('')
      setObservacion('')
      setTipoPrecio('general') // Reset
      onVolver() 
    };

    if (!clienteReal.lat || !clienteReal.lon) {
      const deseaAgregar = confirm(`✅ Pedido guardado.\n\n⚠️ ${clienteReal.nombre} NO tiene ubicación GPS.\n¿Desea agregarla ahora?`);

      if (deseaAgregar) {
        if (!navigator.geolocation) {
          alert("GPS no soportado");
          procesarWhatsAppYLimpiar();
          return;
        }

        alert("⏳ Obteniendo ubicación...");
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const clienteActualizado = { 
              ...clienteReal, 
              lat: position.coords.latitude, 
              lon: position.coords.longitude 
            };

            const clientesActualizados = clientes.map(c => 
              c.id === clienteReal.id ? clienteActualizado : c
            );
            
            setClientes(clientesActualizados); 
            localStorage.setItem('clientes', JSON.stringify(clientesActualizados)); 
            
            alert("✅ Ubicación guardada.");
            procesarWhatsAppYLimpiar();
          },
          (error) => {
            console.error(error);
            alert("❌ Fallo GPS. Abriendo WhatsApp...");
            procesarWhatsAppYLimpiar();
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
        return;
      }
    }
    procesarWhatsAppYLimpiar();
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

  const totalGeneral = carrito.reduce((acumulador, item) => {
    return acumulador + (Number(item.subtotal) || 0);
  }, 0);


  return (
    <div className="main-container">
      <h2>📝 Nuevo Pedido</h2>

      {/* SECCION CLIENTE */}
      <div style={{ width: '100%', maxWidth: '350px', marginBottom: '15px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Cliente</label>
        <input 
          type="text"
          placeholder="🔍 Buscar cliente..."
          value={busquedaCliente}
          onChange={(e) => {
            setBusquedaCliente(e.target.value)
            setMostrarSugerenciasClientes(true)
            setClienteId('')
            setTipoPrecio('general') // Reset al borrar
            setVerOpciones(false)    // Reset opciones
          }}
          onFocus={() => setMostrarSugerenciasClientes(true)}
          style={inputStyle}
        />
        
        {mostrarSugerenciasClientes && busquedaCliente && (
          <ul style={dropdownStyle}>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map(c => (
                <li key={c.id} onClick={() => seleccionarCliente(c)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #444', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{c.nombre}</span>
                  {/* Badge Mayorista */}
                  {c.listaDefecto === 'mayorista' && 
                    <span style={{ fontSize: '0.7rem', background: '#ff9800', color: 'black', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>MAYORISTA</span>
                  }
                </li>
              ))
            ) : (
              <li style={{ padding: '12px', color: '#888' }}>No encontrado</li>
            )}
          </ul>
        )}
      </div>

      {/* --- SWITCH LISTA DE PRECIOS (NUEVO) --- */}
      <div style={{ width: '100%', maxWidth: '350px', marginBottom: '15px', display: 'flex', background: '#333', borderRadius: '8px', padding: '4px', border: '1px solid #444' }}>
          <button 
            onClick={() => setTipoPrecio('general')}
            style={{ 
                flex: 1, 
                padding: '10px', 
                background: tipoPrecio === 'general' ? '#4caf50' : 'transparent', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                fontWeight: tipoPrecio === 'general' ? 'bold' : 'normal',
                opacity: tipoPrecio === 'general' ? 1 : 0.5,
                transition: '0.3s'
            }}>
            🛒 General
          </button>
          <button 
            onClick={() => setTipoPrecio('mayorista')}
            style={{ 
                flex: 1, 
                padding: '10px', 
                background: tipoPrecio === 'mayorista' ? '#e91e63' : 'transparent', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                fontWeight: tipoPrecio === 'mayorista' ? 'bold' : 'normal',
                opacity: tipoPrecio === 'mayorista' ? 1 : 0.5,
                transition: '0.3s'
            }}>
            🏭 Mayorista
          </button>
      </div>
      {/* --------------------------------------- */}

      {/* BOTONES INTELIGENTES */}
      <div style={{ width: '100%', maxWidth: '350px', display: 'flex', gap: '10px', marginBottom: '20px' }}>
         <button 
           onClick={abrirTop10}
           disabled={!clienteId}
           style={{
             flex: 1,
             padding: '8px',
             fontSize: '0.8rem',
             background: clienteId ? '#ff9800' : '#444',
             color: 'white',
             border: 'none',
             borderRadius: '6px'
           }}
         >
           ⭐ Top 10 (Histórico)
         </button>
         
         <button 
           onClick={abrirSugerencias}
           style={{
             flex: 1,
             padding: '8px',
             fontSize: '0.8rem',
             background: '#9c27b0', // Siempre activo
             color: 'white',
             border: 'none',
             borderRadius: '6px'
           }}
         >
           💡 Sugeridos (Relacionados)
         </button>
      </div>

      {/* MODAL/LISTA DE SELECCIÓN */}
      {modalVisible && (
        <div style={{ width: '100%', maxWidth: '350px', marginBottom: '20px', background: '#2a2a2a', padding: '10px', borderRadius: '8px', border: '1px solid #555' }}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
             <span style={{fontWeight: 'bold', color: '#e040fb'}}>
                {modalVisible === 'top10' 
                   ? '🏆 Histórico del Cliente' 
                   : carrito.length > 0 
                       ? `💡 Combinan con ${carrito[carrito.length - 1].nombre}`
                       : '🔥 Ofertas & Combos'
                }
             </span>
             <button onClick={() => setModalVisible(null)} style={{background:'transparent', border:'none', color:'#aaa', cursor:'pointer'}}>✖</button>
          </div>
          
          <ul style={{listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto'}}>
            {listaParaMostrar.map(p => (
              <li key={p.id} onClick={() => seleccionarProducto(p)} style={{
                padding: '8px', 
                borderBottom: '1px solid #444', 
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{p.nombre}</span>
                {/* --- PRECIO DINÁMICO EN MODAL --- */}
                <span style={{color: tipoPrecio === 'mayorista' ? '#e91e63' : '#4caf50'}}>
                    {formatoDinero(getPrecioVigente(p))}
                </span>
              </li>
            ))}
            {listaParaMostrar.length === 0 && <li style={{padding:'10px', color:'#777'}}>Sin datos disponibles.</li>}
          </ul>
        </div>
      )}

      {/* SECCION PRODUCTO */}
      <div style={{ width: '100%', maxWidth: '350px', marginBottom: '30px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>
            Producto ({tipoPrecio === 'mayorista' ? 'Mayorista' : 'General'})
        </label>
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
                      {/* --- PRECIO DINÁMICO EN DROPDOWN --- */}
                      <span style={{ color: tipoPrecio === 'mayorista' ? '#e91e63' : '#4caf50' }}>
                        {formatoDinero(getPrecioVigente(p))}
                      </span>
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
          <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>El carrito está vacío</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {carrito.map(item => (
              <li key={item.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '12px 0', 
                borderBottom: '1px solid #333' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#eee', fontSize: '0.95rem' }}>
                    <b style={{ color: '#2196f3' }}>{item.cantidad}</b> x {item.nombre}
                  </span>
                  <button 
                    onClick={() => eliminarDelCarrito(item.id)} 
                    style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontWeight: 'bold', padding: '0 5px' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.85rem' }}>
                   {/* --- INDICADOR DE LISTA --- */}
                   <span>{item.listaAplicada === 'mayorista' ? '🏭 Mayorista' : '🛒 General'}</span>
                   <span>Subtotal: {formatoDinero(item.subtotal)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {carrito.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#1a1a1a', 
            borderRadius: '8px', 
            border: '1px solid #333' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: '1rem' }}>Total Pedido:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#4caf50' }}>
                {formatoDinero(totalGeneral)}
              </span>
            </div>
          </div>
        )}

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

        {/* --- BOTONES DE ACCION (Cancelar solo si hay borrador) --- */}
        <div style={{marginTop: '20px', display:'flex', gap:'10px'}}>
            
            {/* BOTÓN CANCELAR (CONDICIONAL) */}
            {(carrito.length > 0 || clienteId) && (
                <button 
                    onClick={cancelarBorrador} 
                    style={{ 
                        flex: 1,
                        padding: '15px', 
                        background: 'transparent', 
                        color: '#ff5252', 
                        border: '1px solid #ff5252', 
                        borderRadius: '8px', 
                        fontSize: '1rem', 
                        fontWeight: 'bold' 
                    }}
                >
                    🗑️ Cancelar
                </button>
            )}

            <button 
              onClick={finalizarPedido} 
              style={{ 
                  flex: 2, // Más ancho para destacar
                  padding: '15px', 
                  background: '#4caf50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold' 
              }}
            >
              ✅ FINALIZAR PEDIDO
            </button>
        </div>
      </div>

      <button onClick={onVolver} style={{ marginTop: '30px', background: 'transparent', border: '1px solid #666', color: '#aaa', padding: '10px 20px', borderRadius: '20px' }}>
        ⬅ Volver
      </button>
    </div>
  )
}

export default Pedidos