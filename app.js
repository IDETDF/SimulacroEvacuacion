// =========================================================================
// REGISTRO DE SERVICE WORKER E INSTALACIÓN PWA
// =========================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.update();
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
          window.location.reload();
        }
      });
    });
  }));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

let deferredPrompt = null;
const btnInstall = document.getElementById('btn-install');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.style.display = 'block';
});

btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
  btnInstall.style.display = 'none';
});

// =========================================================================
// CONTROLES DE INTERFAZ Y PANELES DESPLEGABLES
// =========================================================================
let map = null;
const alertBox = document.getElementById('alert-box');
const gpsStatus = document.getElementById('gps-status');

function toggleLayerList() {
  const list = document.getElementById('layer-list');
  const chev = document.getElementById('chevron');
  const isClosed = list.style.display === 'none';
  list.style.display = isClosed ? 'flex' : 'none';
  chev.innerText = isClosed ? '▼' : '▲';

  if (isClosed && window.innerWidth <= 768) {
    document.getElementById('draw-body').style.display = 'none';
    document.getElementById('draw-chevron').innerText = '▲';
  }
}

function toggleDrawPanel() {
  const body = document.getElementById('draw-body');
  const chev = document.getElementById('draw-chevron');
  const isOpen = body.style.display === 'flex';
  body.style.display = isOpen ? 'none' : 'flex';
  chev.innerText = isOpen ? '▲' : '▼';

  if (!isOpen && window.innerWidth <= 768) {
    document.getElementById('layer-list').style.display = 'none';
    document.getElementById('chevron').innerText = '▲';
  }
}

if (window.innerWidth <= 768) {
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('layer-list').style.display = 'none';
    document.getElementById('chevron').innerText = '▲';
  });
}

function toggleLayers(layerIds, visible) {
  if (!map) return;
  layerIds.forEach(id => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }
  });
}

function toggleGroup(masterCheckbox, layerIds, subClass) {
  const visible = masterCheckbox.checked;
  document.querySelectorAll('.' + subClass).forEach(cb => {
    cb.checked = visible;
  });
  toggleLayers(layerIds, visible);
}

// =========================================================================
// SANITIZADOR CONTEXTUAL Y GENERADOR DE POPUPS POR ENTIDAD
// =========================================================================
function limpiarTexto(txt) {
  if (txt === null || txt === undefined) return '';
  let s = String(txt).trim();
  if (!s || s === 'null' || s === 'None' || s === '-') return '';

  return s
    // 1. Correcciones de secuencias UTF-8 mal interpretadas como Latin-1
    .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú')
    .replace(/Ã\x81/g, 'Á').replace(/Ã\x89/g, 'É').replace(/Ã\x8d/g, 'Í').replace(/Ã\x93/g, 'Ó').replace(/Ã\x9a/g, 'Ú')
    .replace(/Ã±/g, 'ñ').replace(/Ã‘/g, 'Ñ').replace(/Ã¼/g, 'ü')
    .replace(/Â°/g, '°').replace(/Âº/g, 'º')
    // 2. Correcciones contextuales exactas para caracteres de reemplazo (\ufffd)
    .replace(/Karukink\ufffd/gi, 'Karukinká')
    .replace(/T\ufffdcnico/gi, 'Técnico')
    .replace(/T\ufffdcnica/gi, 'Técnica')
    .replace(/M\ufffddico/gi, 'Médico')
    .replace(/M\ufffddica/gi, 'Médica')
    .replace(/Cl\ufffdnica/gi, 'Clínica')
    .replace(/Pol\ufffdticos/gi, 'Políticos')
    .replace(/Tecnolog\ufffda/gi, 'Tecnología')
    .replace(/Asesor\ufffda/gi, 'Asesoría')
    .replace(/Secretar\ufffda/gi, 'Secretaría')
    .replace(/Comisar\ufffda/gi, 'Comisaría')
    .replace(/Bah\ufffda/gi, 'Bahía')
    .replace(/R\ufffdO/g, 'RÍO').replace(/R\ufffdo/g, 'Río')
    .replace(/Mart\ufffdn/gi, 'Martín')
    .replace(/Mart\ufffd/gi, 'Martí')
    .replace(/Jos\ufffd/gi, 'José')
    .replace(/Monse\ufffdor/gi, 'Monseñor')
    .replace(/ Per\ufffdn/gi, ' Perón')
    .replace(/Com\ufffdn/gi, 'Común')
    .replace(/Jard\ufffdn/gi, 'Jardín')
    .replace(/Albergue/gi, 'Albergue')
    .replace(/Rehabilitaci\ufffdn/gi, 'Rehabilitación')
    .replace(/Educaci\ufffdn/gi, 'Educación')
    .replace(/Atenci\ufffdn/gi, 'Atención')
    .replace(/Protecci\ufffdn/gi, 'Protección')
    .replace(/Estaci\ufffdn/gi, 'Estación')
    .replace(/Jurisdicci\ufffdn/gi, 'Jurisdicción')
    .replace(/Validaci\ufffdn/gi, 'Validación')
    .replace(/Dirección/gi, 'Dirección').replace(/Direcci\ufffdn/gi, 'Dirección')
    .replace(/P\ufffdblica/gi, 'Pública').replace(/P\ufffdblico/gi, 'Público')
    .replace(/Ant\ufffdrtida/gi, 'Antártida')
    .replace(/Atl\ufffdntico/gi, 'Atlántico')
    .replace(/H\ufffddricos/gi, 'Hídricos')
    .replace(/Electr\ufffdgeno/gi, 'Electrógeno')
    .replace(/Play\ufffdn/gi, 'Playón')
    .replace(/ d\ufffda/gi, ' día')
    .replace(/N\ufffd/g, 'N°')
    .replace(/B\ufffd/g, 'B°')
    .replace(/^S\ufffd$/g, 'Sí')
    .replace(/NOEM\ufffd/g, 'NOEMÍ')
    // Sufijos habituales en español si quedara algún \ufffd aislado
    .replace(/ci\ufffdn\b/gi, 'ción')
    .replace(/si\ufffdn\b/gi, 'sión')
    .replace(/\ufffd/g, '')
    .replace(/\\n/g, '<br>')
    .replace(/\n/g, '<br>');
}

function generarPopupHTML(layerId, props) {
  let icono = '📍';
  let badgeTipo = 'Información';
  let badgeColor = '#475569';
  let titulo = '';
  let detalles = [];

  // 1. Centros Públicos de Salud
  if (layerId === 'salud-publica-puntos') {
    icono = '🏥';
    badgeTipo = props.tipo ? `Salud Pública · ${props.tipo}` : (props.gna || 'Salud Pública');
    badgeColor = '#dc2626';
    titulo = props.fna || props.nam || 'Centro de Salud';
    if (props.direccion) detalles.push({ label: 'Dirección', val: props.direccion });
    if (props.horario) detalles.push({ label: 'Horario', val: props.horario });
    if (props.mail) detalles.push({ label: 'Correo', val: props.mail });
    if (props.caa) detalles.push({ label: 'Dependencia', val: props.caa });
  }
  // 2. Centros Privados de Salud
  else if (layerId === 'salud-privada-puntos') {
    icono = '🩺';
    badgeTipo = 'Salud Privada';
    badgeColor = '#ef4444';
    titulo = props.Nombre || props.nombre || props.etiqueta || 'Centro Médico Privado';
    if (props.etiqueta && props.etiqueta !== titulo) {
      detalles.push({ label: 'Referencia', val: props.etiqueta });
    }
  }
  // 3. Cuartel de Bomberos
  else if (layerId === 'bomberos-puntos') {
    icono = '🚒';
    badgeTipo = props.gna || 'Bomberos Voluntarios';
    badgeColor = '#ea580c';
    titulo = props.fna || props.nam || 'Cuartel de Bomberos';
    if (props.etiqueta) detalles.push({ label: 'Sede', val: props.etiqueta });
  }
  // 4. Edificio de Seguridad
  else if (layerId === 'seguridad-puntos') {
    icono = '🛡️';
    badgeTipo = props.tes || props.gna || 'Seguridad';
    badgeColor = '#2563eb';
    titulo = props.fna || props.nam || 'Edificio de Seguridad';
    if (props.gna && props.gna !== badgeTipo) detalles.push({ label: 'Tipo', val: props.gna });
  }
  // 5. Puntos de Encuentro (Defensa Civil, Helipuertos y Escuelas)
  else if (layerId.startsWith('puntos-reunion-')) {
    const esHeli = layerId === 'puntos-reunion-heli' || props.estado === 'Helipuerto';
    const esEscuela = layerId === 'puntos-reunion-escuelas';
    icono = esHeli ? '🚁' : '🟢';
    badgeColor = '#16a34a';

    if (esEscuela) {
      badgeTipo = 'Punto de Encuentro · Escuela';
    } else if (esHeli) {
      badgeTipo = 'Punto de Encuentro · Helipuerto';
    } else {
      badgeTipo = `Punto de Encuentro (${props.estado || 'Defensa Civil'})`;
    }

    titulo = props.fna || props.nam || props.Name || 'Punto de Encuentro';
    if (props.descripcio) detalles.push({ label: 'Ubicación', val: props.descripcio });
  }
  // 6. Posibles Centros de Comando
  else if (layerId === 'comando-puntos') {
    icono = '⭐';
    badgeTipo = 'Puesto de Comando';
    badgeColor = '#b91c1c';
    titulo = props.etiqueta || props.nombre || props.nam || 'Centro de Comando Operativo';
  }
  // 7. Población Vulnerable
  else if (layerId.startsWith('vuln-')) {
    icono = '🤝';
    badgeTipo = props.tipo || 'Población Vulnerable';
    badgeColor = '#d97706';
    titulo = props.nombre || props.etiqueta || props.tipo || 'Institución Asistencial';
    if (props.etiqueta && props.etiqueta !== titulo) {
      detalles.push({ label: 'Sigla', val: props.etiqueta });
    }
  }
  // 8. Instituciones Educativas (Capa general)
  else if (layerId === 'escuelas-prim-sec' || layerId === 'escuelas-jardin') {
    icono = '🏫';
    badgeTipo = props.modalidad || props.gna || 'Institución Educativa';
    badgeColor = '#0284c7';
    titulo = props.fna || props.nam || 'Establecimiento Educativo';
    if (props.domicilio) detalles.push({ label: 'Domicilio', val: props.domicilio });
    if (props.telefono) detalles.push({ label: 'Teléfono', val: props.telefono });
    if (props.email) detalles.push({ label: 'Correo', val: props.email });
    if (props.responsabl) detalles.push({ label: 'Responsable', val: props.responsabl });
    if (props.sector || props.ambito) {
      detalles.push({ label: 'Gestión', val: [props.sector, props.ambito].filter(Boolean).join(' · ') });
    }
  }
  // 9. Matrícula Escolar (Puntos individuales)
  else if (layerId === 'matricula-puntos' || layerId === 'matricula-puntos-label') {
    icono = '🎒';
    badgeTipo = 'Flujo de Alumnos';
    badgeColor = '#f95716';
    titulo = props.nombre || 'Establecimiento Educativo';
    if (props.alumnos !== undefined && props.alumnos !== null) {
      detalles.push({
        label: 'Matrícula estimada',
        val: `<strong>${Number(props.alumnos).toLocaleString('es-AR')} alumnos</strong>`
      });
    }
  }
  // 10. Puntos de Ciencia y Educación
  else if (layerId === 'ciencia-puntos') {
    icono = '🎓';
    badgeTipo = props.gna || 'Ciencia y Educación';
    badgeColor = '#4f46e5';
    titulo = props.fna || props.nam || 'Centro Académico / Científico';
    if (props.siglas) detalles.push({ label: 'Sigla', val: props.siglas });
    if (props.fdc) detalles.push({ label: 'Fuente', val: props.fdc });
  }
  // 11. Instalaciones Deportivas
  else if (layerId === 'deportes-puntos') {
    icono = '⚽';
    badgeTipo = props.gna || 'Instalación Deportiva';
    badgeColor = '#0d9488';
    titulo = props.fna || props.nam || 'Espacio Deportivo';
  }
  // 12. Poder Legislativo
  else if (layerId === 'legislativo-puntos') {
    icono = '🏛️';
    badgeTipo = 'Poder Legislativo';
    badgeColor = '#64748b';
    titulo = props.gna || props.fna || 'Edificio Legislativo';
    const dir = [props.adr, props.adn].filter(Boolean).join(' ');
    if (dir) detalles.push({ label: 'Dirección', val: dir });
  }
  // 13. Puentes
  else if (layerId === 'puentes-vial' || layerId === 'puentes-peatonal') {
    icono = '🌉';
    badgeTipo = 'Infraestructura Vial';
    badgeColor = '#ca8a04';
    titulo = props.tipo === 'Peatonal' ? 'Puente Peatonal' : 'Puente Vehicular';
  }
  // 14. Estación de Servicios
  else if (layerId === 'combustible-puntos') {
    icono = '⛽';
    badgeTipo = props.tipo || 'Combustible';
    badgeColor = '#ca8a04';
    titulo = props.etiqueta ? `Estación de Servicio ${props.etiqueta}` : (props.nombre || 'Estación de Servicio');
  }
  // 15. Planta Potabilizadora
  else if (layerId === 'potabilizadora-puntos') {
    icono = '💧';
    badgeTipo = props.tipo ? `Infraestructura · ${props.tipo}` : 'Servicio de Agua';
    badgeColor = '#0284c7';
    titulo = props.nombre || 'Planta Potabilizadora / Bombeo';
  }
  // 16. Antenas
  else if (layerId === 'antenas-puntos') {
    icono = '📡';
    badgeTipo = 'Telecomunicaciones';
    badgeColor = '#475569';
    titulo = props.sir ? `Antena Red ${props.sir}` : 'Antena de Comunicación';
    if (props.bda) detalles.push({ label: 'Banda', val: props.bda });
    if (props.msl) detalles.push({ label: 'Altura s.n.m.', val: `${props.msl} m` });
    if (props.egl) detalles.push({ label: 'Altura estructura', val: `${props.egl} m` });
  }
  // 17. Grupo Electrógeno
  else if (layerId === 'electrogeno-puntos') {
    icono = '⚡';
    badgeTipo = props.tipo || 'Energía de Respaldo';
    badgeColor = '#dc2626';
    titulo = props.nombre || props.etiqueta || 'Grupo Electrógeno';
  }
  // 18. Vías de Evacuación
  else if (layerId.startsWith('vias-evacuacion')) {
    icono = '↗️';
    badgeTipo = 'Ruta de Escape';
    badgeColor = '#1a23de';
    titulo = props.NOMBRE ? `Vía de Evacuación: ${props.NOMBRE}` : 'Vía de Evacuación Oficial';
  }
  // 19. Escaleras
  else if (layerId === 'lyr-escaleras' || layerId === 'escaleras-borde') {
    icono = '🪜';
    badgeTipo = 'Conexión Peatonal';
    badgeColor = '#1a23de';
    titulo = 'Escalera de Evacuación';
  }
  // 20. Corrientes y Espejos de Agua
  else if (layerId.startsWith('arroyos-') || layerId.startsWith('espejos-agua')) {
    icono = '🌊';
    badgeTipo = props.objeto || props.gna || 'Hidrografía';
    badgeColor = '#0284c7';
    titulo = props.fna || props.ETQ || props.nam || 'Cuerpo de Agua';
    if (props.cu1) detalles.push({ label: 'Cuenca', val: props.cu1 });
  }
  // Fallback
  else {
    titulo = props.fna || props.nam || props.nombre || props.Nombre || props.Name || props.etiqueta || 'Punto Operativo';
  }

  let html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; min-width: 195px; max-width: 265px; line-height: 1.4;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 6px;">
        <span style="background: ${badgeColor}; color: #ffffff; padding: 2px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">
          ${icono} ${limpiarTexto(badgeTipo)}
        </span>
      </div>
      <div style="font-size: 14px; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">
        ${limpiarTexto(titulo)}
      </div>
  `;

  if (detalles.length > 0) {
    html += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; flex-direction: column; gap: 4px;">`;
    detalles.forEach(d => {
      const valLimpio = limpiarTexto(d.val);
      if (valLimpio) {
        html += `
          <div style="font-size: 11.5px; color: #cbd5e1;">
            <span style="color: #94a3b8; font-weight: 600;">${d.label}:</span> ${valLimpio}
          </div>
        `;
      }
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// =========================================================================
// INICIALIZACIÓN DE MAPLIBRE Y CAPAS
// =========================================================================
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const ushuaiaBounds = [
  [-68.3800, -54.8550],
  [-68.2400, -54.7700]
];

map = new maplibregl.Map({
  container: 'map',
  center: [-68.3190, -54.8160],
  zoom: 12.8,
  minZoom: 11,
  maxZoom: 19,
  maxBounds: ushuaiaBounds,
  doubleClickZoom: false,
  style: {
    version: 8,
    glyphs: "./fonts/{fontstack}/{range}.pbf",
    sprite: "./sprite/sprite",
    sources: {
      "satelite_source": {
        type: "raster",
        url: "pmtiles://./fondo_satelital.pmtiles",
        tileSize: 256
      },
      "tsunami_vector": {
        type: "vector",
        url: "pmtiles://./capas_operativas.pmtiles"
      },
      "ruta_activa": {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      },
      "dibujos_usuario": {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      },
      "matricula_src": {
        type: "geojson",
        data: "./instituciones_matricula.geojson",
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 16,
        clusterProperties: {
          "alumnos_total": ["+", ["get", "alumnos"]]
        }
      },
      "matricula_calor_src": {
        type: "geojson",
        data: "./instituciones_matricula.geojson"
      }
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#383838" } },

      // Imagen Satelital (activa)
      {
        id: "lyr-satelite",
        source: "satelite_source",
        type: "raster",
        paint: {
          "raster-saturation": -1,
          "raster-contrast": 0.15,
          "raster-brightness-max": 0.95
        }
      },

      // Categorías de riesgo (inactivas)
      {
        id: "riesgo-alto",
        source: "tsunami_vector",
        "source-layer": "zonas_riesgogeojson",
        type: "fill",
        filter: ["==", ["get", "categoria"], "Alto"],
        layout: { "visibility": "none" },
        paint: {
          "fill-color": "rgb(255, 46, 34)",
          "fill-opacity": 0.48,
          "fill-outline-color": "rgb(35, 35, 35)"
        }
      },
      {
        id: "riesgo-medio",
        source: "tsunami_vector",
        "source-layer": "zonas_riesgogeojson",
        type: "fill",
        filter: ["==", ["get", "categoria"], "Medio"],
        layout: { "visibility": "none" },
        paint: {
          "fill-color": "rgb(255, 219, 0)",
          "fill-opacity": 0.48,
          "fill-outline-color": "rgb(35, 35, 35)"
        }
      },
      {
        id: "riesgo-bajo",
        source: "tsunami_vector",
        "source-layer": "zonas_riesgogeojson",
        type: "fill",
        filter: ["==", ["get", "categoria"], "Bajo"],
        layout: { "visibility": "none" },
        paint: {
          "fill-color": "rgb(104, 215, 20)",
          "fill-opacity": 0.48,
          "fill-outline-color": "rgb(35, 35, 35)"
        }
      },

      // Espejos de agua (inactivas)
      {
        id: "espejos-agua-fill",
        source: "tsunami_vector",
        "source-layer": "espejos_aguageojson",
        type: "fill",
        layout: { "visibility": "none" },
        paint: {
          "fill-color": "rgb(207, 229, 229)",
          "fill-opacity": 0.85,
          "fill-outline-color": "rgb(0, 146, 145)"
        }
      },
      {
        id: "lbl-hidro-lagunas",
        source: "tsunami_vector",
        "source-layer": "espejos_aguageojson",
        type: "symbol",
        layout: {
          "visibility": "none",
          "text-field": ["coalesce", ["get", "ETQ"], ["get", "nam"], ["get", "fna"], ""],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-max-width": 8
        },
        paint: {
          "text-color": "#0284c7",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.0
        }
      },

      // Arroyos y su etiqueta (inactivas)
      {
        id: "arroyos-borde",
        source: "tsunami_vector",
        "source-layer": "arroyosgeojson",
        type: "line",
        layout: { "visibility": "none" },
        paint: { "line-color": "rgb(35, 35, 35)", "line-width": 3.2 }
      },
      {
        id: "arroyos-lineas",
        source: "tsunami_vector",
        "source-layer": "arroyosgeojson",
        type: "line",
        layout: { "visibility": "none" },
        paint: { "line-color": "rgb(0, 178, 231)", "line-width": 2.2 }
      },
      {
        id: "lbl-hidro-rios",
        source: "tsunami_vector",
        "source-layer": "arroyosgeojson",
        type: "symbol",
        layout: {
          "visibility": "none",
          "symbol-placement": "line",
          "text-field": ["coalesce", ["get", "fna"], ["get", "nam"], ""],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-max-width": 8
        },
        paint: {
          "text-color": "#00e5ff",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.8
        }
      },

      // Calles (ACTIVAS POR DEFECTO)
      {
        id: "calles-borde",
        source: "tsunami_vector",
        "source-layer": "callesgeojson",
        type: "line",
        layout: { "visibility": "visible" },
        paint: {
          "line-color": "rgb(35, 35, 35)",
          "line-width": [
            "match", ["get", "gna"],
            "SIMULACRO", 5.0,
            "RUTA NACIONAL", 4.5,
            "RUTA PROVINCIAL", 4.5,
            "AVENIDA", 4.5,
            "SECUNDARIA", 3.6,
            "PASAJE", 1.2,
            "ESCALERA", 1.2,
            2.5
          ]
        }
      },
      {
        id: "calles-blanco",
        source: "tsunami_vector",
        "source-layer": "callesgeojson",
        type: "line",
        layout: { "visibility": "visible" },
        paint: {
          "line-color": [
            "match", ["get", "gna"],
            "SIMULACRO", "rgb(38, 38, 38)",
            "RUTA NACIONAL", "rgb(38, 38, 38)",
            "RUTA PROVINCIAL", "rgb(38, 38, 38)",
            "AVENIDA", "rgb(38, 38, 38)",
            "rgb(255, 255, 255)"
          ],
          "line-width": [
            "match", ["get", "gna"],
            "SIMULACRO", 3.2,
            "RUTA NACIONAL", 2.8,
            "RUTA PROVINCIAL", 2.8,
            "AVENIDA", 2.8,
            "SECUNDARIA", 2.4,
            "PASAJE", 0.6,
            "ESCALERA", 0.6,
            1.8
          ]
        }
      },

      // Zona de Evacuación (activa)
      {
        id: "zona-evacuacion-fill",
        source: "tsunami_vector",
        "source-layer": "poligono_simulacrogeojson",
        type: "fill",
        paint: {
          "fill-color": "rgba(230, 0, 0, 0.25)",
          "fill-outline-color": "rgb(3, 199, 52)"
        }
      },
      {
        id: "contorno-simulacro-negro",
        source: "tsunami_vector",
        "source-layer": "poligono_simulacrogeojson",
        type: "line",
        paint: { "line-color": "rgb(0, 0, 0)", "line-width": 6.0 }
      },
      {
        id: "contorno-simulacro-blanco",
        source: "tsunami_vector",
        "source-layer": "poligono_simulacrogeojson",
        type: "line",
        paint: { "line-color": "rgb(255, 255, 255)", "line-width": 3.2, "line-dasharray": [3, 2] }
      },
      {
        id: "contorno-simulacro-fino",
        source: "tsunami_vector",
        "source-layer": "poligono_simulacrogeojson",
        type: "line",
        paint: { "line-color": "rgb(35, 35, 35)", "line-width": 0.8 }
      },

      // Vías de evacuación (activa)
      {
        id: "vias-evacuacion-borde",
        source: "tsunami_vector",
        "source-layer": "vias_evacuaciongeojson",
        type: "line",
        paint: { "line-color": "rgb(169, 187, 255)", "line-width": 6.5 }
      },
      {
        id: "vias-evacuacion",
        source: "tsunami_vector",
        "source-layer": "vias_evacuaciongeojson",
        type: "line",
        paint: { "line-color": "rgb(26, 35, 222)", "line-width": 4.5 }
      },
      {
        id: "vias-evacuacion-flechas",
        source: "tsunami_vector",
        "source-layer": "vias_evacuaciongeojson",
        type: "symbol",
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 65,
          "icon-image": "flecha_azul",
          "icon-size": 0.65,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        }
      },

      // Escaleras (activa)
      {
        id: "escaleras-borde",
        source: "tsunami_vector",
        "source-layer": "escalerasgeojson",
        type: "line",
        paint: { "line-color": "rgb(255, 255, 255)", "line-width": 4.2 }
      },
      {
        id: "lyr-escaleras",
        source: "tsunami_vector",
        "source-layer": "escalerasgeojson",
        type: "line",
        paint: { "line-color": "rgb(26, 35, 222)", "line-width": 3.0, "line-dasharray": [1.5, 1.5] }
      },

      // Guía GPS dinámica
      {
        id: "guia-escape",
        source: "ruta_activa",
        type: "line",
        paint: { "line-color": "#38bdf8", "line-width": 4.5, "line-dasharray": [1.5, 1.5] }
      },

      // Infraestructura (inactivas)
      {
        id: "electrogeno-puntos",
        source: "tsunami_vector",
        "source-layer": "grupo_electrogenogeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "electrogeno", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "antenas-puntos",
        source: "tsunami_vector",
        "source-layer": "antenasgeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "antena", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "potabilizadora-puntos",
        source: "tsunami_vector",
        "source-layer": "planta_potabilizadorageojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "potabilizadora", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "combustible-puntos",
        source: "tsunami_vector",
        "source-layer": "estacion_serviciogeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "combustible", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },

      // Equipamientos e instituciones (inactivas)
      {
        id: "escuelas-prim-sec",
        source: "tsunami_vector",
        "source-layer": "instituciones_educativasgeojson",
        type: "symbol",
        filter: [
          "all",
          ["!=", ["get", "subtipo_edu"], "Jardin"],
          ["==", ["index-of", "Jard", ["coalesce", ["get", "gna"], ""]], -1],
          ["==", ["index-of", "Jard", ["coalesce", ["get", "fna"], ""]], -1],
          ["==", ["index-of", "Inicial", ["coalesce", ["get", "modalidad"], ""]], -1]
        ],
        layout: { "visibility": "none", "icon-image": "escuela", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "escuelas-jardin",
        source: "tsunami_vector",
        "source-layer": "instituciones_educativasgeojson",
        type: "symbol",
        filter: [
          "any",
          ["==", ["get", "subtipo_edu"], "Jardin"],
          [">=", ["index-of", "Jard", ["coalesce", ["get", "gna"], ""]], 0],
          [">=", ["index-of", "Jard", ["coalesce", ["get", "fna"], ""]], 0],
          [">=", ["index-of", "Inicial", ["coalesce", ["get", "modalidad"], ""]], 0]
        ],
        layout: { "visibility": "none", "icon-image": "jardin", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "ciencia-puntos",
        source: "tsunami_vector",
        "source-layer": "ciencia_educaciongeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "ciencia", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "lbl-ciencia",
        source: "tsunami_vector",
        "source-layer": "ciencia_educaciongeojson",
        type: "symbol",
        layout: {
          "visibility": "none",
          "text-field": ["coalesce", ["get", "siglas"], ["get", "fna"], ["get", "nam"], ""],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-max-width": 8,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-allow-overlap": false
        },
        paint: {
          "text-color": "#111827",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.2
        }
      },
      {
        id: "deportes-puntos",
        source: "tsunami_vector",
        "source-layer": "deportesgeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "deporte", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "legislativo-puntos",
        source: "tsunami_vector",
        "source-layer": "poder_legislativogeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "legislativo", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },

      // Población vulnerable (4 categorías incluyendo C.A.A.D)
      {
        id: "vuln-albergue",
        source: "tsunami_vector",
        "source-layer": "poblacion_vulnerablegeojson",
        type: "symbol",
        filter: ["==", ["get", "tipo"], "Albergue Municipal"],
        layout: { "visibility": "none", "icon-image": "vuln_albergue", "icon-size": 0.9, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "vuln-jubilados",
        source: "tsunami_vector",
        "source-layer": "poblacion_vulnerablegeojson",
        type: "symbol",
        filter: ["==", ["get", "tipo"], "Centro de jubilados"],
        layout: { "visibility": "none", "icon-image": "vuln_jubilados", "icon-size": 0.9, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "vuln-hogar",
        source: "tsunami_vector",
        "source-layer": "poblacion_vulnerablegeojson",
        type: "symbol",
        filter: ["==", ["get", "tipo"], "Hogar de día"],
        layout: { "visibility": "none", "icon-image": "vuln_hogar", "icon-size": 0.9, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "vuln-caad",
        source: "tsunami_vector",
        "source-layer": "poblacion_vulnerablegeojson",
        type: "symbol",
        filter: ["==", ["get", "tipo"], "C.A.A.D"],
        layout: { "visibility": "none", "icon-image": "vuln_caad", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },

      // Puentes (inactivas)
      {
        id: "puentes-vial",
        source: "tsunami_vector",
        "source-layer": "puentes_puntosgeojson",
        type: "symbol",
        filter: ["!=", ["get", "tipo"], "Peatonal"],
        layout: { "visibility": "none", "icon-image": "puente_vial", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "puentes-peatonal",
        source: "tsunami_vector",
        "source-layer": "puentes_puntosgeojson",
        type: "symbol",
        filter: ["==", ["get", "tipo"], "Peatonal"],
        layout: { "visibility": "none", "icon-image": "puente_peatonal", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },

      // Emergencias y Salud (activas)
      {
        id: "seguridad-puntos",
        source: "tsunami_vector",
        "source-layer": "seguridadgeojson",
        type: "symbol",
        layout: { "icon-image": "seguridad", "icon-size": 0.9, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "bomberos-puntos",
        source: "tsunami_vector",
        "source-layer": "bomberosgeojson",
        type: "symbol",
        layout: { "icon-image": "bomberos", "icon-size": 0.9, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "salud-privada-puntos",
        source: "tsunami_vector",
        "source-layer": "salud_privadageojson",
        type: "symbol",
        layout: { "icon-image": "salud_priv", "icon-size": 0.85, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "salud-publica-puntos",
        source: "tsunami_vector",
        "source-layer": "salud_publicageojson",
        type: "symbol",
        layout: { "icon-image": "salud_pub", "icon-size": 0.9, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },

      // Centros de Comando y su etiqueta (inactivas)
      {
        id: "comando-puntos",
        source: "tsunami_vector",
        "source-layer": "centros_comandogeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "comando", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "lbl-comando",
        source: "tsunami_vector",
        "source-layer": "centros_comandogeojson",
        type: "symbol",
        layout: {
          "visibility": "none",
          "text-field": ["coalesce", ["get", "etiqueta"], ["get", "nam"], ""],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11.5,
          "text-max-width": 8,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-allow-overlap": true
        },
        paint: {
          "text-color": "#111827",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5
        }
      },

      // Puntos de encuentro (Existente, Propuesta, Helipuerto y Escuelas)
      {
        id: "puntos-reunion-existente",
        source: "tsunami_vector",
        "source-layer": "puntos_defensa_civilgeojson",
        type: "symbol",
        filter: ["==", ["get", "estado"], "Existente"],
        layout: { "visibility": "none", "icon-image": "encuentro_existente", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "puntos-reunion-propuesta",
        source: "tsunami_vector",
        "source-layer": "puntos_defensa_civilgeojson",
        type: "symbol",
        filter: ["==", ["get", "estado"], "Propuesta"],
        layout: { "visibility": "none", "icon-image": "encuentro_propuesta", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "puntos-reunion-heli",
        source: "tsunami_vector",
        "source-layer": "puntos_defensa_civilgeojson",
        type: "symbol",
        filter: ["==", ["get", "estado"], "Helipuerto"],
        layout: { "visibility": "none", "icon-image": "helipuerto", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },
      {
        id: "puntos-reunion-escuelas",
        source: "tsunami_vector",
        "source-layer": "puntos_escuelasgeojson",
        type: "symbol",
        layout: { "visibility": "none", "icon-image": "encuentro_escuela", "icon-size": 0.95, "icon-padding": 0, "icon-allow-overlap": true, "icon-ignore-placement": true }
      },

      // Máscara de Recorte (activa - oscurece solo el exterior del área de estudio)
      {
        id: "zona-recorte-mascara",
        source: "tsunami_vector",
        "source-layer": "mascara_recortegeojson",
        type: "fill",
        paint: { "fill-color": "#4a4a4a", "fill-opacity": 0.65 }
      },

      // Línea Zona Segura (activa)
      {
        id: "cota-segura",
        source: "tsunami_vector",
        "source-layer": "cota_segurageojson",
        type: "line",
        paint: { "line-color": "rgb(11, 167, 41)", "line-width": 5.0 }
      },

      // MATRÍCULA ESCOLAR: mapa de calor (inactiva, pondera por cantidad de alumnos)
      {
        id: "matricula-calor",
        source: "matricula_calor_src",
        type: "heatmap",
        layout: { "visibility": "none" },
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "alumnos"], 0, 0, 500, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 16, 2.2],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 11, 22, 16, 55],
          "heatmap-opacity": 0.8,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgb(56, 189, 248)",
            0.4, "rgb(34, 197, 94)",
            0.6, "rgb(234, 179, 8)",
            0.8, "rgb(249, 87, 22)",
            1, "rgb(239, 68, 68)"
          ]
        }
      },

      // MATRÍCULA ESCOLAR: clusters cuando se unen 2 o más instituciones
      {
        id: "matricula-clusters",
        source: "matricula_src",
        type: "circle",
        filter: ["has", "point_count"],
        layout: { "visibility": "none" },
        paint: {
          "circle-color": "rgb(249, 87, 22)",
          "circle-opacity": 0.92,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
          "circle-radius": ["step", ["get", "alumnos_total"], 20, 400, 24, 800, 29, 1500, 35]
        }
      },
      {
        id: "matricula-cluster-count",
        source: "matricula_src",
        type: "symbol",
        filter: ["has", "point_count"],
        layout: {
          "visibility": "none",
          // Muestra cuántos puntos se unieron arriba y el total de alumnos abajo
          "text-field": [
            "concat",
            ["to-string", ["get", "point_count"]], " esc.\n",
            ["to-string", ["get", "alumnos_total"]], " alumnos"
          ],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-line-height": 1.15,
          "text-allow-overlap": true,
          "text-ignore-placement": true
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(11, 19, 30, 0.9)",
          "text-halo-width": 1.8
        }
      },

      // MATRÍCULA ESCOLAR: puntos individuales (cuando están separados)
      {
        id: "matricula-puntos",
        source: "matricula_src",
        type: "circle",
        filter: ["!", ["has", "point_count"]],
        layout: { "visibility": "none" },
        paint: {
          "circle-color": "rgb(249, 87, 22)",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-radius": ["interpolate", ["linear"], ["get", "alumnos"], 90, 7, 500, 15]
        }
      },
      {
        id: "matricula-puntos-label",
        source: "matricula_src",
        type: "symbol",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "visibility": "none",
          // Siempre muestra el número de alumnos (por fuera del círculo para que se lea aunque sea pequeño)
          "text-field": ["concat", ["to-string", ["get", "alumnos"]], " alumnos"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-allow-overlap": true,
          "text-ignore-placement": true
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#0b131e",
          "text-halo-width": 2.2
        }
      },

      // CAPAS DEL MÓDULO DE DIBUJO TÁCTICO Y ANOTACIONES
      {
        id: "user-draw-fill",
        source: "dibujos_usuario",
        type: "fill",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#ef4444"],
          "fill-opacity": 0.32
        }
      },
      {
        id: "user-draw-line-halo",
        source: "dibujos_usuario",
        type: "line",
        filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
        paint: {
          "line-color": "#000000",
          "line-width": 6
        }
      },
      {
        id: "user-draw-line",
        source: "dibujos_usuario",
        type: "line",
        filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#ef4444"],
          "line-width": 3.8
        }
      },
      {
        id: "user-draw-point",
        source: "dibujos_usuario",
        type: "circle",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["case", ["==", ["get", "isVertex"], true], 4.5, 7.5],
          "circle-color": ["coalesce", ["get", "color"], "#ef4444"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      },
      {
        id: "user-draw-label",
        source: "dibujos_usuario",
        type: "symbol",
        filter: ["has", "label"],
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 12.5,
          "text-offset": [0, -1.2],
          "text-anchor": "bottom",
          "text-allow-overlap": true
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#0b131e",
          "text-halo-width": 2.4
        }
      },

      // ETIQUETAS DE CALLES ACTIVAS POR DEFECTO Y SUPERPUESTAS ARRIBA DE TODO
      {
        id: "lbl-calles",
        source: "tsunami_vector",
        "source-layer": "callesgeojson",
        type: "symbol",
        minzoom: 14.0,
        layout: {
          "visibility": "visible",
          "symbol-placement": "line",
          "text-field": ["coalesce", ["get", "nam"], ["get", "fna"], ""],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-max-width": 8
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.2
        }
      }
    ]
  }
});

// =========================================================================
// LÓGICA DEL MÓDULO DE DIBUJO (LÍNEAS, FLECHAS, POLÍGONOS Y FIGURAS SIMPLES)
// =========================================================================
let activeTool = null;
let activeColor = '#ef4444';
let tempCoords = [];
let cursorCoord = null;
let savedGroups = [];

const STORAGE_KEY_DRAW = 'dgot_simulacro_dibujos_v1';

function loadSavedDrawings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAW);
    if (raw) {
      savedGroups = JSON.parse(raw);
      refreshDrawSource();
    }
  } catch(e) {}
}

function persistDrawings() {
  try {
    localStorage.setItem(STORAGE_KEY_DRAW, JSON.stringify(savedGroups));
  } catch(e) {}
}

function setDrawColor(hex, el) {
  activeColor = hex;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  refreshDrawSource();
}

function setDrawTool(tool) {
  activeTool = (activeTool === tool) ? null : tool;
  tempCoords = [];
  cursorCoord = null;

  document.querySelectorAll('.draw-btn').forEach(b => b.classList.remove('active'));
  if (activeTool) {
    document.getElementById('tool-' + activeTool).classList.add('active');
    map.getCanvas().style.cursor = 'crosshair';
  } else {
    map.getCanvas().style.cursor = '';
  }

  updateDrawUI();
  refreshDrawSource();
}

function updateDrawUI() {
  const hint = document.getElementById('draw-hint');
  const btnFin = document.getElementById('btn-finish-draw');

  if (!activeTool) {
    hint.style.display = 'none';
    btnFin.style.display = 'none';
    return;
  }

  hint.style.display = 'block';
  const textos = {
    line: 'Tocá el mapa para agregar vértices de la línea. Doble clic o botón verde para terminar.',
    arrow: 'Tocá los puntos de la ruta para trazar la flecha direccional. Doble clic o botón verde para terminar.',
    polygon: 'Tocá al menos 3 puntos en el mapa para cerrar el polígono.',
    circle: '1° clic: centro del círculo. 2° clic: define el radio exterior.',
    rect: '1° clic: primera esquina. 2° clic: esquina opuesta del rectángulo.',
    point: 'Tocá cualquier punto del mapa para colocar el marcador con su etiqueta.'
  };
  hint.innerText = textos[activeTool] || '';

  if ((activeTool === 'line' || activeTool === 'arrow') && tempCoords.length >= 2) {
    btnFin.style.display = 'block';
  } else if (activeTool === 'polygon' && tempCoords.length >= 3) {
    btnFin.style.display = 'block';
  } else {
    btnFin.style.display = 'none';
  }
}

function buildArrowFeatures(coords, color, label) {
  const feats = [];
  const lineFeat = turf.lineString(coords, { color, label: label || undefined });
  feats.push(lineFeat);

  const p1 = coords[coords.length - 2];
  const p2 = coords[coords.length - 1];
  const distSeg = turf.distance(p1, p2, { units: 'kilometers' });
  if (distSeg > 0.001) {
    const bearing = turf.bearing(p1, p2);
    const headLen = Math.min(Math.max(distSeg * 0.28, 0.018), 0.12);
    const leftWing = turf.destination(p2, headLen, bearing - 148, { units: 'kilometers' }).geometry.coordinates;
    const rightWing = turf.destination(p2, headLen, bearing + 148, { units: 'kilometers' }).geometry.coordinates;
    feats.push(turf.lineString([leftWing, p2, rightWing], { color }));
  }
  return feats;
}

function buildShapeGroup(tool, coords, color, label) {
  const cleanLabel = (label || '').trim() || undefined;
  if (tool === 'point') {
    return [turf.point(coords[0], { color, label: cleanLabel })];
  }
  if (tool === 'line') {
    return [turf.lineString(coords, { color, label: cleanLabel })];
  }
  if (tool === 'arrow') {
    return buildArrowFeatures(coords, color, cleanLabel);
  }
  if (tool === 'polygon') {
    const ring = [...coords, coords[0]];
    return [turf.polygon([ring], { color, label: cleanLabel })];
  }
  if (tool === 'circle') {
    const radiusKm = Math.max(turf.distance(coords[0], coords[1], { units: 'kilometers' }), 0.005);
    const poly = turf.circle(coords[0], radiusKm, { steps: 48, units: 'kilometers', properties: { color, label: cleanLabel } });
    return [poly];
  }
  if (tool === 'rect') {
    const minX = Math.min(coords[0][0], coords[1][0]);
    const minY = Math.min(coords[0][1], coords[1][1]);
    const maxX = Math.max(coords[0][0], coords[1][0]);
    const maxY = Math.max(coords[0][1], coords[1][1]);
    const poly = turf.bboxPolygon([minX, minY, maxX, maxY], { properties: { color, label: cleanLabel } });
    return [poly];
  }
  return [];
}

function refreshDrawSource() {
  if (!map || !map.getSource('dibujos_usuario')) return;
  const allFeatures = [];
  savedGroups.forEach(g => allFeatures.push(...g));

  const previewCoords = cursorCoord ? [...tempCoords, cursorCoord] : [...tempCoords];
  tempCoords.forEach(c => {
    allFeatures.push(turf.point(c, { color: activeColor, isVertex: true }));
  });

  const lbl = document.getElementById('draw-label').value;
  if (activeTool && previewCoords.length >= 2) {
    if (activeTool === 'polygon' && previewCoords.length >= 3) {
      allFeatures.push(...buildShapeGroup('polygon', previewCoords, activeColor, lbl));
    } else if (activeTool === 'polygon') {
      allFeatures.push(turf.lineString(previewCoords, { color: activeColor }));
    } else {
      allFeatures.push(...buildShapeGroup(activeTool, previewCoords, activeColor, lbl));
    }
  }

  map.getSource('dibujos_usuario').setData(turf.featureCollection(allFeatures));
}

function finishCurrentDrawing() {
  if (!activeTool) return;
  const lbl = document.getElementById('draw-label').value;
  let group = [];

  if ((activeTool === 'line' || activeTool === 'arrow') && tempCoords.length >= 2) {
    group = buildShapeGroup(activeTool, tempCoords, activeColor, lbl);
  } else if (activeTool === 'polygon' && tempCoords.length >= 3) {
    group = buildShapeGroup('polygon', tempCoords, activeColor, lbl);
  }

  if (group.length > 0) {
    savedGroups.push(group);
    persistDrawings();
  }
  tempCoords = [];
  cursorCoord = null;
  updateDrawUI();
  refreshDrawSource();
}

function undoLastDrawing() {
  if (tempCoords.length > 0) {
    tempCoords.pop();
    updateDrawUI();
    refreshDrawSource();
    return;
  }
  if (savedGroups.length > 0) {
    savedGroups.pop();
    persistDrawings();
    refreshDrawSource();
  }
}

function clearAllDrawings() {
  tempCoords = [];
  cursorCoord = null;
  savedGroups = [];
  persistDrawings();
  updateDrawUI();
  refreshDrawSource();
}

function exportDrawingsGeoJSON() {
  const allFeatures = [];
  savedGroups.forEach(g => allFeatures.push(...g));
  if (allFeatures.length === 0) {
    alert('No hay dibujos en el mapa para exportar.');
    return;
  }
  const fc = turf.featureCollection(allFeatures);
  const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'marcaciones_simulacro_ushuaia.geojson';
  a.click();
  URL.revokeObjectURL(url);
}

// =========================================================================
// EVENTOS DEL MAPA, POPUPS Y GEOLOCALIZACIÓN
// =========================================================================
map.on('load', () => {
  loadSavedDrawings();

  map.on('mousemove', (e) => {
    if (!activeTool || tempCoords.length === 0) return;
    cursorCoord = [e.lngLat.lng, e.lngLat.lat];
    refreshDrawSource();
  });

  map.on('click', (e) => {
    if (activeTool) {
      const pt = [e.lngLat.lng, e.lngLat.lat];
      const lbl = document.getElementById('draw-label').value;

      if (activeTool === 'point') {
        savedGroups.push(buildShapeGroup('point', [pt], activeColor, lbl));
        persistDrawings();
        refreshDrawSource();
        return;
      }

      tempCoords.push(pt);

      if ((activeTool === 'circle' || activeTool === 'rect') && tempCoords.length === 2) {
        savedGroups.push(buildShapeGroup(activeTool, tempCoords, activeColor, lbl));
        persistDrawings();
        tempCoords = [];
        cursorCoord = null;
      }

      updateDrawUI();
      refreshDrawSource();
      return;
    }
  });

  map.on('dblclick', (e) => {
    if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'polygon') {
      e.preventDefault();
      if (tempCoords.length > 1) tempCoords.pop();
      finishCurrentDrawing();
    }
  });

  // Capas interactivas con Popups enriquecidos
  const clickLayers = [
    'salud-publica-puntos',
    'salud-privada-puntos',
    'bomberos-puntos',
    'seguridad-puntos',
    'puntos-reunion-existente',
    'puntos-reunion-propuesta',
    'puntos-reunion-heli',
    'puntos-reunion-escuelas',
    'comando-puntos',
    'vuln-albergue',
    'vuln-jubilados',
    'vuln-hogar',
    'vuln-caad',
    'escuelas-prim-sec',
    'escuelas-jardin',
    'matricula-puntos',
    'matricula-puntos-label',
    'ciencia-puntos',
    'deportes-puntos',
    'legislativo-puntos',
    'puentes-vial',
    'puentes-peatonal',
    'combustible-puntos',
    'potabilizadora-puntos',
    'antenas-puntos',
    'electrogeno-puntos',
    'vias-evacuacion',
    'vias-evacuacion-borde',
    'lyr-escaleras',
    'escaleras-borde',
    'arroyos-lineas',
    'espejos-agua-fill'
  ];

  clickLayers.forEach(lId => {
    map.on('mouseenter', lId, () => {
      if (!activeTool) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', lId, () => {
      if (!activeTool) map.getCanvas().style.cursor = '';
    });

    map.on('click', lId, (e) => {
      if (activeTool) return;
      const feature = e.features[0];
      const props = feature.properties || {};
      const coords = feature.geometry.type === 'Point'
        ? feature.geometry.coordinates.slice()
        : e.lngLat;

      new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
        .setLngLat(coords)
        .setHTML(generarPopupHTML(lId, props))
        .addTo(map);
    });
  });

  // MATRÍCULA: clic en cluster hace zoom al lugar hasta separar los puntos unidos
  ['matricula-clusters', 'matricula-cluster-count'].forEach(clusterLayer => {
    map.on('mouseenter', clusterLayer, () => {
      if (!activeTool) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', clusterLayer, () => {
      if (!activeTool) map.getCanvas().style.cursor = '';
    });

    map.on('click', clusterLayer, async (e) => {
      if (activeTool) return;
      const features = map.queryRenderedFeatures(e.point, { layers: ['matricula-clusters', 'matricula-cluster-count'] });
      if (!features.length) return;

      const clusterId = features[0].properties.cluster_id;
      const coords = features[0].geometry.coordinates;
      const source = map.getSource('matricula_src');

      try {
        // Soporta tanto Promesas (MapLibre v3/v4) como Callbacks (MapLibre v2)
        const zoom = await new Promise((resolve, reject) => {
          const res = source.getClusterExpansionZoom(clusterId, (err, z) => {
            if (err) reject(err);
            else resolve(z);
          });
          if (res && typeof res.then === 'function') {
            res.then(resolve).catch(reject);
          }
        });
        map.easeTo({
          center: coords,
          zoom: Math.min((zoom || map.getZoom() + 2) + 0.5, 18),
          duration: 650
        });
      } catch (err) {
        map.easeTo({ center: coords, zoom: map.getZoom() + 2, duration: 650 });
      }
    });
  });

  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  });
  map.addControl(geolocate, 'bottom-right');
  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

  geolocate.on('geolocate', (pos) => {
    const userCoords = [pos.coords.longitude, pos.coords.latitude];
    const userPoint = turf.point(userCoords);
    gpsStatus.innerText = `GPS: ±${Math.round(pos.coords.accuracy)}m`;

    const featuresZonas = map.queryRenderedFeatures({ layers: ['zona-evacuacion-fill', 'riesgo-alto', 'riesgo-medio', 'riesgo-bajo'] });
    const featuresPuntos = map.queryRenderedFeatures({ layers: ['puntos-reunion-existente', 'puntos-reunion-propuesta', 'puntos-reunion-heli', 'puntos-reunion-escuelas'] });

    let enZonaEvacuacion = false;
    let nivelRiesgo = null;

    if (featuresZonas.length > 0) {
      for (const f of featuresZonas) {
        try {
          if (turf.booleanPointInPolygon(userPoint, f)) {
            enZonaEvacuacion = true;
            nivelRiesgo = f.properties.categoria || 'Alto';
            break;
          }
        } catch(err) {}
      }
    }

    alertBox.style.display = 'block';

    if (enZonaEvacuacion && nivelRiesgo === 'Medio') {
      alertBox.className = 'alert-banner alert-warning';
      alertBox.innerHTML = '⚠️ PRECAUCIÓN: SE ENCUENTRA EN ZONA DE EVACUACIÓN (COTA MEDIA)';
    } else if (enZonaEvacuacion) {
      alertBox.className = 'alert-banner alert-danger';
      alertBox.innerHTML = '⚠️ ALERTA MÁXIMA: SE ENCUENTRA DENTRO DE LA ZONA DE EVACUACIÓN';
    } else {
      alertBox.className = 'alert-banner alert-safe';
      alertBox.innerHTML = '✅ ZONA SEGURA (Fuera del polígono de evacuación)';
      map.getSource('ruta_activa').setData(turf.featureCollection([]));
      return;
    }

    if (featuresPuntos.length > 0) {
      let destinoCercano = null;
      let minDist = Infinity;

      featuresPuntos.forEach(pt => {
        const dist = turf.distance(userPoint, pt, { units: 'meters' });
        if (dist < minDist) {
          minDist = dist;
          destinoCercano = pt;
        }
      });

      if (destinoCercano) {
        const nombreDestino = limpiarTexto(destinoCercano.properties.nam || destinoCercano.properties.Name || 'Zona Segura');
        alertBox.innerHTML += `<br><span style="font-size:11.5px; font-weight:normal;">Evacue hacia: <strong>${nombreDestino}</strong> (~${Math.round(minDist)}m)</span>`;
        const lineaGuia = turf.lineString([userCoords, destinoCercano.geometry.coordinates]);
        map.getSource('ruta_activa').setData(turf.featureCollection([lineaGuia]));
      }
    }
  });
});