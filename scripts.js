mapboxgl.accessToken =
  "pk.eyJ1IjoibW9udHJlYWx0aGVuYW5kbm93IiwiYSI6ImNsemE0b2Q3MTAxNnIycm9va2UxNHE5MTAifQ.xzpBb9fHCoJ03Yu7YZm5aw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/montrealthenandnow/clevx8q00000901o4q8dsipxd",
  center: [-73.57731, 45.50022],
  zoom: 12.76,
});

map.on("load", function () {
  // Set up the Points layer
  map.setPaintProperty("Points", "circle-radius", 4);

  // Add the mtlinvisible layer
  map.addLayer({
    id: "mtlinvisible",
    type: "circle",
    source: "your-data-source-id", // Ensure this matches the source ID used in "Points"
    paint: {
      "circle-radius": 4,
      "circle-color": "#d14747", // Adjust as needed
    },
    layout: {
      visibility: "none", // Start with the layer hidden
    },
  });

  // Initialize the toggle state to off
  document.getElementById("layer-toggle").checked = false;
  map.setLayoutProperty("mtlinvisible", "visibility", "none");
  map.setLayoutProperty("Points", "visibility", "visible");

  // Toggle functionality
  document
    .getElementById("layer-toggle")
    .addEventListener("change", function (e) {
      const visibility = e.target.checked ? "visible" : "none";
      map.setLayoutProperty("mtlinvisible", "visibility", visibility);

      // Hide Points layer when mtlinvisible is toggled on
      if (e.target.checked) {
        map.setLayoutProperty("Points", "visibility", "none");
      } else {
        map.setLayoutProperty("Points", "visibility", "visible");
      }
    });

  // Function to handle hover events for layers
  function handleLayerHover(layerId) {
    map.on("mouseenter", layerId, function () {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, function () {
      map.getCanvas().style.cursor = "";
    });
  }

  // Set up hover events for both layers
  handleLayerHover("Points");
  handleLayerHover("mtlinvisible");

  // Function to handle click events for layers
  function handleLayerClick(layerId) {
    map.on("click", layerId, function (e) {
      if (e.features.length > 0) {
        const properties = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates;

        let imageThen = properties.imageThen;
        let imageNow = properties.imageNow;
        let imageUrl = properties.image || "default-image-url";

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

        // Determine if on mobile
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          // Mobile specific offsets
          const infoPanelWidth = window.innerWidth;
          const infoPanelHeight = window.innerHeight * 0.5;
          const offsetX = 0; // Fixed offset for mobile
          const offsetY =
            (window.innerHeight - infoPanelHeight) / 2 - infoPanelHeight;

          const zoomLevel = 16; // Adjust zoom level for mobile

          if (Array.isArray(coordinates) && coordinates.length === 2) {
            map.flyTo({
              center: coordinates,
              zoom: zoomLevel,
              essential: true,
              offset: [offsetX, offsetY], // Use fixed horizontal offset for mobile
            });
          }
        } else {
          // Desktop specific offsets
          const infoPanelWidth = window.innerWidth * 0.4;
          const offsetX = infoPanelWidth / 2; // Half of the info panel width
          const offsetY = 0;

          const zoomLevel = 16; // Default zoom level for web

          if (Array.isArray(coordinates) && coordinates.length === 2) {
            map.flyTo({
              center: coordinates,
              zoom: zoomLevel,
              essential: true,
              offset: [offsetX, offsetY], // Adjust as needed for desktop
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

  // Set up click events for both layers
  handleLayerClick("Points");
  handleLayerClick("mtlinvisible");

  // Ensure layer visibility toggle starts hidden
  map.setLayoutProperty("mtlinvisible", "visibility", "none");
});
