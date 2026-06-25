// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Referencias de elementos de la interfaz
    const modalVenta = document.getElementById('modal-overlay') || document.getElementById('modal-venta');
    const btnNuevo = document.getElementById('btn-nuevo');
    const btnAgregarInline = document.getElementById('btn-agregar-inline');
    const closeBtns = document.querySelectorAll('.close-modal-btn');
    const selectProducto = document.getElementById('buscar-producto');
    const inputCantidad = document.getElementById('venta-cantidad');
    const inputPrecioUnitario = document.getElementById('venta-precio-unitario');
    const totalAcumuladoTxt = document.getElementById('total-acumulado');
    const formVenta = document.getElementById('form-venta');
    const listaVentas = document.getElementById('lista-ventas');
    const rowVacia = document.getElementById('row-vacia');
    
    // Botones de Modificar y Borrar
    const btnModificar = document.getElementById('btn-modificar');
    const btnBorrar = document.getElementById('btn-borrar');

    let filaSeleccionada = null;

    // Inicializar relojes y fechas estables de tu diseño
    actualizarFechaHora();

    // Cargar productos desde el Stock (localStorage compartido)
    let dbProductos = JSON.parse(localStorage.getItem('kiosco_stock')) || [];
    let dbVentas = JSON.parse(localStorage.getItem('kiosco_ventas')) || [];

    // Renderizar ventas al iniciar
    renderizarVentas();

    // Abrir Modal de Nueva Venta
    function abrirModalVenta() {
        // Recargar productos actualizados del stock
        dbProductos = JSON.parse(localStorage.getItem('kiosco_stock')) || [];
        
        // Limpiar y llenar el select
        selectProducto.innerHTML = '<option value="">-- Busque por Nombre, Código o Marca --</option>';
        dbProductos.forEach(p => {
            selectProducto.innerHTML += `<option value="${p.codigo}">${p.descripcion} (${p.marca}) - Stock: ${p.cantidad}</option>`;
        });

        // Resetear campos del formulario
        formVenta.reset();
        inputPrecioUnitario.value = '';
        totalAcumuladoTxt.textContent = '$ 0,00';
        document.getElementById('stock-aviso').textContent = '';
        modalVenta.classList.add('active');
    }

    if(btnNuevo) btnNuevo.addEventListener('click', abrirModalVenta);
    if(btnAgregarInline) btnAgregarInline.addEventListener('click', abrirModalVenta);

    // Cerrar Modal
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modalVenta.classList.remove('active');
        });
    });

    // Cambiar producto en la selección de venta para calcular precios de forma automática
    selectProducto.addEventListener('change', () => {
        const prod = dbProductos.find(p => p.codigo === selectProducto.value);
        if (prod) {
            inputPrecioUnitario.value = `$ ${parseFloat(prod.precioVenta).toFixed(2)}`;
            calcularTotalVenta(prod.precioVenta, inputCantidad.value);
            
            // Validar stock disponible
            const aviso = document.getElementById('stock-aviso');
            if (parseInt(prod.cantidad) <= 0) {
                aviso.textContent = "¡Error! Producto sin stock disponible.";
                aviso.style.color = "red";
            } else {
                aviso.textContent = `Unidades en góndola: ${prod.cantidad}`;
                aviso.style.color = "#555";
            }
        } else {
            inputPrecioUnitario.value = '';
            totalAcumuladoTxt.textContent = '$ 0,00';
        }
    });

    // Cambiar cantidad en tiempo real
    inputCantidad.addEventListener('input', () => {
        const prod = dbProductos.find(p => p.codigo === selectProducto.value);
        if (prod) {
            calcularTotalVenta(prod.precioVenta, inputCantidad.value);
        }
    });

    function calcularTotalVenta(precio, cant) {
        const total = parseFloat(precio) * parseInt(cant || 0);
        totalAcumuladoTxt.textContent = `$ ${total.toFixed(2)}`;
    }

    // Guardar la Venta y Restar Stock
    formVenta.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const codigo = selectProducto.value;
        const cantidadAVender = parseInt(inputCantidad.value);
        
        const prodIndex = dbProductos.findIndex(p => p.codigo === codigo);
        if (prodIndex === -1) return;

        // Comprobación rigurosa de stock
        if (parseInt(dbProductos[prodIndex].cantidad) < cantidadAVender) {
            alert("No hay suficiente stock en almacén para concretar la venta.");
            return;
        }

        // Restar del Stock global
        dbProductos[prodIndex].cantidad = parseInt(dbProductos[prodIndex].cantidad) - cantidadAVender;
        localStorage.setItem('kiosco_stock', JSON.stringify(dbProductos));

        // Registrar Venta
        const nuevaVenta = {
            id: Date.now(),
            codigo: dbProductos[prodIndex].codigo,
            descripcion: dbProductos[prodIndex].descripcion,
            marca: dbProductos[prodIndex].marca,
            categoria: dbProductos[prodIndex].categoria || "General",
            precio: dbProductos[prodIndex].precioVenta,
            cantidad: cantidadAVender
        };

        dbVentas.push(nuevaVenta);
        localStorage.setItem('kiosco_ventas', JSON.stringify(dbVentas));

        modalVenta.classList.remove('active');
        renderizarVentas();
    });

    // Renderizar Listado de Ventas en Pantalla Principal
    function renderizarVentas() {
        // Limpiar filas de datos, conservando el template base
        const filas = listaVentas.querySelectorAll('tr:not(#row-vacia)');
        filas.forEach(f => f.remove());

        if (dbVentas.length === 0) {
            if(rowVacia) rowVacia.style.display = 'table-row';
            return;
        }

        if(rowVacia) rowVacia.style.display = 'none';

        dbVentas.forEach(v => {
            const tr = document.createElement('tr');
            tr.dataset.id = v.id;
            tr.innerHTML = `
                <td class="code-column">${v.codigo}</td>
                <td>${v.descripcion}</td>
                <td>${v.marca}</td>
                <td><span class="badge-category">${v.categoria}</span></td>
                <td class="price-column">$ ${parseFloat(v.precio).toFixed(2)}</td>
                <td class="qty-column"><strong>${v.cantidad}</strong></td>
            `;

            // Manejar selección de filas para modificar/borrar
            tr.addEventListener('click', () => {
                if (filaSeleccionada) filaSeleccionada.classList.remove('selected-row');
                
                if (filaSeleccionada === tr) {
                    filaSeleccionada = null;
                } else {
                    filaSeleccionada = tr;
                    tr.classList.add('selected-row');
                }
            });

            listaVentas.appendChild(tr);
        });
    }

    // Eliminar Venta Seleccionada (Devuelve el stock)
    if(btnBorrar) {
        btnBorrar.addEventListener('click', () => {
            if (!filaSeleccionada) {
                alert("Por favor, seleccione una línea de venta de la tabla inferior para eliminar.");
                return;
            }

            if(confirm("¿Seguro que desea anular esta operación de venta? Se restablecerá el stock.")) {
                const idVenta = parseInt(filaSeleccionada.dataset.id);
                const venta = dbVentas.find(v => v.id === idVenta);
                
                // Devolver el stock
                dbProductos = JSON.parse(localStorage.getItem('kiosco_stock')) || [];
                const prodIndex = dbProductos.findIndex(p => p.codigo === venta.codigo);
                if (prodIndex !== -1) {
                    dbProductos[prodIndex].cantidad = parseInt(dbProductos[prodIndex].cantidad) + parseInt(venta.cantidad);
                    localStorage.setItem('kiosco_stock', JSON.stringify(dbProductos));
                }

                // Filtrar base de datos
                dbVentas = dbVentas.filter(v => v.id !== idVenta);
                localStorage.setItem('kiosco_ventas', JSON.stringify(dbVentas));
                
                filaSeleccionada = null;
                renderizarVentas();
            }
        });
    }

    // Modificar Venta Seleccionada (Cambiar la cantidad de ítems vendidos)
    if(btnModificar) {
        btnModificar.addEventListener('click', () => {
            if (!filaSeleccionada) {
                alert("Seleccione una línea de venta en la lista para modificar.");
                return;
            }
            const idVenta = parseInt(filaSeleccionada.dataset.id);
            const venta = dbVentas.find(v => v.id === idVenta);
            
            const nuevaCant = prompt(`Modificar cantidad para ${venta.descripcion}:`, venta.cantidad);
            if (nuevaCant && !isNaN(nuevaCant) && parseInt(nuevaCant) > 0) {
                const diff = parseInt(nuevaCant) - venta.cantidad;
                
                // Comprobar stock de esa diferencia
                dbProductos = JSON.parse(localStorage.getItem('kiosco_stock')) || [];
                const prodIndex = dbProductos.findIndex(p => p.codigo === venta.codigo);
                
                if (prodIndex !== -1) {
                    if (dbProductos[prodIndex].cantidad < diff) {
                        alert("No hay suficiente cantidad física en el stock para aplicar este incremento.");
                        return;
                    }
                    dbProductos[prodIndex].cantidad -= diff;
                    localStorage.setItem('kiosco_stock', JSON.stringify(dbProductos));
                }

                venta.cantidad = parseInt(nuevaCant);
                localStorage.setItem('kiosco_ventas', JSON.stringify(dbVentas));
                renderizarVentas();
            }
        });
    }

    function actualizarFechaHora() {
        const ahora = new Date();
        const fFecha = ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const fHora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        if(document.getElementById('txt-fecha')) document.getElementById('txt-fecha').textContent = fFecha;
        if(document.getElementById('txt-hora')) document.getElementById('txt-hora').textContent = fHora;
    }
});