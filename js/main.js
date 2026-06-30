document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Sistema KioscOK Iniciado");

    // SELECTORES PRINCIPALES
    const btnAgregarVenta = document.getElementById('btn-agregar-venta');
    const modalVenta = document.getElementById('modal-venta');
    const btnCerrarX = document.getElementById('btn-cerrar-modal-x');
    const btnCerrarCancelar = document.getElementById('btn-cerrar-modal-cancelar');
    
    const selectProducto = document.getElementById('buscar-producto');
    const inputPrecio = document.getElementById('venta-precio-unitario');
    const inputCantidad = document.getElementById('venta-cantidad');
    const btnAddItem = document.getElementById('btn-add-item-venta');
    const tablaTemporal = document.getElementById('lista-items-venta-temporal');
    const txtTotal = document.getElementById('total-acumulado');
    const formVenta = document.getElementById('form-venta');
    const listaVentasGondola = document.getElementById('lista-ventas');

    let carrito = [];
    const hoy = new Date().toISOString().split('T')[0];

    // --- 1. RELOJ ---
    setInterval(() => {
        const ahora = new Date();
        document.getElementById('txt-fecha').textContent = ahora.toLocaleDateString();
        document.getElementById('txt-hora').textContent = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }, 1000);

    // --- 2. FUNCIÓN ABRIR MODAL (LA CORREGIDA) ---
    const abrirModal = (e) => {
        if(e) e.preventDefault();
        console.log("Intentando abrir modal...");

        // Verificar si la caja está abierta
        const cajaKey = `caja_estado_${hoy}`;
        const cajaEstado = JSON.parse(localStorage.getItem(cajaKey));

        if (!cajaEstado || !cajaEstado.abierta) {
            alert("⚠️ DEBE ABRIR CAJA: No puede realizar ventas si la caja del día está cerrada. Redirigiendo a Caja...");
            window.location.href = "caja.html";
            return;
        }

        // Si la caja está abierta, preparamos el modal
        carrito = [];
        actualizarTablaTemporal();
        cargarProductos();
        modalVenta.style.display = 'flex'; 
    };

    // --- 3. EVENTOS DE CIERRE ---
    const cerrarModal = () => { modalVenta.style.display = 'none'; };

    // ASIGNACIÓN DE CLICKS
    if (btnAgregarVenta) btnAgregarVenta.addEventListener('click', abrirModal);
    if (btnCerrarX) btnCerrarX.addEventListener('click', cerrarModal);
    if (btnCerrarCancelar) btnCerrarCancelar.addEventListener('click', cerrarModal);

    // --- 4. LÓGICA DE PRODUCTOS ---
    function cargarProductos() {
        const stock = JSON.parse(localStorage.getItem('kioscok_stock')) || [];
        selectProducto.innerHTML = '<option value="">-- Seleccione un producto --</option>';
        
        stock.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.codigo;
            opt.dataset.precio = p.precio;
            opt.dataset.nombre = p.nombre;
            opt.dataset.stock = p.cantidad;
            opt.textContent = `${p.nombre} (Disp: ${p.cantidad}) - $${p.precio}`;
            selectProducto.appendChild(opt);
        });
    }

    selectProducto.addEventListener('change', () => {
        const opt = selectProducto.options[selectProducto.selectedIndex];
        inputPrecio.value = opt.value ? `$ ${opt.dataset.precio}` : "";
    });

    // --- 5. AÑADIR AL CARRITO TEMPORAL ---
    btnAddItem.addEventListener('click', () => {
        const opt = selectProducto.options[selectProducto.selectedIndex];
        const cant = parseInt(inputCantidad.value);

        if (!opt.value || cant <= 0) return alert("Seleccione un producto y cantidad.");
        if (cant > parseInt(opt.dataset.stock)) return alert("No hay suficiente stock.");

        carrito.push({
            codigo: opt.value,
            nombre: opt.dataset.nombre,
            precio: parseFloat(opt.dataset.precio),
            cantidad: cant,
            subtotal: parseFloat(opt.dataset.precio) * cant
        });

        actualizarTablaTemporal();
        selectProducto.value = "";
        inputPrecio.value = "";
    });

    function actualizarTablaTemporal() {
        tablaTemporal.innerHTML = "";
        let total = 0;
        carrito.forEach((item, i) => {
            total += item.subtotal;
            tablaTemporal.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 5px;">${item.nombre} x${item.cantidad}</td>
                    <td style="text-align: right; padding: 5px;">$${item.subtotal.toFixed(2)}</td>
                </tr>`;
        });
        txtTotal.textContent = `$ ${total.toFixed(2)}`;
    }

    // --- 6. FINALIZAR VENTA ---
    formVenta.addEventListener('submit', (e) => {
        e.preventDefault();
        if (carrito.length === 0) return alert("El ticket está vacío.");

        let stockGlobal = JSON.parse(localStorage.getItem('kioscok_stock')) || [];
        let ventasDia = JSON.parse(localStorage.getItem(`ventas_historico_${hoy}`)) || [];
        let movimientosCaja = JSON.parse(localStorage.getItem(`caja_movimientos_${hoy}`)) || [];

        carrito.forEach(item => {
            // Descontar stock
            const prod = stockGlobal.find(p => p.codigo === item.codigo);
            if (prod) prod.cantidad -= item.cantidad;

            // Guardar en histórico de ventas
            ventasDia.push({
                codigo: item.codigo,
                nombre: item.nombre,
                montoTotal: item.subtotal,
                cantidad: item.cantidad
            });

            // Registrar en caja
            movimientosCaja.push({
                id: "VTA-" + Date.now(),
                hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                tipo: 'Venta',
                desc: `Venta: ${item.nombre}`,
                monto: item.subtotal
            });
        });

        localStorage.setItem('kioscok_stock', JSON.stringify(stockGlobal));
        localStorage.setItem(`ventas_historico_${hoy}`, JSON.stringify(ventasDia));
        localStorage.setItem(`caja_movimientos_${hoy}`, JSON.stringify(movimientosCaja));

        alert("Venta registrada con éxito.");
        cerrarModal();
        renderizarTablaPrincipal();
    });

    function renderizarTablaPrincipal() {
        const ventas = JSON.parse(localStorage.getItem(`ventas_historico_${hoy}`)) || [];
        const rowVacia = document.getElementById('row-vacia');
        
        // Limpiar filas viejas
        const filas = listaVentasGondola.querySelectorAll('tr:not(#row-vacia)');
        filas.forEach(f => f.remove());

        if (ventas.length > 0) {
            rowVacia.style.display = 'none';
            ventas.forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${v.codigo}</td>
                    <td>${v.nombre}</td>
                    <td>-</td><td>-</td>
                    <td style="color: green; font-weight: bold;">$${v.montoTotal.toFixed(2)}</td>
                    <td>${v.cantidad} u.</td>
                `;
                listaVentasGondola.appendChild(tr);
            });
        }
    }

    renderizarTablaPrincipal();
});