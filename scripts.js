mapboxgl.accessToken =
  "pk.eyJ1IjoibW9udHJlYWx0aGVuYW5kbm93IiwiYSI6ImNsemE0b2Q3MTAxNnIycm9va2UxNHE5MTAifQ.xzpBb9fHCoJ03Yu7YZm5aw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/montrealthenandnow/clevx8q00000901o4q8dsipxd",
  center: [-73.57731, 45.50022],
  zoom: 12.76,
  pitchWithRotate: false, // Disable tilting while allowing rotation
});

map.on("load", function () {
  const isMobile = window.innerWidth <= 768;

  map.addLayer({
    id: "mtlinvisible",
    type: "circle",
    source: "mtlinvisible",
    paint: {
      "circle-radius": isMobile ? 8 : 4, // Increased radius on mobile
      "circle-color": "#d14747",
    },
    layout: {
      visibility: "none",
    },
  });

  // Toggle functionality remains the same...
  document
    .getElementById("layer-toggle")
    .addEventListener("change", function (e) {
      const visibility = e.target.checked ? "visible" : "none";
      map.setLayoutProperty("mtlinvisible", "visibility", visibility);
      map.setLayoutProperty(
        "Points",
        "visibility",
        visibility === "none" ? "visible" : "none"
      );
    });

  // The rest of your hover and click handlers remain unchanged...
  // Function to handle hover events for layers
  function handleLayerHover(layerId) {
    let popup;

    map.on("mouseenter", layerId, function (e) {
      map.getCanvas().style.cursor = "pointer";

      // Display the popup when hovering
      const coordinates = e.features[0].geometry.coordinates.slice();
      const title = e.features[0].properties.title || "No title";

      popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "custom-popup",
      })
        .setLngLat(coordinates)
        .setHTML(`<h3>${title}</h3>`)
        .addTo(map);
    });

    map.on("mouseleave", layerId, function () {
      map.getCanvas().style.cursor = "";
      if (popup) {
        popup.remove();
        popup = null;
      }
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
        let imageUrl = properties.imageUrl || "default-image-url"; // Changed to properties.imageUrl

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

  // Set up click events for both layers
  handleLayerClick("Points");
  handleLayerClick("mtlinvisible");

  // Ensure layer visibility toggle starts hidden
  map.setLayoutProperty("mtlinvisible", "visibility", "none");
});
