// REEMPLAZAR CON TUS CREDENCIALES PÚBLICAS DE SUPABASE
const SUPABASE_URL = "https://zqjfluacxbuufbtkekix.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxamZsdWFjeGJ1dWZidGtla2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MzI4MDcsImV4cCI6MjA5ODAwODgwN30.42QArep0cojhmiiOxLYSXkuwz8VKN6FGytSDA4nbxX4";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let map, markerOrigen, markerDestino, routeLine;
let coordsOrigen = null, coordsDestino = null;
let n1 = Math.floor(Math.random() * 10) + 1;
let n2 = Math.floor(Math.random() * 10) + 1;

document.addEventListener("DOMContentLoaded", () => {
  iniciarReloj();
  obtenerCotizacionesFinancieras();
  setInterval(obtenerCotizacionesFinancieras, 60000); // Actualizar cada minuto
  initCaptcha();
  initMapLeaflet(); // CORREGIDO: Llamada al nombre de función correcto
  cargarFlota();
  cargarViajes();
  setupListeners();
});

/**
 * Módulo de Reloj Digital de Precisión Local
 */
function actualizarReloj() {
    const contenedorReloj = document.getElementById("reloj");
    if (!contenedorReloj) return;

    const ahora = new Date();
    
    // Obtiene las partes de la hora local del sistema de forma limpia
    const opciones = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    // Formatea según el estándar local (ej: "15:45:12")
    contenedorReloj.textContent = ahora.toLocaleTimeString('es-AR', opciones);
}

// Asegúrate de que se ejecute cada segundo y al cargar la página
setInterval(actualizarReloj, 1000);
actualizarReloj();

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

// Captcha Básico
function initCaptcha() {
  document.getElementById("captcha-num1").innerText = n1;
  document.getElementById("captcha-num2").innerText = n2;
}

// Inicialización de Mapa Abierto Leaflet
function initMapLeaflet() {
 const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  mapContainer.style.height = "350px";
  mapContainer.style.width = "100%";
 
  // Coordenadas base en Provincia de Córdoba (-31.42, -64.18)
  map = L.map("map").setView([-31.4201, -64.1888], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 500);

  // Inicializa el autocompletado predictivo conectado al mapa
  initSearchPredictivo();
}

// Vinculación real de los inputs con el mapa mediante autocompletado dinámico
function initSearchPredictivo() {
  // Nota: Asegúrate de que los contenedores 'res-origen' y 'res-destino' existan abajo de tus inputs en el HTML
  setupAutocompletar('origen', 'res-origen', (coords, name) => {
    coordsOrigen = coords;
    if (markerOrigen) map.removeLayer(markerOrigen);
    markerOrigen = L.marker(coords).addTo(map).bindPopup("<b>Origen:</b><br>" + name).openPopup();
    actualizarRutaYDistancia();
  });

  setupAutocompletar('destino', 'res-destino', (coords, name) => {
    coordsDestino = coords;
    if (markerDestino) map.removeLayer(markerDestino);
    markerDestino = L.marker(coords).addTo(map).bindPopup("<b>Destino:</b><br>" + name).openPopup();
    actualizarRutaYDistancia();
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
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Argentina")}&limit=5`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "SinRumbosTurismoApp/1.0",
          },
        });
        const data = await res.ok ? await res.json() : [];

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

function actualizarRutaYDistancia() {
  if (!coordsOrigen || !coordsDestino) return;

  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline([coordsOrigen, coordsDestino], {
    color: "#00AEEF",
    weight: 4,
  }).addTo(map);
  map.fitBounds(routeLine.getBounds());

  // Cálculo de Distancia Matemática de Haversine x factor de corrección de ruta terrestre (1.28)
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
  const distanciaKms = Math.round(R * c * 1.28);

  const display = document.getElementById("info-distancia");
  const kmsLabel = document.getElementById("kms-label");
  if (display && kmsLabel) {
    display.classList.remove("hidden");
    kmsLabel.innerText = distanciaKms;
  }
}

// Escuchas de eventos reactivos
function setupListeners() {
  const tipoCliente = document.getElementById("tipo_cliente");
  if(tipoCliente) {
    tipoCliente.addEventListener("change", (e) => {
      const corporativo = document.getElementById("campos-corporativos");
      if (corporativo) {
        if (e.target.value === "empresa" || e.target.value === "institucion") {
          corporativo.classList.remove("hidden");
        } else {
          corporativo.classList.add("hidden");
        }
      }
    });
  }

  // Detectores de cambios para sugerir flota
  ["entre_3_18", "mayores_18"].forEach((id) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", recalcularSugerenciaFlota);
  });

  // Envío del Formulario de Presupuesto
  const formPresupuesto = document.getElementById("form-presupuesto");
  if (formPresupuesto) formPresupuesto.addEventListener("submit", handlePresupuestoSubmit);
}

function recalcularSugerenciaFlota() {
  const entre3_18 = parseInt(document.getElementById("entre_3_18").value) || 0;
  const mayores18 = parseInt(document.getElementById("mayores_18").value) || 0;
  const totalAsientosRequeridos = entre3_18 + mayores18;

  const box = document.getElementById("box-sugerencia");
  if (!box) return;
  
  if (totalAsientosRequeridos === 0) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");

  if (totalAsientosRequeridos <= 19) {
    box.className = "p-4 rounded-xl border font-medium text-sm bg-green-50 border-green-200 text-green-700";
    box.innerText = `Sugerencia de Flota: Se recomienda unidad Minibús Ejecutiva (Capacidad hasta 19 asientos).`;
  } else if (totalAsientosRequeridos <= 45) {
    box.className = "p-4 rounded-xl border font-medium text-sm bg-green-50 border-green-200 text-green-700";
    box.innerText = `Sugerencia de Flota: Se recomienda unidad de Larga Distancia Standard (Capacidad hasta 45 asientos).`;
  } else if (totalAsientosRequeridos <= 58) {
    box.className = "p-4 rounded-xl border font-medium text-sm bg-green-50 border-green-200 text-green-700";
    box.innerText = `Sugerencia de Flota: Se recomienda unidad Mix/Cama de Doble Piso (Capacidad hasta 60 asientos).`;
  } else {
    box.className = "p-4 rounded-xl border font-medium text-sm bg-amber-50 border-amber-200 text-amber-700";
    box.innerText = `Aviso de Capacidad: El contingente (${totalAsientosRequeridos} pasajeros) supera la capacidad máxima de nuestras unidades individuales. Se coordinarán múltiples unidades de nuestra flota o el refuerzo homologado mediante terceros contratados bajo supervisión de CNRT.`;
  }
}

async function cargarFlota() {
  const { data, error } = await supabase.from("flota").select("*");
  if (!error && data) {
    const container = document.getElementById("grid-flota");
    if(!container) return;
    container.innerHTML = data
      .map((u) => `
            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div class="text-brandAzul text-3xl mb-3"><i class="fa-solid fa-bus"></i></div>
                <h3 class="text-xl font-bold text-gray-800">${u.marca_modelo}</h3>
                <p class="text-sm text-gray-500 mt-1">${u.descripcion || "Unidad de turismo ejecutiva equipada."}</p>
                <div class="mt-4 pt-4 border-t text-xs font-semibold text-gray-600 flex justify-between">
                    <span><i class="fa-solid fa-chair mr-1"></i> ${u.asientos} Asientos</span>
                    <span class="text-green-600"><i class="fa-solid fa-shield-check mr-1"></i> RTO e Inscripto</span>
                </div>
            </div>
        `)
      .join("");
  }
}

async function cargarViajes() {
  const { data, error } = await supabase
    .from("viajes_paquetes")
    .select("*")
    .order("fecha_salida", { ascending: true });
    
  if (!error && data) {
    const gridViajes = document.getElementById("grid-viajes");
    const gridGaleria = document.getElementById("grid-galeria");

    if (gridViajes) {
        gridViajes.innerHTML = data.map((v) => {
            let badgeColor = "bg-green-100 text-green-800";
            if (v.estado === "ultimos_cupos") badgeColor = "bg-amber-100 text-amber-800";
            if (v.estado === "agotado") badgeColor = "bg-red-100 text-red-800";
    
            const textoWhatsApp = encodeURIComponent(
              v.mensaje_whatsapp || `Hola Sin Rumbos! Me interesa el viaje a ${v.destino} del ${new Date(v.fecha_salida).toLocaleDateString()}`
            );
            const imgFallback = v.imagen_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";
    
            return `
                <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col">
                    <img src="${imgFallback}" alt="${v.titulo}" class="w-full h-48 object-cover">
                    <div class="p-5 flex-1 flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="px-2 py-1 rounded text-xs font-bold uppercase ${badgeColor}">${v.estado.replace("_", " ")}</span>
                                <span class="text-sm font-semibold text-gray-500"><i class="fa-solid fa-calendar mr-1"></i> ${new Date(v.fecha_salida).toLocaleDateString()}</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">${v.titulo}</h3>
                            <p class="text-sm text-gray-600 mt-2 line-clamp-3">${v.descripcion || ""}</p>
                        </div>
                        <div class="mt-4 pt-4 border-t flex justify-between items-center">
                            <span class="text-2xl font-black text-brandAzul">$${parseFloat(v.precio).toLocaleString("es-AR")}</span>
                            <a href="https://wa.me/5493467440572?text=${textoWhatsApp}" target="_blank" class="bg-brandCalido text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brandCalidoHover transition">
                                Consultar <i class="fa-brands fa-whatsapp ml-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
          }).join("");
    }

    if (gridGaleria) {
        gridGaleria.innerHTML = data
          .filter((v) => v.imagen_url)
          .slice(0, 8)
          .map((v) => `
                <div class="overflow-hidden rounded-lg aspect-square bg-gray-800 group relative">
                    <img src="${v.imagen_url}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                        <span class="text-xs font-semibold text-white">${v.destino}</span>
                    </div>
                </div>
            `)
          .join("");
    }
  }
}

async function handlePresupuestoSubmit(e) {
  e.preventDefault();

  const captchaAns = parseInt(document.getElementById("captcha_ans").value);
  if (captchaAns !== n1 + n2) {
    alert("El código de validación antispam es incorrecto. Intentá nuevamente.");
    return;
  }

  const totalAsientos =
    (parseInt(document.getElementById("entre_3_18").value) || 0) +
    (parseInt(document.getElementById("mayores_18").value) || 0);
  let vSugerido = "Minibús (Hasta 19p)";
  if (totalAsientos > 19 && totalAsientos <= 45) vSugerido = "Larga Distancia Standard (Hasta 45p)";
  if (totalAsientos > 45) vSugerido = "Coche de Gran Capacidad / Múltiples Unidades";

  const payload = {
    tipo_cliente: document.getElementById("tipo_cliente").value,
    nombre_apellido: document.getElementById("nombre_apellido").value,
    celular: document.getElementById("celular").value,
    razon_social: document.getElementById("razon_social")?.value || null,
    cargo: document.getElementById("cargo")?.value || null,
    origen: document.getElementById("origen").value,
    destino: document.getElementById("destino").value,
    fecha_salida: new Date(document.getElementById("fecha_salida").value).toISOString(),
    fecha_regreso: new Date(document.getElementById("fecha_regreso").value).toISOString(),
    menores_3: parseInt(document.getElementById("menores_3").value) || 0,
    entre_3_18: parseInt(document.getElementById("entre_3_18").value) || 0,
    mayores_18: parseInt(document.getElementById("mayores_18").value) || 0,
    lleva_equipaje: document.getElementById("lleva_equipaje").checked,
    vehiculo_sugerido: vSugerido,
    detalles: document.getElementById("detalles").value,
  };

  const { error } = await supabase.from("presupuestos").insert([payload]);

  if (error) {
    alert("Hubo un inconveniente al procesar tu solicitud: " + error.message);
  } else {
    alert("¡Presupuesto enviado con éxito al departamento de logística!");
    const wsMsg = encodeURIComponent(
      `Hola Sin Rumbos, envié un presupuesto web para un viaje de ${payload.origen} hacia ${payload.destino}. Nombre: ${payload.nombre_apellido}.`
    );
    window.open(`https://wa.me/5493467440572?text=${wsMsg}`, "_blank");
    document.getElementById("form-presupuesto").reset();
    initCaptcha();
  }
}

// Función auxiliar Debounce para optimizar llamadas AJAX
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}