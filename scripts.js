mapboxgl.accessToken =
  "pk.eyJ1IjoibW9udHJlYWx0aGVuYW5kbm93IiwiYSI6ImNsemE0b2Q3MTAxNnIycm9va2UxNHE5MTAifQ.xzpBb9fHCoJ03Yu7YZm5aw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/montrealthenandnow/clevx8q00000901o4q8dsipxd",
  center: [-73.57731, 45.50022],
  zoom: 12.76,
});

map.on("load", function () {
  // Add the Points layer
  map.addLayer({
    id: "Points",
    type: "circle",
    source: "pointsUpdate",
    paint: {
      "circle-radius": {
        stops: [
          [0, 4],
          [22, 10],
        ],
        base: 1,
      },
      "circle-color": "#d14747",
    },
  });

  // Add the mtlinvisible layer
  map.addLayer({
    id: "mtlinvisible",
    type: "circle",
    source: "mtlinvisible",
    paint: {
      "circle-radius": {
        stops: [
          [0, 4],
          [22, 10],
        ],
        base: 1,
      },
      "circle-color": "#d14747",
    },
    layout: {
      visibility: "none", // Initially hidden
    },
  });

  // Initialize toggle switch
  document.getElementById("layer-toggle").checked = false;

  // Toggle layer visibility
  document
    .getElementById("layer-toggle")
    .addEventListener("change", function (e) {
      const visibility = e.target.checked ? "visible" : "none";
      map.setLayoutProperty("mtlinvisible", "visibility", visibility);
      map.setLayoutProperty(
        "Points",
        "visibility",
        e.target.checked ? "none" : "visible"
      );
    });

  // Handle hover events
  function handleLayerHover(layerId) {
    map.on("mouseenter", layerId, function () {
      map.getCanvas().style.cursor = layerId === "Points" ? "pointer" : "";
    });

    map.on("mouseleave", layerId, function () {
      map.getCanvas().style.cursor = "";
    });
  }

  handleLayerHover("Points");
  handleLayerHover("mtlinvisible");

  // Handle click events
  function handleLayerClick(layerId) {
    map.on("click", layerId, function (e) {
      if (e.features.length > 0) {
        const properties = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates;

        const imageThen = properties.imageThen;
        const imageNow = properties.imageNow;
        const imageUrl = properties.imageUrl || "default-image-url";

        const images = [];
        if (imageThen) images.push(`<img src="${imageThen}" alt="Image Then">`);
        if (imageNow) images.push(`<img src="${imageNow}" alt="Image Now">`);
        if (images.length === 0)
          images.push(`<img src="${imageUrl}" alt="Image">`);

        const content = `
          <div id="info-panel-text">
            <h2>${properties.title || "No title"}</h2>
            <h3>${properties.description || "No description"}</h3>
          </div>
          ${images.join("")}
        `;

        const infoPanel = document.getElementById("info-panel");
        infoPanel.innerHTML = `<button id="close-btn">X</button>` + content;
        infoPanel.style.display = "block";

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          const infoPanelWidth = window.innerWidth;
          const infoPanelHeight = window.innerHeight * 0.5;
          const offsetX = 0;
          const offsetY =
            (window.innerHeight - infoPanelHeight) / 2 - infoPanelHeight;

          const zoomLevel = 16;

          if (Array.isArray(coordinates) && coordinates.length === 2) {
            map.flyTo({
              center: coordinates,
              zoom: zoomLevel,
              essential: true,
              offset: [offsetX, offsetY],
            });
          }
        } else {
          const infoPanelWidth = window.innerWidth * 0.4;
          const offsetX = infoPanelWidth / 2;
          const offsetY = 0;

          const zoomLevel = 16;

          if (Array.isArray(coordinates) && coordinates.length === 2) {
            map.flyTo({
              center: coordinates,
              zoom: zoomLevel,
              essential: true,
              offset: [offsetX, offsetY],
            });
          }
        }

        document
          .getElementById("close-btn")
          .addEventListener("click", function () {
            infoPanel.style.display = "none";
          });
      }
    });
  }

  handleLayerClick("Points");
  handleLayerClick("mtlinvisible");

  // Ensure layer visibility toggle starts hidden
  map.setLayoutProperty("mtlinvisible", "visibility", "none");
});
