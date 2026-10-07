const SUPABASE_URL = "https://zqjfluacxbuufbtkekix.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxamZsdWFjeGJ1dWZidGtla2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MzI4MDcsImV4cCI6MjA5ODAwODgwN30.42QArep0cojhmiiOxLYSXkuwz8VKN6FGytSDA4nbxX4";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let html5QrcodeScanner = null;

//let  supabase;
let map, markerOrigen, markerDestino, routeLine;
let coordsOrigen = null, coordsDestino = null;

async function inicializarEntorno() {
    try{
    // Inicializamos el cliente oficial de Supabase con datos reales
    if (typeof window.supabase !== "undefined") {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else if (typeof supabasejs !== "undefined") {
      supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (error) {
    console.warn("Advertencia al cargar archivo .env.local (usando variables por defecto):", error);
    // Fallback por si falla el fetch
    if (typeof window.supabase !== "undefined") {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Esperar obligatoriamente a que se carguen las credenciales reales
  await inicializarEntorno();
  
  // 2. Inicializar componentes visuales de interfaz
  initMobileMenu();
  initLeafletMap();
  initSearchPredictivo();

  // 3. Carga Asincrónica Segura de Datos desde Tablas de Supabase
  await cargarFlota();
  await cargarViajes();
  await cargarPresupuestosAdmin();
  await cargarGaleriaPublica();
  if (document.getElementById("admin-galeria-list")) {
    await cargarGaleriaAdmin();
  }

function initDashboard() {
    fetchFlota();
    fetchViajes();
    poblarSelectorViajes();
    // Inicializar Reloj en Tiempo Real
    iniciarReloj();
    
    // Consultar Cotizaciones Financieras
    obtenerCotizacionesFinancieras();
    
    // Intervalo de actualización de cotizaciones cada 10 minutos para optimizar ancho de banda
    setInterval(obtenerCotizacionesFinancieras, 600000);
}

/**
 * Módulo de Reloj Digital de Precisión Local
 */
function iniciarReloj() {
    const contenedorReloj = document.getElementById("reloj-digital");
    if (!contenedorReloj) return;

    setInterval(() => {
        const ahora = new Date();
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const segundos = String(ahora.getSeconds()).padStart(2, '0');
        
        contenedorReloj.innerText = `${horas}:${minutos}:${segundos}`;
    }, 1000);
}

/**
 * Módulo de Consulta API Financiera Abierta (Dólar, Euro, Real Oficial y Blue)
 */
async function obtenerCotizacionesFinancieras() {
    try {
        // Consumo de API pública y gratuita de cotizaciones para Argentina (DolarApi)
        const responseDolar = await fetch("https://dolarapi.com/v1/dolares/blue");
        const responseEuro = await fetch("https://dolarapi.com/v1/cotizaciones/euro");
        const responseReal = await fetch("https://dolarapi.com/v1/cotizaciones/real");

        if (responseDolar.ok) {
            const usd = await responseDolar.json();
            document.getElementById("cotiz-usd-compra").innerText = `$${Math.round(usd.compra)}`;
            document.getElementById("cotiz-usd-venta").innerText = `$${Math.round(usd.venta)}`;
        }

        if (responseEuro.ok) {
            const eur = await responseEuro.json();
            document.getElementById("cotiz-eur").innerText = `$${Math.round(eur.venta)}`;
        }

        if (responseReal.ok) {
            const brl = await responseReal.json();
            document.getElementById("cotiz-brl").innerText = `$${Math.round(brl.venta)}`;
        }
    } catch (error) {
        console.warn("No se pudieron recuperar las cotizaciones en tiempo real en este momento:", error);
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-gray-800', 'text-brandAzul');
        b.classList.add('text-gray-400');
    });
    
    document.getElementById(tabId).classList.remove('hidden');
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    activeBtn.classList.remove('text-gray-400');
    activeBtn.classList.add('bg-gray-800', 'text-brandAzul');
}

// Activar Listeners de Formularios de manera segura (evitando errores si un ID no existe en el index)
  const formGaleria = document.getElementById("form-admin-galeria");
  if (formGaleria) formGaleria.addEventListener("submit", subirFotoGaleria);

  const tipoPersona = document.getElementById("tipo_persona");
  if (tipoPersona) {
    tipoPersona.addEventListener("change", (e) => {
      const wrapperEmpresa = document.getElementById("wrapper-empresa");
      const inputEmpresa = document.getElementById("pres_empresa");

      if (e.target.value === "Rosa" || e.target.value === "Institucion") {
        wrapperEmpresa.classList.remove("hidden");
        inputEmpresa.setAttribute("required", "true");
      } else {
        wrapperEmpresa.classList.add("hidden");
        inputEmpresa.removeAttribute("required");
        inputEmpresa.value = ""; 
      }
    });
  }

 const formPresupuesto = document.getElementById("form-presupuesto");
  if (formPresupuesto) formPresupuesto.addEventListener("submit", guardarPresupuesto);

  const formViaje = document.getElementById("form-admin-viaje");
  if (formViaje) formViaje.addEventListener("submit", crearNuevoViaje);
});

// READ: Cargar fotos en el sitio web principal
async function cargarGaleriaPublica() {
  const container = document.getElementById("galeria-container");
  if (!container) return;

  const { data: fotos, error } = await supabase
    .from("galeria")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !fotos || fotos.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">Próximamente compartiremos las fotos de nuestros rumbos...</p>`;
    return;
  }

  container.innerHTML = "";
  container.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  fotos.forEach((foto) => {
    container.innerHTML += `
          <div class="group relative overflow-hidden rounded-xl shadow-md bg-white transition-all duration-300 hover:shadow-xl">
              <div class="h-64 overflow-hidden bg-gray-100">
                  <img src="${foto.url_imagen}" alt="${foto.titulo}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white">
                  <h4 class="font-bold text-lg leading-tight">${foto.titulo}</h4>
                  ${foto.descripcion ? `<p class="text-xs text-gray-300 mt-1">${foto.descripcion}</p>` : ""}
              </div>
          </div>
      `;
  });
}

// CREATE: Subir imagen física a Storage e insertar registro en Base de Datos
async function subirFotoGaleria(e) {
  e.preventDefault();

  const titulo = document.getElementById("gal-titulo").value.trim();
  const descripcion = document.getElementById("gal-desc").value.trim();
  const fileInput = document.getElementById("gal-file");

  if (fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const fileExt = file.name.split(".").pop();
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  try {
    const { data: storageData, error: storageError } = await supabase.storage
      .from("galeria-viajes")
      .upload(nombreArchivo, file);

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage
      .from("galeria-viajes")
      .getPublicUrl(nombreArchivo);

    const urlImagenPublica = urlData.publicUrl;

    const { error: dbError } = await supabase.from("galeria").insert([
      {
        titulo: titulo,
        descripcion: descripcion ? descripcion : null,
        url_imagen: urlImagenPublica,
        nombre_archivo_storage: nombreArchivo,
      },
    ]);

    if (dbError) throw dbError;

    alert("¡Foto añadida con éxito al book!");
    document.getElementById("form-admin-galeria").reset();

    await cargarGaleriaPublica();
    await cargarGaleriaAdmin();
  } catch (err) {
    console.error("Error gestionando la galería:", err);
    alert("No se pudo subir la imagen. Verifique consola o permisos del bucket.");
  }
}

// READ (Admin): Mostrar miniaturas con opción de borrado
async function cargarGaleriaAdmin() {
  const listContainer = document.getElementById("admin-galeria-list");
  if (!listContainer) return;

  const { data: fotos, error } = await supabase
    .from("galeria")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !fotos) return;

  listContainer.innerHTML = "";
  fotos.forEach((f) => {
    listContainer.innerHTML += `
          <div class="relative group border rounded-lg overflow-hidden bg-gray-50 h-24 shadow-sm">
              <img src="${f.url_imagen}" class="w-full h-full object-cover">
              <button onclick="eliminarFotoGaleria('${f.id}', '${f.nombre_archivo_storage}')" 
                      class="absolute inset-0 bg-red-600/80 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity duration-200">
                  Borrar 🗑️
              </button>
          </div>
      `;
  });
}

// DELETE: Quitar archivo de Storage y eliminar registro SQL
async function eliminarFotoGaleria(id, nombreArchivoStorage) {
  if (!confirm("¿Está seguro de que desea eliminar permanentemente esta foto del book?")) return;

  try {
    const { error: storageError } = await supabase.storage
      .from("galeria-viajes")
      .remove([nombreArchivoStorage]);

    if (storageError) console.warn("Aviso: El archivo físico ya no existía en Storage.");

    const { error: dbError } = await supabase.from("galeria").delete().eq("id", id);
    if (dbError) throw dbError;

    alert("Foto removida correctamente.");
    await cargarGaleriaPublica();
    await cargarGaleriaAdmin();
  } catch (err) {
    console.error("Error al eliminar la foto:", err);
    alert("Ocurrió un inconveniente al purgar el registro.");
  }
}

// Menú Móvil Hamburguesa
function initMobileMenu() {
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", () => menu.classList.toggle("hidden"));
  }
}



// --- CRUD FLOTA ---
async function fetchFlota() {
    const { data, error } = await supabase.from('flota').select('*');
    if(!error && data) {
        document.getElementById("table-flota-body").innerHTML = data.map(u => `
            <tr>
                <td class="p-4 font-mono text-brandAzul font-bold">${u.patente}</td>
                <td class="p-4 text-white">${u.marca_modelo}</td>
                <td class="p-4 text-center font-bold">${u.asientos}</td>
                <td class="p-4 text-gray-300">${u.seguro_vencimiento}</td>
                <td class="p-4 text-gray-300">${u.rto_vencimiento}</td>
                <td class="p-4 text-right">
                    <button onclick="eliminarFlota('${u.id}')" class="text-red-400 hover:text-red-500 text-xs font-bold"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
}

function abrirModalFlota() { document.getElementById("modal-flota").classList.remove("hidden"); }
function cerrarModalFlota() { document.getElementById("modal-flota").classList.add("hidden"); }

async function guardarUnidadFlota() {
    const payload = {
        patente: document.getElementById("f_patente").value,
        marca_modelo: document.getElementById("f_modelo").value,
        asientos: parseInt(document.getElementById("f_asientos").value),
        descripcion: document.getElementById("f_desc").value,
        seguro_vencimiento: document.getElementById("f_seguro").value,
        rto_vencimiento: document.getElementById("f_rto").value
    };
    const { error } = await supabase.from('flota').insert([payload]);
    if(!error) { cerrarModalFlota(); fetchFlota(); } else { alert(error.message); }
}

async function eliminarFlota(id) {
    if(confirm("¿Eliminar unidad permanentemente?")) {
        await supabase.from('flota').delete().eq('id', id);
        fetchFlota();
    }
}

// --- CRUD VIAJES ---
async function fetchViajes() {
    const { data, error } = await supabase.from('viajes_paquetes').select('*');
    if(!error && data) {
        document.getElementById("table-viajes-body").innerHTML = data.map(v => `
            <tr>
                <td class="p-4 font-bold text-white">${v.titulo} <span class="block text-xs text-gray-400 font-normal">${v.destino}</span></td>
                <td class="p-4">${new Date(v.fecha_salida).toLocaleDateString()}</td>
                <td class="p-4 font-bold text-brandAzul">$${parseFloat(v.precio).toLocaleString('es-AR')}</td>
                <td class="p-4"><span class="text-xs uppercase px-2 py-0.5 rounded font-bold bg-gray-900">${v.estado}</span></td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="eliminarViaje('${v.id}', 'finalizado')" class="text-amber-400 hover:text-amber-500 text-xs font-bold" title="Cierre Estadístico">Finalizar</button>
                    <button onclick="eliminarViaje('${v.id}', 'error')" class="text-red-500 hover:text-red-600 text-xs" title="Borrado Físico"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
}

function abrirModalViaje() { document.getElementById("modal-viaje").classList.remove("hidden"); }
function cerrarModalViaje() { document.getElementById("modal-viaje").classList.add("hidden"); }

async function guardarViajePaquete() {
    const fileInput = document.getElementById("v_file");
    let imgUrl = null;

    if(fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('imagenes').upload(fileName, file);
        if(!uploadError) {
            const { data: publicData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
            imgUrl = publicData.publicUrl;
        }
    }

    const payload = {
        titulo: document.getElementById("v_titulo").value,
        descripcion: document.getElementById("v_desc").value,
        destino: document.getElementById("v_destino").value,
        fecha_salida: new Date(document.getElementById("v_fecha").value).toISOString(),
        precio: parseFloat(document.getElementById("v_precio").value),
        estado: document.getElementById("v_estado").value,
        mensaje_whatsapp: document.getElementById("v_msg").value,
        imagen_url: imgUrl
    };

    const { error } = await supabase.from('viajes_paquetes').insert([payload]);
    if(!error) { cerrarModalViaje(); fetchViajes(); poblarSelectorViajes(); } else { alert(error.message); }
}

async function eliminarViaje(id, modo) {
    if(modo === 'finalizado') {
        // Lógica sugerida para estadísticas: Se pasa a histórico (ejemplo cambiando estado)
        await supabase.from('viajes_paquetes').update({ estado: 'agotado' }).eq('id', id);
        alert("Viaje archivado para histórico estadístico.");
    } else {
        if(confirm("¿Eliminar viaje por error de carga? No podrá recuperarse.")) {
            await supabase.from('viajes_paquetes').delete().eq('id', id);
        }
    }
    fetchViajes();
}

// --- LOGÍSTICA DE EQUIPAJES & CONTIINGENTES (RESOLUCIÓN 4/2026) ---
async function poblarSelectorViajes() {
    const { data } = await supabase.from('viajes_paquetes').select('id, titulo, destino');
    if(data) {
        const select = document.getElementById("select-viaje-equipaje");
        select.innerHTML = '<option value="">-- Seleccionar itinerario --</option>' + 
            data.map(v => `<option value="${v.id}">${v.titulo} (${v.destino})</option>`).join('');
    }
}

async function cargarPasajerosPorViaje() {
    const viajeId = document.getElementById("select-viaje-equipaje").value;
    if(!viajeId) return;

    const { data, error } = await supabase.from('pasajeros_viaje').select('*').eq('viaje_id', viajeId);
    if(!error && data) {
        const tbody = document.getElementById("table-pasajeros-body");
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">No hay pasajeros inscritos en este viaje. Use el botón de arriba para testear.</td></tr>`;
            return;
        }
        tbody.innerHTML = data.map(p => `
            <tr class="border-b border-gray-800">
                <td class="p-3 font-semibold text-white">${p.nombre_apellido} <span class="block text-gray-400 font-mono text-[10px]">${p.dni}</span></td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button onclick="alterarBultos(${p.id}, -1)" class="bg-gray-700 px-1.5 rounded font-bold text-white">-</button>
                        <span class="font-mono text-sm w-4">${p.bultos}</span>
                        <button onclick="alterarBultos(${p.id}, 1)" class="bg-gray-700 px-1.5 rounded font-bold text-white">+</button>
                    </div>
                </td>
                <td class="p-3 text-right">
                    <button onclick="imprimirTicketTermico('${p.dni}', '${p.nombre_apellido}', ${p.bultos}, ${viajeId})" class="bg-brandCalido text-white font-bold px-2 py-1 rounded text-[10px] ${p.bultos === 0 ? 'opacity-40 pointer-events-none':''}"><i class="fa-solid fa-print"></i> Sticker</button>
                </td>
            </tr>
        `).join('');
    }
}

async function agregarPasajeroRapido() {
    const viajeId = document.getElementById("select-viaje-equipaje").value;
    if(!viajeId) return alert("Seleccioná un viaje primero.");
    const nombre = prompt("Nombre y Apellido del pasajero:");
    const dni = prompt("DNI:");
    if(nombre && dni) {
        await supabase.from('pasajeros_viaje').insert([{ viaje_id: parseInt(viajeId), dni, nombre_apellido: nombre, bultos: 1 }]);
        cargarPasajerosPorViaje();
    }
}

async function alterarBultos(id, delta) {
    const { data } = await supabase.from('pasajeros_viaje').select('bultos').eq('id', id).single();
    let nuevoBulto = (data.bultos || 0) + delta;
    if (nuevoBulto < 0) nuevoBulto = 0;
    await supabase.from('pasajeros_viaje').update({ bultos: nuevoBulto }).eq('id', id);
    cargarPasajerosPorViaje();
}

// FORMATO DE IMPRESIÓN EXCLUSIVO PARA TICKETERAS TÉRMICAS BLUETOOTH / HOJA AUTOADHESIVA CONTINUA
function imprimirTicketTermico(dni, nombre, totalBultos, viajeId) {
    if(totalBultos === 0) return;

    // Crear una ventana oculta de impresión limpia estilizada para medidas comerciales standard de 58mm/80mm
    const printWindow = window.open('', '_blank', 'width=400,height=400');
    printWindow.document.write(`
        <html>
        <head>
            <style>
                @page { size: auto; margin: 0mm; }
                body { font-family: 'Courier New', monospace; padding: 10px; width: 260px; text-align: center; color: #000; font-size: 12px; }
                .bold { font-weight: bold; font-size: 14px; }
                .qr-box { display: flex; justify-content: center; margin: 8px 0; }
                .divider { border-top: 1px dashed #000; margin: 6px 0; }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
            <div class="bold">SIN RUMBOS</div>
            <div>CONTROL DE EQUIPAJE</div>
            <div>Res. CNRT 4/2026</div>
            <div class="divider"></div>
            <div style="text-align: left;">
                <b>Pasajero:</b> ${nombre}<br>
                <b>DNI:</b> ${dni}<br>
                <b>Viaje ID:</b> ${viajeId}<br>
                <b>Bultos Totales:</b> ${totalBultos}
            </div>
            <div class="divider"></div>
            <div class="qr-box" id="qr"></div>
            <div class="bold">BULTO ÚNICO DE CONTROL</div>
            <script>
                // Matriz de Datos del Código QR estructurada sin internet en ruta
                const stringPlanoCNRT = "SR2026|${viajeId}|${dni}|${nombre.replace(/ /g, '_')}|${totalBultos}";
                new QRCode(document.getElementById("qr"), { text: stringPlanoCNRT, width: 128, height: 128 });
                setTimeout(() => { window.print(); window.close(); }, 600);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// EXPORTACIONES A4 Y CNRT (.CSV PARA DUT)
async function exportarManifiestoA4() {
    const viajeId = document.getElementById("select-viaje-equipaje").value;
    if(!viajeId) return alert("Seleccioná un viaje.");
    const { data } = await supabase.from('pasajeros_viaje').select('*').eq('viaje_id', viajeId);
    
    let vistaA4 = window.open('', '_blank');
    vistaA4.document.write(`
        <html><head><title>Manifiesto Provincial - Córdoba</title>
        <style>body { font-family: Arial; padding: 40px; } table { width:100%; border-collapse:collapse; margin-top:20px; } th, td { border:1px solid #000; padding:8px; text-align:left; }</style></head>
        <body>
            <h2>SIN RUMBOS - MANIFIESTO BASE DE PASAJEROS</h2>
            <p><strong>Jurisdicción:</strong> Provincial (Córdoba) - Impresión Reglamentaria A4</p>
            <p><strong>ID de Servicio:</strong> ${viajeId}</p>
            <table>
                <thead><tr><th>DNI</th><th>Apellido y Nombre</th><th>Bultos Despachados</th></tr></thead>
                <tbody>${data.map(p => `<tr><td>${p.dni}</td><td>${p.nombre_apellido}</td><td>${p.bultos}</td></tr>`).join('')}</tbody>
            </table>
            <script>setTimeout(() => window.print(), 500);</script>
        </body></html>
    `);
    vistaA4.document.close();
}

async function exportarCNRT_CSV() {
    const viajeId = document.getElementById("select-viaje-equipaje").value;
    if(!viajeId) return alert("Seleccioná un viaje.");
    const { data } = await supabase.from('pasajeros_viaje').select('dni, nombre_apellido, bultos').eq('viaje_id', viajeId);
    
    // Generación de la matriz CSV mapeando el formato estricto que requiere la CNRT para importar el DUT masivo
    let csvContent = "data:text/csv;charset=utf-8,DNI,APELLIDO_NOMBRE,CANTIDAD_BULTOS\n" + 
        data.map(p => `"${p.dni}","${p.nombre_apellido}",${p.bultos}`).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contingente_cnrt_viaje_${viajeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- MÓDULO DE ESCANEO EN RUTA CON FILTRADO OFFLINE (VISTA CELULAR DEL CHOFER) ---
function iniciarEscaneoRuta() {
    const viajeIdActivo = document.getElementById("select-viaje-equipaje").value;
    if(!viajeIdActivo) return alert("Por seguridad, el chofer debe fijar el viaje actual en el selector para realizar el control de ruta.");

    document.getElementById("scanner-result").className = "p-4 rounded-xl text-sm font-bold border border-blue-700 bg-blue-900 text-blue-200 animate-pulse";
    document.getElementById("scanner-result").innerText = "Cámara activa. Apunte al sticker térmico...";

    html5QrcodeScanner = new Html5Qrcode("scanner-preview");
    html5QrcodeScanner.start(
        { facingMode: "environment" }, // Abre la cámara trasera directamente en móviles
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            // Lógica de validación de String Plano del Software (Sin conexión de red requerida)
            // Estructura esperada: SR2026|ID_VIAJE|DNI_PASAJERO|APELLIDO_NOMBRE|BULTO_NUM_TOTAL
            const componentes = decodedText.split('|');
            const resBox = document.getElementById("scanner-result");

            if(componentes.length === 5 && componentes[0] === "SR2026") {
                const idViajeSticker = componentes[1];
                const pasajero = componentes[3].replace(/_/g, ' ');

                if(idViajeSticker === viajeIdActivo) {
                    resBox.className = "p-4 rounded-xl text-sm font-bold border border-green-700 bg-green-950 text-green-400";
                    resBox.innerHTML = `🟢 VALIDACIÓN EXITOSA<br>Pasajero: ${pasajero}<br>Bulto verificado para este viaje.`;
                    // Sonido nativo de validación positiva
                    reproducirBeep(true);
                } else {
                    resBox.className = "p-4 rounded-xl text-sm font-bold border border-red-700 bg-red-950 text-red-400";
                    resBox.innerHTML = `🚨 ALERTA ROJA: ERROR DE TRAYECTO<br>Este bulto pertenece al Viaje ID: ${idViajeSticker}. ¡No subir a esta unidad!`;
                    reproducirBeep(false);
                }
            } else {
                resBox.className = "p-4 rounded-xl text-sm font-bold border border-yellow-700 bg-yellow-950 text-yellow-400";
                resBox.innerText = "Código QR detectado pero no corresponde al formato estructurado CNRT Sin Rumbos.";
            }
        },
        (errorMessage) => { /* Silenciar logs de lectura fallida continua por frames */ }
    ).catch(err => alert("Error al iniciar cámara: " + err));
}

function detenerEscaneoRuta() {
    if(html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            document.getElementById("scanner-result").className = "p-4 rounded-xl text-sm font-bold border border-gray-700 bg-gray-900 text-gray-500";
            document.getElementById("scanner-result").innerText = "Scanner apagado.";
        });
    }
}

// Síntesis de Audio Nativa Web para alertas acústicas sin depender de archivos .mp3 externos
function reproducirBeep(exito) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(exito ? 880 : 220, audioCtx.currentTime); // Agudo para correcto, grave para error
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + (exito ? 0.15 : 0.4));
}