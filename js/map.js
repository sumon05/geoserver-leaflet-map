// ── Karte initialisieren ──────────────────────────
const map = L.map("map").setView([49.0069, 8.4037], 13);

const GS = "/geoserver/wms";

// ── Basemaps ──────────────────────────────────────
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/" +
    "World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "© Esri" },
);

// ── WMS Layer ─────────────────────────────────────
const strassen = L.tileLayer
  .wms(GS, {
    layers: "karlsruhe:roads_utf8",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    crs: L.CRS.EPSG3857,
    minZoom: 13,
  })
  .addTo(map);

const gewaesser = L.tileLayer
  .wms(GS, {
    layers: "karlsruhe:gis_osm_water_a_free_1",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    crs: L.CRS.EPSG3857,
  })
  .addTo(map);

const gebaeude = L.tileLayer.wms(GS, {
  layers: "karlsruhe:buildings_utf8",
  format: "image/png",
  transparent: true,
  version: "1.1.1",
  crs: L.CRS.EPSG3857,
  minZoom: 15,
});

const orte = L.tileLayer
  .wms(GS, {
    layers: "karlsruhe:gis_osm_places_free_1",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    crs: L.CRS.EPSG3857,
  })
  .addTo(map);

// ── Aktive Layer verfolgen ────────────────────────
const activeLayers = {
  "karlsruhe:roads_utf8": strassen,
  "karlsruhe:gis_osm_water_a_free_1": gewaesser,
  "karlsruhe:buildings_utf8": gebaeude,
  "karlsruhe:gis_osm_places_free_1": orte,
};

// ── Layer Control ─────────────────────────────────
L.control
  .layers(
    {
      OpenStreetMap: osm,
      Satellit: satellite,
    },
    {
      Strassen: strassen,
      Gewaesser: gewaesser,
      Gebaeude: gebaeude,
      Orte: orte,
    },
    { collapsed: false, position: "topright" },
  )
  .addTo(map);

// ── Massstab ──────────────────────────────────────
L.control.scale({ imperial: false }).addTo(map);

// ── Highlight Layer ───────────────────────────────
let highlightLayer;

// ── Klick → ALLE sichtbaren Layer abfragen ────────
map.on("click", async (e) => {
  const visibleLayers = Object.keys(activeLayers).filter((layerName) =>
    map.hasLayer(activeLayers[layerName]),
  );

  if (visibleLayers.length === 0) return;

  clearHighlight();

  let allFeatures = [];

  for (const layerName of visibleLayers) {
    const feature = await getFeatureInfo(e, layerName);
    if (feature) {
      allFeatures.push({
        layer: layerName,
        props: feature.properties,
        feature,
      });
    }
  }

  if (allFeatures.length === 0) {
    map.closePopup();
    resetInfoPanel();
    return;
  }

  // Erstes Feature highlighten
  highlightFeature(allFeatures[0].feature);

  // Popup Inhalt aufbauen
  let content = "";

  allFeatures.forEach(({ layer, props }) => {
    // Strassen
    if (layer.includes("roads")) {
      content += `
        <div class="popup-section">
          <div class="popup-title">🛣️ Strasse</div>
          <div class="popup-row">
            <span>Name:</span> ${props.name || "Unbekannt"}
          </div>
          <div class="popup-row">
            <span>Typ:</span> ${props.fclass || "-"}
          </div>
          <div class="popup-row">
            <span>Max. Tempo:</span> ${props.maxspeed || "-"} km/h
          </div>
          <div class="popup-row">
            <span>Einbahn:</span>
            ${props.oneway === "T" ? "Ja" : "Nein"}
          </div>
        </div>`;
    }

    // Gewaesser
    if (layer.includes("water")) {
      content += `
        <div class="popup-section">
          <div class="popup-title">💧 Gewaesser</div>
          <div class="popup-row">
            <span>Name:</span> ${props.name || "Unbekannt"}
          </div>
          <div class="popup-row">
            <span>Typ:</span> ${props.fclass || "-"}
          </div>
        </div>`;
    }

    // Gebaeude
    if (layer.includes("buildings")) {
      content += `
        <div class="popup-section">
          <div class="popup-title">🏢 Gebaeude</div>
          <div class="popup-row">
            <span>Name:</span> ${props.name || "Unbekannt"}
          </div>
          <div class="popup-row">
            <span>Typ:</span> ${props.type || "-"}
          </div>
        </div>`;
    }

    // Orte
    if (layer.includes("places")) {
      content += `
        <div class="popup-section">
          <div class="popup-title">📍 Ort</div>
          <div class="popup-row">
            <span>Name:</span> ${props.name || "Unbekannt"}
          </div>
          <div class="popup-row">
            <span>Typ:</span> ${props.fclass || "-"}
          </div>
          <div class="popup-row">
            <span>Einwohner:</span>
            ${
              props.population
                ? Number(props.population).toLocaleString("de-DE")
                : "-"
            }
          </div>
        </div>`;
    }
  });

  // Popup anzeigen
  L.popup({ maxWidth: 300 })
    .setLatLng(e.latlng)
    .setContent(`<div class="popup-wrapper">${content}</div>`)
    .openOn(map);

  // Info Panel aktualisieren
  updateInfoPanel(
    allFeatures[0].props.name || "Element",
    `<p>Typ: ${allFeatures[0].props.fclass || "-"}</p>`,
  );
});

// Popup schliessen → Highlight entfernen
map.on("popupclose", () => {
  clearHighlight();
  resetInfoPanel();
});

// ── GetFeatureInfo Funktion ───────────────────────
async function getFeatureInfo(e, layerName) {
  const size = map.getSize();
  const point = map.latLngToContainerPoint(e.latlng);
  const bounds = map.getBounds();

  const sw = map.options.crs.project(bounds.getSouthWest());
  const ne = map.options.crs.project(bounds.getNorthEast());

  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers: layerName,
    query_layers: layerName,
    info_format: "application/json",
    width: size.x,
    height: size.y,
    srs: "EPSG:3857",
    bbox: `${sw.x},${sw.y},${ne.x},${ne.y}`,
    x: Math.round(point.x),
    y: Math.round(point.y),
    feature_count: 5,
  });

  try {
    const url = `${GS}?${params}`;
    const res = await fetch(url);
    const text = await res.text();

    // XML Fehler abfangen
    if (text.startsWith("<?xml") || text.startsWith("<")) {
      console.warn("GeoServer returned XML:", text);
      return null;
    }

    const data = JSON.parse(text);
    return data.features?.[0] || null;
  } catch (err) {
    console.error("Fehler:", err);
    return null;
  }
}

// ── Highlight Funktion ────────────────────────────
function highlightFeature(feature) {
  if (highlightLayer) {
    map.removeLayer(highlightLayer);
  }

  highlightLayer = L.geoJSON(feature, {
    style: {
      color: "red",
      weight: 3,
      fillOpacity: 0.2,
    },
    pointToLayer: (f, latlng) =>
      L.circleMarker(latlng, {
        radius: 8,
        color: "red",
        fillColor: "red",
        fillOpacity: 0.8,
      }),
  }).addTo(map);
}

// ── Info Panel ────────────────────────────────────
function updateInfoPanel(title, content) {
  document.getElementById("info-panel").innerHTML = `
    <h3>${title}</h3>
    ${content || "<p>Keine Daten</p>"}
  `;
}

function resetInfoPanel() {
  document.getElementById("info-panel").innerHTML = `
    <h3>Karlsruhe GIS Map</h3>
    <p>Klicke auf ein Element fuer Details</p>
  `;
}

function clearHighlight() {
  if (highlightLayer) {
    map.removeLayer(highlightLayer);
    highlightLayer = null;
  }
}
