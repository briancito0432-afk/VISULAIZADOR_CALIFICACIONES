/*
 * =================================
 * SCRIPT CON PAGINACIÓN (EL CORRECTO)
 * =================================
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ENCONTRAR ELEMENTOS DE NAVEGACIÓN ---
    const btnNavCalif = document.getElementById('btn-nav-calificaciones');
    const btnNavAlumnos = document.getElementById('btn-nav-alumnos');
    const moduloCalif = document.getElementById('modulo-calificaciones');
    const moduloAlumnos = document.getElementById('modulo-alumnos');

    // --- 2. ELEMENTOS MÓDULO CALIFICACIONES ---
    const btnVerDatosCalif = document.getElementById('btn-ver-datos-calif');
    const selectOrdenarCalif = document.getElementById('select-ordenar-calif');
    const selectFiltroCalif = document.getElementById('select-filtro-calif');
    const campoBuscarCalif = document.getElementById('campo-buscar-calif');
    const btnBuscarCalif = document.getElementById('btn-buscar-calif');
    const contenedorTablaCalif = document.getElementById('contenedor-tabla-calif');
    const tituloTablaCalif = document.getElementById('titulo-tabla-calif');
    const mensajeErrorCalif = document.getElementById('mensaje-error-calif');
    // Elementos de Paginación Calif
    const paginacionCalif = document.getElementById('paginacion-calif');
    const btnCalifPrev = document.getElementById('btn-calif-prev');
    const btnCalifNext = document.getElementById('btn-calif-next');
    const infoCalifPage = document.getElementById('info-calif-page');

    // --- 3. ELEMENTOS MÓDULO ALUMNOS ---
    const selectOrdenarAlumnos = document.getElementById('select-ordenar-alumnos');
    const contenedorTablaAlumnos = document.getElementById('contenedor-tabla-alumnos');
    const tituloTablaAlumnos = document.getElementById('titulo-tabla-alumnos');
    const mensajeErrorAlumnos = document.getElementById('mensaje-error-alumnos');
    // Elementos de Paginación Alumnos
    const paginacionAlumnos = document.getElementById('paginacion-alumnos');
    const btnAlumnosPrev = document.getElementById('btn-alumnos-prev');
    const btnAlumnosNext = document.getElementById('btn-alumnos-next');
    const infoAlumnosPage = document.getElementById('info-alumnos-page');
    
    // --- 4. ESTADO DE LA APLICACIÓN ---
    let ultimaAccionCalif = 'welcome';
    let ultimoTerminoBusqueda = '';
    let alumnosYaCargados = false;
    // Estado de paginación
    let paginaActualCalif = 1;
    let paginaActualAlumnos = 1;

    // --- 5. LÓGICA DE NAVEGACIÓN ---
    btnNavCalif.addEventListener('click', () => {
        moduloCalif.style.display = 'block';
        moduloAlumnos.style.display = 'none';
        btnNavCalif.classList.add('active');
        btnNavAlumnos.classList.remove('active');
    });
    btnNavAlumnos.addEventListener('click', () => {
        moduloCalif.style.display = 'none';
        moduloAlumnos.style.display = 'block';
        btnNavCalif.classList.remove('active');
        btnNavAlumnos.classList.add('active');
        if (!alumnosYaCargados) {
            paginaActualAlumnos = 1; // Reiniciar página
            cargarAlumnos(paginaActualAlumnos);
            alumnosYaCargados = true;
        }
    });

    
    // --- 6. LÓGICA DEL MÓDULO CALIFICACIONES ---

    // Función 'refrescar' ahora decide qué función llamar con la página actual
    function refrescarVistaCalif(reiniciarPagina = false) {
        if (reiniciarPagina) {
            paginaActualCalif = 1;
        }
        
        if (ultimaAccionCalif === 'all') {
            cargarTodosLosDatos(paginaActualCalif);
        } else if (ultimaAccionCalif === 'search') {
            iniciarBusqueda(true); // 'iniciarBusqueda' usará paginaActualCalif
        }
    }

    // --- Listeners de Acciones (Calificaciones) ---
    btnVerDatosCalif.addEventListener('click', () => {
        ultimaAccionCalif = 'all'; 
        paginaActualCalif = 1; // Reiniciar
        cargarTodosLosDatos(paginaActualCalif);
    });
    btnBuscarCalif.addEventListener('click', () => iniciarBusqueda(false));
    campoBuscarCalif.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') iniciarBusqueda(false);
    });
    // Filtros reinician la página
    selectOrdenarCalif.addEventListener('change', () => refrescarVistaCalif(true));
    selectFiltroCalif.addEventListener('change', () => refrescarVistaCalif(true));

    // --- Listeners de Paginación (Calificaciones) ---
    btnCalifPrev.addEventListener('click', () => {
        if (paginaActualCalif > 1) {
            paginaActualCalif--;
            refrescarVistaCalif(); // Llama a refrescar, no directamente a la carga
        }
    });
    btnCalifNext.addEventListener('click', () => {
        paginaActualCalif++;
        refrescarVistaCalif();
    });


    function iniciarBusqueda(esRefresco) {
        const termino = esRefresco ? ultimoTerminoBusqueda : campoBuscarCalif.value.trim();
        if (termino === '') {
            mostrarError(mensajeErrorCalif, tituloTablaCalif, 'Por favor, escribe un término de búsqueda.');
            return;
        }
        
        if (!esRefresco) {
            paginaActualCalif = 1; // Si es una búsqueda NUEVA, reiniciar página
        }

        ultimaAccionCalif = 'search';
        ultimoTerminoBusqueda = termino;
        const orden = selectOrdenarCalif.value;
        const filtro = selectFiltroCalif.value; 
        buscarCalificaciones(termino, orden, filtro, paginaActualCalif); // Pasar página
    }

    async function buscarCalificaciones(termino, orden, filtro, pagina) {
        limpiarResultados(contenedorTablaCalif, mensajeErrorCalif, tituloTablaCalif, 'Buscando...', paginacionCalif);
        try {
            const url = `buscar.php?termino=${encodeURIComponent(termino)}&sort=${orden}&filter=${filtro}&pagina=${pagina}`;
            const respuesta = await fetch(url);
            const datos = await respuesta.json(); // Ahora es un objeto {data, total, ...}

            if (!respuesta.ok) {
                throw new Error(datos.error || 'Error del servidor'); 
            }
            
            // ### CAMBIO IMPORTANTE: Leemos "datos.data" ###
            if (datos.data.length === 0) {
                tituloTablaCalif.textContent = `Búsqueda: "${termino}"`;
                contenedorTablaCalif.innerHTML = '<p style="text-align: center; padding: 20px;">No se encontraron resultados.</p>';
                return;
            }
            tituloTablaCalif.textContent = `Resultados para "${termino}" (Total: ${datos.total})`;
            const tablaHTML = construirTablaHTML(datos.data); // ### Leemos "datos.data" ###
            contenedorTablaCalif.innerHTML = tablaHTML;

            // Actualizar UI de paginación
            actualizarPaginacion(paginacionCalif, btnCalifPrev, btnCalifNext, infoCalifPage, datos.pagina, datos.total_paginas);
            paginaActualCalif = datos.pagina; // Sincronizar estado

        } catch (error) {
            console.error('Error al buscar datos:', error);
            mostrarError(mensajeErrorCalif, tituloTablaCalif, error.message);
            ultimaAccionCalif = 'welcome';
        }
    }

    async function cargarTodosLosDatos(pagina) {
        ultimaAccionCalif = 'all';
        limpiarResultados(contenedorTablaCalif, mensajeErrorCalif, tituloTablaCalif, 'Cargando...', paginacionCalif);
        
        const orden = selectOrdenarCalif.value;
        const filtro = selectFiltroCalif.value;

        try {
            const url = `ver_todos.php?sort=${orden}&filter=${filtro}&pagina=${pagina}`;
            const respuesta = await fetch(url);
            const datos = await respuesta.json(); // Ahora es un objeto {data, total, ...}

            if (!respuesta.ok) {
                throw new Error(datos.error || 'Error del servidor');
            }
            
            // ### CAMBIO IMPORTANTE: Leemos "datos.data" ###
            if (datos.data.length === 0) {
                tituloTablaCalif.textContent = 'No se encontraron datos';
                contenedorTablaCalif.innerHTML = '<p style="text-align: center; padding: 20px;">No hay nada con ese filtro.</p>';
            } else {
                tituloTablaCalif.textContent = `Mostrando Todos (Total: ${datos.total})`;
                const tablaHTML = construirTablaHTML(datos.data); // ### Leemos "datos.data" ###
                contenedorTablaCalif.innerHTML = tablaHTML;
                
                // Actualizar UI de paginación
                actualizarPaginacion(paginacionCalif, btnCalifPrev, btnCalifNext, infoCalifPage, datos.pagina, datos.total_paginas);
                paginaActualCalif = datos.pagina; // Sincronizar estado
            }

        } catch (error) {
            console.error('Error al cargar todos los datos:', error);
            mostrarError(mensajeErrorCalif, tituloTablaCalif, error.message);
            ultimaAccionCalif = 'welcome';
        }
    }

    
    // --- 7. LÓGICA DEL MÓDULO ALUMNOS ---
    selectOrdenarAlumnos.addEventListener('change', () => {
        paginaActualAlumnos = 1; // Reiniciar página
        cargarAlumnos(paginaActualAlumnos);
    });

    // --- Listeners de Paginación (Alumnos) ---
    btnAlumnosPrev.addEventListener('click', () => {
        if (paginaActualAlumnos > 1) {
            paginaActualAlumnos--;
            cargarAlumnos(paginaActualAlumnos);
        }
    });
    btnAlumnosNext.addEventListener('click', () => {
        paginaActualAlumnos++;
        cargarAlumnos(paginaActualAlumnos);
    });

    async function cargarAlumnos(pagina) {
        limpiarResultados(contenedorTablaAlumnos, mensajeErrorAlumnos, tituloTablaAlumnos, 'Cargando Alumnos...', paginacionAlumnos);
        const orden = selectOrdenarAlumnos.value;
        
        try {
            const respuesta = await fetch(`alumnos.php?sort=${orden}&pagina=${pagina}`);
            const datos = await respuesta.json(); // Ahora es un objeto {data, total, ...}

            if (!respuesta.ok) {
                throw new Error(datos.error || 'Error del servidor');
            }
            
            // ### CAMBIO IMPORTANTE: Leemos "datos.data" ###
            if (datos.data.length === 0) {
                tituloTablaAlumnos.textContent = 'No hay Alumnos';
                contenedorTablaAlumnos.innerHTML = '<p style="text-align: center; padding: 20px;">No hay alumnos registrados.</p>';
            } else {
                tituloTablaAlumnos.textContent = `Lista de Alumnos Registrados (Total: ${datos.total})`;
                const tablaHTML = construirTablaHTML(datos.data); // ### Leemos "datos.data" ###
                contenedorTablaAlumnos.innerHTML = tablaHTML;

                // Actualizar UI de paginación
                actualizarPaginacion(paginacionAlumnos, btnAlumnosPrev, btnAlumnosNext, infoAlumnosPage, datos.pagina, datos.total_paginas);
                paginaActualAlumnos = datos.pagina; // Sincronizar estado
            }

        } catch (error) {
            console.error('Error al cargar alumnos:', error);
            mostrarError(mensajeErrorAlumnos, tituloTablaAlumnos, error.message);
        }
    }


    // --- 8. FUNCIONES AYUDANTES (Helpers) ---

    // (Función construirTablaHTML no cambia)
    function construirTablaHTML(datos) {
        if (!datos || datos.length === 0) return '<p>No hay datos para mostrar.</p>';
        const columnas = Object.keys(datos[0]);
        let thead = '<thead><tr>';
        columnas.forEach(col => {
            let nombreColumna = col.replace(/_/g, ' ');
            nombreColumna = nombreColumna.charAt(0).toUpperCase() + nombreColumna.slice(1);
            thead += `<th>${nombreColumna}</th>`;
        });
        thead += '</tr></thead>';

        let tbody = '<tbody>';
        datos.forEach(fila => {
            tbody += '<tr>';
            columnas.forEach(col => {
                let valor = fila[col];
                let clasesCelda = ''; 

                if (col === 'Estatus') {
                    if (valor === 'Aprobado') {
                        clasesCelda = 'class="estatus-aprobado"';
                    } else {
                        clasesCelda = 'class="estatus-reprobado"';
                    }
                } else if (col.startsWith('proyecto')) {
                    valor = (valor == 1) ? 'Entregado' : 'No Entregado';
                    clasesCelda = 'class="celda-centrada"'; 
                } else {
                    valor = (valor === null || valor === undefined) ? 'N/A' : valor;
                }
                
                tbody += `<td ${clasesCelda}>${valor}</td>`;
            });
            tbody += '</tr>';
        });
        tbody += '</tbody>';
        
        return `<div class="tabla-wrapper"><table>${thead}${tbody}</table></div>`;
    }
    
    function mostrarError(elementoError, elementoTitulo, mensaje) {
        elementoTitulo.textContent = 'Error';
        elementoError.textContent = mensaje;
        elementoError.style.display = 'block';
    }
    
    // Ahora también debe ocultar la paginación
    function limpiarResultados(elementoContenedor, elementoError, elementoTitulo, mensajeCarga, elementoPaginacion) {
        elementoTitulo.textContent = '';
        elementoContenedor.innerHTML = `<p style="text-align: center; padding: 20px;">${mensajeCarga}</p>`;
        elementoError.innerHTML = '';
        elementoError.style.display = 'none';
        if (elementoPaginacion) {
            elementoPaginacion.style.display = 'none'; // Ocultar paginación
        }
    }

    // --- NUEVA FUNCIÓN ---
    // Ayudante para mostrar/ocultar y actualizar la paginación
    function actualizarPaginacion(elementoPaginacion, btnPrev, btnNext, infoPage, pagina, totalPaginas) {
        if (totalPaginas > 1) {
            elementoPaginacion.style.display = 'flex'; // Mostrar
            infoPage.textContent = `Página ${pagina} de ${totalPaginas}`;
            
            // Habilitar/Deshabilitar botones
            btnPrev.disabled = (pagina === 1);
            btnNext.disabled = (pagina === totalPaginas);
        } else {
            elementoPaginacion.style.display = 'none'; // Ocultar si solo hay 1 página
        }
    }

});