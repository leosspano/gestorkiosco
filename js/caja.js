document.addEventListener('DOMContentLoaded', () => {
    const selectorFecha = document.getElementById('fecha-jornada');
    const listaMovimientos = document.getElementById('lista-movimientos');
    const boxAuditoriaLogs = document.getElementById('box-auditoria-logs');

    // UI Cards
    const lblCantVentasCard = document.getElementById('lbl-cant-ventas-card');
    const lblTotalCobrado = document.getElementById('lbl-total-cobrado');
    const lblSaldoActualCard = document.getElementById('lbl-saldo-actual-card');
    const badgeEstadoTexto = document.getElementById('badge-estado-texto');
    const cardEstadoBorde = document.getElementById('card-estado-borde');

    // UI Sidebar
    const sideHoraApertura = document.getElementById('side-hora-apertura');
    const sideCajero = document.getElementById('side-cajero');
    const sideCantVentas = document.getElementById('side-cant-ventas');
    const sideSaldoActual = document.getElementById('side-saldo-actual');
    const sideEstadoTexto = document.getElementById('side-estado-texto');

    // Modales
    const modalFlujo = document.getElementById('modal-flujo');
    const formFlujo = document.getElementById('form-flujo');
    const flujoTipo = document.getElementById('flujo-tipo');
    const flujoIdEdit = document.getElementById('flujo-id-edit');
    const flujoMonto = document.getElementById('flujo-monto');
    const flujoMotivo = document.getElementById('flujo-motivo');
    const modalLogs = document.getElementById('modal-logs');

    let fechaTrabajo = new Date().toISOString().split('T')[0];
    selectorFecha.value = fechaTrabajo;

    setInterval(() => {
        document.getElementById('footer-hora').textContent = new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
    }, 1000);

    selectorFecha.addEventListener('change', (e) => {
        fechaTrabajo = e.target.value;
        renderizarCajaCompleta();
    });

    function renderizarCajaCompleta() {
        const estado = JSON.parse(localStorage.getItem(`caja_estado_${fechaTrabajo}`)) || { abierta: false, inicial: 0, hora: '--:--', cajero: 'Ninguno' };
        const movimientos = JSON.parse(localStorage.getItem(`caja_movimientos_${fechaTrabajo}`)) || [];

        let cobradoVentas = 0;
        let cantVentas = 0;
        let ingresos = 0;
        let egresos = 0;

        listaMovimientos.innerHTML = '';

        if(movimientos.length === 0) {
            listaMovimientos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Sin movimientos en la fecha seleccionada.</td></tr>`;
        } else {
            movimientos.forEach(m => {
                if(m.tipo === 'Venta') { cobradoVentas += m.monto; cantVentas++; }
                else if(m.tipo === 'Ingreso') { ingresos += m.monto; }
                else if(m.tipo === 'Egreso') { egresos += m.monto; }

                const esEgreso = m.tipo === 'Egreso';
                const tr = document.createElement('tr');
                
                // Generar controles solo si NO es una venta directa
                const accionesHTML = m.tipo === 'Venta' 
                    ? `<span style="color:#94a3b8; font-size:0.8rem; font-style:italic;">Inalterable</span>`
                    : `<button class="action-inline-btn" style="color:#0288d1; background:none; border:none; cursor:pointer;" onclick="editarFlujoManual('${m.id}')"><i class="fa-solid fa-pen"></i></button>
                       <button class="action-inline-btn" style="color:#ef4444; background:none; border:none; cursor:pointer; margin-left:8px;" onclick="eliminarFlujoManual('${m.id}')"><i class="fa-solid fa-trash"></i></button>`;

                tr.innerHTML = `
                    <td><strong>${m.hora}</strong></td>
                    <td><span style="background:${esEgreso?'#fee2e2':'#d1fae5'}; color:${esEgreso?'#ef4444':'#065f46'}; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;">${m.tipo.toUpperCase()}</span></td>
                    <td>${m.desc}</td>
                    <td>${m.pago}</td>
                    <td style="text-align:right; font-weight:bold; color:${esEgreso?'#ef4444':'#10b981'}">$ ${m.monto.toFixed(2)}</td>
                    <td style="text-align:center;">${accionesHTML}</td>
                `;
                listaMovimientos.appendChild(tr);
            });
        }

        const saldoFinal = estado.inicial + cobradoVentas + ingresos - egresos;

        lblCantVentasCard.textContent = `${cantVentas} ventas`;
        lblTotalCobrado.textContent = `$ ${cobradoVentas.toFixed(2)}`;
        lblSaldoActualCard.textContent = `$ ${saldoFinal.toFixed(2)}`;
        
        sideHoraApertura.textContent = estado.hora;
        sideCajero.textContent = estado.cajero;
        sideCantVentas.textContent = cantVentas;
        sideSaldoActual.textContent = `$ ${saldoFinal.toFixed(2)}`;

        if(estado.abierta) {
            badgeEstadoTexto.textContent = "ABIERTA";
            badgeEstadoTexto.style.background = "#d1fae5"; badgeEstadoTexto.style.color = "#065f46";
            cardEstadoBorde.style.borderLeftColor = "#10b981";
            sideEstadoTexto.textContent = "Abierta / Recaudando";
            sideEstadoTexto.style.color = "#10b981";
        } else {
            badgeEstadoTexto.textContent = "CERRADA";
            badgeEstadoTexto.style.background = "#fee2e2"; badgeEstadoTexto.style.color = "#991b1b";
            cardEstadoBorde.style.borderLeftColor = "#ef4444";
            sideEstadoTexto.textContent = "Cerrada / Historial";
            sideEstadoTexto.style.color = "#ef4444";
        }
    }

    // ACCIONES DE APERTURA USANDO LA FECHA SELECCIONADA ARRIBA
    document.getElementById('btn-abrir-caja').addEventListener('click', () => {
        const estado = JSON.parse(localStorage.getItem(`caja_estado_${fechaTrabajo}`));
        if(estado && estado.abierta) return alert("La caja de esta fecha ya se encuentra abierta.");

        const base = parseFloat(prompt(`Abriendo caja para el día [${fechaTrabajo}].\nIngrese base de dinero en efectivo ($):`, "0"));
        if(isNaN(base) || base < 0) return alert("Fondo inválido.");

        localStorage.setItem(`caja_estado_${fechaTrabajo}`, JSON.stringify({
            abierta: true, inicial: base,
            hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}),
            cajero: 'Administrador'
        }));
        
        if(!localStorage.getItem(`caja_movimientos_${fechaTrabajo}`)) {
            localStorage.setItem(`caja_movimientos_${fechaTrabajo}`, JSON.stringify([]));
        }

        registrarLogAuditoria('APERTURA', `Apertura de jornada iniciada con caja física en $${base}`);
        renderizarCajaCompleta();
    });

    document.getElementById('btn-cerrar-caja').addEventListener('click', () => {
        const estado = JSON.parse(localStorage.getItem(`caja_estado_${fechaTrabajo}`));
        if(!estado || !estado.abierta) return alert("La caja de esta fecha no está abierta.");

        if(confirm(`¿Desea cerrar la caja del día ${fechaTrabajo}?`)) {
            estado.abierta = false;
            localStorage.setItem(`caja_estado_${fechaTrabajo}`, JSON.stringify(estado));
            registrarLogAuditoria('CIERRE', `Cierre de jornada contable.`);
            renderizarCajaCompleta();
        }
    });

    // CONTROL DE INGRESOS Y EGRESOS MANUALES
    const abrirModalMovimiento = (tipo, id = '') => {
        const estado = JSON.parse(localStorage.getItem(`caja_estado_${fechaTrabajo}`));
        if(!estado || !estado.abierta) return alert("Acción bloqueada. Debe abrir la caja de este día para añadir flujos manuales.");

        flujoTipo.value = tipo;
        flujoIdEdit.value = id;
        formFlujo.reset();

        if(id) {
            document.getElementById('flujo-titulo').textContent = `Editar ${tipo}`;
            const movs = JSON.parse(localStorage.getItem(`caja_movimientos_${fechaTrabajo}`)) || [];
            const item = movs.find(m => m.id === id);
            if(item) { flujoMonto.value = item.monto; flujoMotivo.value = item.desc; }
        } else {
            document.getElementById('flujo-titulo').textContent = `Registrar ${tipo}`;
        }
        modalFlujo.style.display = 'flex';
    };

    document.getElementById('btn-registrar-ingreso').addEventListener('click', () => abrirModalMovimiento('Ingreso'));
    document.getElementById('btn-registrar-egreso').addEventListener('click', () => abrirModalMovimiento('Egreso'));
    
    const cerrarFlujo = () => modalFlujo.style.display = 'none';
    document.getElementById('btn-cerrar-flujo').addEventListener('click', cerrarFlujo);
    document.getElementById('btn-cancelar-flujo').addEventListener('click', cerrarFlujo);

    formFlujo.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = flujoTipo.value;
        const idEdit = flujoIdEdit.value;
        const monto = parseFloat(flujoMonto.value);
        const desc = flujoMotivo.value;
        const pago = document.querySelector('input[name="flujo-pago"]:checked').value;

        let movimientos = JSON.parse(localStorage.getItem(`caja_movimientos_${fechaTrabajo}`)) || [];

        if(idEdit) {
            const idx = movimientos.findIndex(m => m.id === idEdit);
            if(idx !== -1) {
                const viejo = movimientos[idx];
                registrarLogAuditoria('MODIFICACIÓN', `ID ${idEdit}: Cambió de [${viejo.tipo} - $${viejo.monto} - ${viejo.desc}] a [${tipo} - $${monto} - ${desc}]`);
                movimientos[idx] = { id: idEdit, hora: viejo.hora, tipo, desc, pago, monto };
            }
        } else {
            movimientos.push({
                id: (tipo==='Ingreso'?'ING-':'EGR-') + Date.now(),
                hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}),
                tipo, desc, pago, monto
            });
        }

        localStorage.setItem(`caja_movimientos_${fechaTrabajo}`, JSON.stringify(movimientos));
        cerrarFlujo();
        renderizarCajaCompleta();
    });

    // VINCULACIÓN DE LOGS POR BOTÓN DESPLEGABLE
    document.getElementById('btn-logs-caja').addEventListener('click', () => {
        boxAuditoriaLogs.innerHTML = '';
        const logs = JSON.parse(localStorage.getItem('kioscok_logs_auditoria')) || [];
        const filtrados = logs.filter(l => l.fechaJornada === fechaTrabajo);

        if(filtrados.length === 0) {
            boxAuditoriaLogs.innerHTML = `<div style="color:#64748b;">> No hay logs de modificaciones en esta fecha.</div>`;
        } else {
            filtrados.forEach(l => {
                const p = document.createElement('div');
                p.className = 'log-entry';
                p.innerHTML = `> [${l.timestamp}] <span style="color:#ef4444; font-weight:bold;">${l.accion}</span>: ${l.desc}`;
                boxAuditoriaLogs.appendChild(p);
            });
        }
        modalLogs.style.display = 'flex';
    });

    document.getElementById('btn-cerrar-logs').addEventListener('click', () => modalLogs.style.display = 'none');

    // EXPOSICIÓN GLOBAL DE EDICIÓN Y BORRADO SEGURO
    window.editarFlujoManual = function(id) {
        const movs = JSON.parse(localStorage.getItem(`caja_movimientos_${fechaTrabajo}`)) || [];
        const item = movs.find(m => m.id === id);
        if(item) abrirModalMovimiento(item.tipo, id);
    };

    window.eliminarFlujoManual = function(id) {
        if(!confirm("¿Confirmar eliminación de este registro manual?")) return;
        let movs = JSON.parse(localStorage.getItem(`caja_movimientos_${fechaTrabajo}`)) || [];
        const item = movs.find(m => m.id === id);
        if(item) {
            registrarLogAuditoria('ELIMINACIÓN', `Removido completamente: [${item.tipo} - $${item.monto} - ${item.desc}]`);
            movs = movs.filter(m => m.id !== id);
            localStorage.setItem(`caja_movimientos_${fechaTrabajo}`, JSON.stringify(movs));
            renderizarCajaCompleta();
        }
    };

    function registrarLogAuditoria(accion, desc) {
        let logs = JSON.parse(localStorage.getItem('kioscok_logs_auditoria')) || [];
        logs.push({ fechaJornada: fechaTrabajo, timestamp: new Date().toLocaleTimeString('es-AR'), accion, desc });
        localStorage.setItem('kioscok_logs_auditoria', JSON.stringify(logs));
    }

    renderizarCajaCompleta();
});