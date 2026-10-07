// CORRECCIÓN: Cambiados a 'let' para permitir que .env.local sobreescriba los valores sin romper el flujo
let SUPABASE_URL = "https://zqjfluacxbuufbtkekix.supabase.co"; 
let SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWZsdWFjeGJ1dWZ0a2VraXgiLCJpYXQiOjE3MTQwMzQ0MjAsImV4cCI6MTc0NTU3MDQyMH0.1234567890"; 

let supabase;
let map, markerOrigen, markerDestino, routeLine;
let coordsOrigen = null, coordsDestino = null;

async function inicializarEntorno() {
  try {
    const response = await fetch("./.env.local");
    if (!response.ok) throw new Error("No se pudo leer .env.local");
    const text = await response.text();

    text.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        if (key.trim() === "SUPABASE_URL") SUPABASE_URL = value.trim();
        if (key.trim() === "SUPABASE_ANON_KEY") SUPABASE_KEY = value.trim();
      }
    });

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

// Inicialización de Aplicación y Servicios
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

// Inicialización del Mapa Base (Leaflet)
function initLeafletMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  mapContainer.style.height = "350px";
  mapContainer.style.width = "100%";

  map = L.map("map", {
    center: [-33.0135, -61.8082], 
    zoom: 6,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 400);
}

// CORRECCIÓN: Vinculación real de los inputs con el mapa
function initSearchPredictivo() {
  setupAutocompletar('search-origen', 'res-origen', (coords, name) => {
    coordsOrigen = coords;
    if (markerOrigen) map.removeLayer(markerOrigen);
    markerOrigen = L.marker(coords).addTo(map).bindPopup("<b>Origen:</b><br>" + name).openPopup();
    calcularDistanciaRuta();
  });

  setupAutocompletar('search-destino', 'res-destino', (coords, name) => {
    coordsDestino = coords;
    if (markerDestino) map.removeLayer(markerDestino);
    markerDestino = L.marker(coords).addTo(map).bindPopup("<b>Destino:</b><br>" + name).openPopup();
    calcularDistanciaRuta();
  });
}

function setupAutocompletar(inputId, resultId, onSelect) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(resultId);

  if (!input || !box) return;

  input.addEventListener("input", debounce(async (e) => {
      const query = e.target.value.trim();
      if (query.length < 3) {
        box.classList.add("hidden");
        return;
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "SinRumbosTurismoApp/1.0 (festudio.desarrollos@gmail.com)",
          },
        });
        const data = await res.json();

        box.innerHTML = "";

        if (data && data.length > 0) {
          box.className = "absolute left-0 right-0 bg-white text-black z-[9999] rounded-lg shadow-2xl max-h-56 overflow-y-auto border border-gray-200 mt-1 block";

          data.forEach((item) => {
            const div = document.createElement("div");
            div.className = "p-3 hover:bg-gray-100 cursor-pointer text-xs border-b border-gray-100 font-medium text-gray-800 transition";
            div.innerText = item.display_name;

            div.addEventListener("click", () => {
              input.value = item.display_name;
              box.innerHTML = "";
              box.classList.add("hidden");
              onSelect([parseFloat(item.lat), parseFloat(item.lon)], item.display_name);
            });
            box.appendChild(div);
          });
        } else {
          box.classList.add("hidden");
        }
      } catch (err) {
        console.error("Error en geocodificación secuencial: ", err);
      }
    }, 400)
  );

  document.addEventListener("click", (event) => {
    if (event.target !== input && event.target !== box) {
      box.classList.add("hidden");
    }
  });
}

function calcularDistanciaRuta() {
  if (!coordsOrigen || !coordsDestino) return;

  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline([coordsOrigen, coordsDestino], {
    color: "#00AEEF",
    weight: 4,
  }).addTo(map);
  map.fitBounds(routeLine.getBounds());

  const R = 6371; 
  const dLat = ((coordsDestino[0] - coordsOrigen[0]) * Math.PI) / 180;
  const dLon = ((coordsDestino[1] - coordsOrigen[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coordsOrigen[0] * Math.PI) / 180) *
      Math.cos((coordsDestino[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c * 1.18; 

  const display = document.getElementById("distancia-display");
  if (display) {
    display.innerText = `Distancia aproximada: ${distancia.toFixed(1)} km`;
    display.dataset.value = distancia.toFixed(1);
  }
}

async function cargarFlota() {
  const container = document.getElementById("flota-container");
  if (!container) return;
  const { data: flota, error } = await supabase.from("flota").select("*");

  if (error || !flota) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500">Cargando unidades...</p>`;
    return;
  }

  container.innerHTML = "";
  flota.forEach((u) => {
    container.innerHTML += `
            <div class="bg-white p-6 rounded-xl shadow-md border-b-4 border-sr-black">
                <span class="text-xs font-bold text-sr-blue uppercase tracking-wider">${u.dominio}</span>
                <h4 class="text-xl font-bold mb-1">${u.marca_modelo} (${u.anio})</h4>
                <p class="text-sm text-gray-600 mb-3 font-semibold">Capacidad: ${u.asientos} Asientos</p>
                <p class="text-xs text-gray-500 mb-4">${u.descripcion || ""}</p>
                <div class="bg-gray-50 p-2.5 rounded text-[11px] space-y-1 text-gray-600 font-medium">
                    <div>📅 Vto Seguro: ${u.vto_seguro}</div>
                    <div>🛠️ Vto RTO: ${u.vto_rto}</div>
                </div>
            </div>`;
  });
}

async function cargarViajes() {
  const container = document.getElementById("viajes-container");
  const adminList = document.getElementById("admin-viajes-list");
  
  const { data: viajes, error } = await supabase
    .from("viajes")
    .select("*")
    .order("fecha", { ascending: true });

  if (error || !viajes) return;

  if (container) container.innerHTML = "";
  if (adminList) adminList.innerHTML = "";

  viajes.forEach((v) => {
    let colorEstado = "bg-green-500";
    if (v.estado === "Últimos Cupos") colorEstado = "bg-sr-rust";
    if (v.estado === "Agotado") colorEstado = "bg-gray-600";

    if (container) {
        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden viaje-card border border-gray-100">
                <div class="h-48 bg-gray-200 relative">
                    <img src="${v.url_imagen || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"}" class="w-full h-full object-cover">
                    <span class="absolute top-3 right-3 ${colorEstado} text-white text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider">${v.estado}</span>
                    <span class="absolute bottom-3 left-3 bg-sr-black text-sr-blue text-xs px-2.5 py-1 rounded font-bold">${v.tipo}</span>
                </div>
                <div class="p-6">
                    <h4 class="text-xl font-black mb-2">${v.titulo}</h4>
                    <div class="text-sm text-gray-600 space-y-1 font-medium mb-4">
                        <div>📍 Destino: <span class="text-sr-black">${v.destino}</span></div>
                        <div>📅 Fecha: ${v.fecha}</div>
                    </div>
                    <div class="flex justify-between items-center border-t pt-4">
                        <span class="text-2xl font-black text-sr-rust">$${v.precio.toLocaleString()}</span>
                        <a href="#presupuesto" class="bg-sr-blue text-sr-black px-4 py-2 rounded text-xs font-black uppercase tracking-wider hover:bg-sr-black hover:text-white transition">Me interesa</a>
                    </div>
                </div>
            </div>`;
    }

    if (adminList) {
        adminList.innerHTML += `
            <div class="p-2 bg-white rounded border flex justify-between items-center text-xs shadow-sm">
                <div>
                    <p class="font-bold text-gray-800">${v.titulo}</p>
                    <p class="text-[10px] text-gray-500">Estado actual: <strong>${v.estado}</strong></p>
                </div>
                <div class="flex items-center gap-2">
                    <select onchange="cambiarEstadoViaje('${v.id}', this.value)" class="p-1 border rounded text-[11px] bg-gray-100">
                        <option value="">Cambiar Estado</option>
                        <option value="Disponible">Disponible</option>
                        <option value="Últimos Cupos">Últimos Cupos</option>
                        <option value="Agotado">Agotado</option>
                    </select>
                    <button onclick="eliminarViaje('${v.id}', true)" class="text-red-600 font-bold hover:underline px-1">🗑️</button>
                </div>
            </div>`;
    }
  });
}

async function guardarPresupuesto(e) {
  e.preventDefault();
  const distElement = document.getElementById("distancia-display");
  const distancia = distElement ? (distElement.dataset.value || 0) : 0;

  const payload = {
    tipo_persona: document.getElementById("tipo_persona").value,
    nombre: document.getElementById("pres_nombre").value,
    empresa_institucion: document.getElementById("pres_empresa").value || null,
    email: document.getElementById("pres_email").value,
    celular: document.getElementById("pres_celular").value,
    fecha_salida: document.getElementById("fecha_salida").value,
    fecha_regreso: document.getElementById("fecha_regreso").value,
    pasajeros: parseInt(document.getElementById("cant_pasajeros").value),
    equipaje: document.getElementById("tipo_equipaje").value,
    origen: document.getElementById("search-origen").value,
    destino: document.getElementById("search-destino").value,
    itinerario_detalles: document.getElementById("itinerario_desc").value,
    distancia_estimada_km: parseFloat(distancia),
  };

  const { error } = await supabase.from("presupuestos").insert([payload]);
  if (error) {
    alert("Ocurrió un error al procesar tu presupuesto.");
    return;
  }

  enviarAlertasExternas(payload);
  alert("¡Solicitud enviada correctamente!");
  document.getElementById("form-presupuesto").reset();
  await cargarPresupuestosAdmin();
}

function enviarAlertasExternas(p) {
  const msj = `NUEVA SOLICITUD SIN RUMBOS:\nCliente: ${p.nombre}\nDesde: ${p.origen}\nHasta: ${p.destino}\nPasajeros: ${p.pasajeros}\nDistancia: ${p.distancia_estimada_km} km.`;
  const waUrl = `https://wa.me/5493467440572?text=${encodeURIComponent(msj)}`;
  window.open(waUrl, "_blank");
}

async function cargarPresupuestosAdmin() {
  const table = document.getElementById("admin-presupuestos-list");
  if (!table) return;

  const { data: pres, error } = await supabase
    .from("presupuestos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !pres) return;
  table.innerHTML = "";
  pres.forEach((p) => {
    table.innerHTML += `
            <tr class="border-b bg-white hover:bg-gray-50">
                <td class="p-2 font-bold">${p.nombre}<br><span class="text-[10px] text-gray-500">${p.tipo_persona}</span></td>
                <td class="p-2">${p.celular}<br>${p.email}</td>
                <td class="p-2 font-medium">${p.origen} ➡️ <br>${p.destino} (${p.distancia_estimada_km} km)</td>
                <td class="p-2 text-gray-600">S: ${p.fecha_salida}<br>R: ${p.fecha_regreso}</td>
                <td class="p-2 font-bold text-center text-sr-blue">${p.pasajeros}</td>
            </tr>`;
  });
}

async function crearNuevoViaje(e) {
  e.preventDefault();
  let urlImagen = null;
  const fileInput = document.getElementById("adm-imagen");

  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error: uploadError } = await supabase.storage
      .from("imagenes-viajes")
      .upload(fileName, file);
    if (!uploadError && data) {
      urlImagen = supabase.storage.from("imagenes-viajes").getPublicUrl(fileName).data.publicUrl;
    }
  }

  const payload = {
    titulo: document.getElementById("adm-titulo").value,
    tipo: document.getElementById("adm-tipo").value,
    destino: document.getElementById("adm-destino").value,
    fecha: document.getElementById("adm-fecha").value,
    precio: parseFloat(document.getElementById("adm-precio").value),
    estado: document.getElementById("adm-estado").value,
    url_imagen: urlImagen,
  };

  await supabase.from("viajes").insert([payload]);
  document.getElementById("form-admin-viaje").reset();
  await cargarViajes();
}

async function cambiarEstadoViaje(id, nuevoEstado) {
  if (!nuevoEstado) return;
  await supabase.from("viajes").update({ estado: nuevoEstado }).eq("id", id);
  await cargarViajes();
}

async function eliminarViaje(id, completo) {
  if (confirm(completo ? "¿Eliminar este viaje permanentemente?" : "¿Limpiar registro?")) {
    await supabase.from("viajes").delete().eq("id", id);
    await cargarViajes();
  }
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}