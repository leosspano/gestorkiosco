document.addEventListener('DOMContentLoaded', () => {
    const tablaInventario = document.getElementById('tabla-inventario');
    const modalProducto = document.getElementById('modal-producto');
    const formProducto = document.getElementById('form-producto');
    const modalTitle = document.getElementById('modal-stock-title');
    
    // Botones de acción
    const btnAgregar = document.getElementById('stock-agregar');
    const btnModificar = document.getElementById('stock-modificar');
    const btnBorrar = document.getElementById('stock-borrar');
    const closeBtns = document.querySelectorAll('.close-modal-btn');

    let filaSeleccionada = null;
    let productos = JSON.parse(localStorage.getItem('kiosco_stock')) || [];

    // Cargar los 10 productos base si la base local está completamente vacía (Como en tu ejemplo)
    if (productos.length === 0) {
        productos = [
            { codigo: "0001", descripcion: "Coca Cola 500ml", marca: "Coca Cola", categoria: "Gaseosas", cantidad: 24, precioCosto: 1050, precioVenta: 1500, proveedor: "Distribuidora del Sur" },
            { codigo: "0002", descripcion: "Pepsi 500ml", marca: "Pepsi", categoria: "Gaseosas", cantidad: 18, precioCosto: 1000, precioVenta: 1450, proveedor: "Distribuidora del Sur" },
            { codigo: "0003", descripcion: "Agua Mineral 1.5L", marca: "Nestlé", categoria: "Aguas", cantidad: 30, precioCosto: 850, precioVenta: 1200, proveedor: "Aguas Argentinas" },
            { codigo: "0004", descripcion: "Papitas Lays Clásicas 70g", marca: "Lays", categoria: "Snacks", cantidad: 12, precioCosto: 950, precioVenta: 1350, proveedor: "PepsiCo Alimentos" },
            { codigo: "0005", descripcion: "Chocolate Hershey's 100g", marca: "Hershey's", categoria: "Golosinas", cantidad: 20, precioCosto: 850, precioVenta: 1300, proveedor: "Mundo Dulce" }
        ];
        localStorage.setItem('kiosco_stock', JSON.stringify(productos));
    }

    renderizarInventario();

    // Abrir modal para nuevo producto
    btnAgregar.addEventListener('click', () => {
        formProducto.reset();
        document.getElementById('edit-index').value = "-1";
        modalTitle.textContent = "Agregar Producto";
        document.getElementById('p-codigo').disabled = false;
        modalProducto.classList.add('active');
    });

    // Cerrar modal
    closeBtns.forEach(b => b.addEventListener('click', () => modalProducto.classList.remove('active')));

    // Guardar o Editar Producto
    formProducto.addEventListener('submit', (e) => {
        e.preventDefault();

        const editIndex = parseInt(document.getElementById('edit-index').value);
        const nuevoProd = {
            codigo: document.getElementById('p-codigo').value,
            descripcion: document.getElementById('p-descripcion').value,
            marca: document.getElementById('p-marca').value,
            categoria: document.getElementById('p-categoria').value,
            cantidad: parseInt(document.getElementById('p-cantidad').value),
            precioCosto: parseFloat(document.getElementById('p-costo').value),
            precioVenta: parseFloat(document.getElementById('p-venta').value),
            proveedor: document.getElementById('p-proveedor').value
        };

        if (editIndex === -1) {
            // Validar que el código no exista
            if (productos.some(p => p.codigo === nuevoProd.codigo)) {
                alert("Este código de producto ya se encuentra registrado.");
                return;
            }
            productos.push(nuevoProd);
        } else {
            productos[editIndex] = nuevoProd;
        }

        localStorage.setItem('kiosco_stock', JSON.stringify(productos));
        modalProducto.classList.remove('active');
        filaSeleccionada = null;
        renderizarInventario();
    });

    // Abrir modal para modificar
    btnModificar.addEventListener('click', () => {
        if (!filaSeleccionada) {
            alert("Por favor, seleccione un producto de la lista inferior.");
            return;
        }

        const codigo = filaSeleccionada.dataset.codigo;
        const index = productos.findIndex(p => p.codigo === codigo);
        const p = productos[index];

        document.getElementById('edit-index').value = index;
        document.getElementById('p-codigo').value = p.codigo;
        document.getElementById('p-codigo').disabled = true; // El código no se debería alterar
        document.getElementById('p-descripcion').value = p.descripcion;
        document.getElementById('p-marca').value = p.marca;
        document.getElementById('p-categoria').value = p.categoria || "Gaseosas";
        document.getElementById('p-cantidad').value = p.cantidad;
        document.getElementById('p-costo').value = p.precioCosto;
        document.getElementById('p-venta').value = p.precioVenta;
        document.getElementById('p-proveedor').value = p.proveedor;

        modalTitle.textContent = "Modificar Producto";
        modalProducto.classList.add('active');
    });

    // Eliminar Producto del Stock
    btnBorrar.addEventListener('click', () => {
        if (!filaSeleccionada) {
            alert("Seleccione el producto que desea dar de baja de la tabla.");
            return;
        }

        if (confirm(`¿Está seguro de eliminar de forma permanente el producto seleccionado?`)) {
            const codigo = filaSeleccionada.dataset.codigo;
            productos = productos.filter(p => p.codigo !== codigo);
            localStorage.setItem('kiosco_stock', JSON.stringify(productos));
            filaSeleccionada = null;
            renderizarInventario();
        }
    });

    // Pintar la tabla
    function renderizarInventario() {
        tablaInventario.innerHTML = "";

        if(productos.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color:#999;">No hay mercadería cargada en el inventario.</td></tr>`;
            return;
        }

        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.dataset.codigo = p.codigo;
            
            // Lógica de alerta visual en cantidades bajas sugerida previamente
            let qtyStyle = "strong";
            if(p.cantidad === 0) qtyStyle = "color: #c62828; font-weight: bold;";
            else if (p.cantidad <= 5) qtyStyle = "color: #ef6c00; font-weight: bold;";

            tr.innerHTML = `
                <td class="code-column">${p.codigo}</td>
                <td>${p.descripcion}</td>
                <td>${p.marca}</td>
                <td class="qty-column" style="${qtyStyle}">${p.cantidad}</td>
                <td class="price-column" style="color:#555;">$ ${parseFloat(p.precioCosto).toFixed(2)}</td>
                <td class="price-column">$ ${parseFloat(p.precioVenta).toFixed(2)}</td>
                <td>${p.proveedor}</td>
            `;

            tr.addEventListener('click', () => {
                if (filaSeleccionada) filaSeleccionada.classList.remove('selected-row');
                if (filaSeleccionada === tr) {
                    filaSeleccionada = null;
                } else {
                    filaSeleccionada = tr;
                    tr.classList.add('selected-row');
                }
            });

            tablaInventario.appendChild(tr);
        });
    }
});