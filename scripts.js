mapboxgl.accessToken =
  "pk.eyJ1IjoibW9udHJlYWx0aGVuYW5kbm93IiwiYSI6ImNsemE0b2Q3MTAxNnIycm9va2UxNHE5MTAifQ.xzpBb9fHCoJ03Yu7YZm5aw";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/montrealthenandnow/clevx8q00000901o4q8dsipxd",
  center: [-73.57731, 45.50022],
  zoom: 12.76,
});

map.on("load", function () {
  map.on("mouseenter", "pointsupdate", function (e) {
    map.getCanvas().style.cursor = "pointer";
    const coordinates = e.features[0].geometry.coordinates.slice();
    const title = e.features[0].properties.title || "No title";

    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "custom-popup",
    })
      .setLngLat(coordinates)
      .setHTML(`<h3>${title}</h3>`)
      .addTo(map);
  });

  map.on("mouseleave", "pointsupdate", function () {
    map.getCanvas().style.cursor = "";
    const popups = document.getElementsByClassName("mapboxgl-popup");
    if (popups.length) {
      popups[0].remove();
    }
  });

  map.on("click", "pointsupdate", function (e) {
    if (e.features.length > 0) {
      const properties = e.features[0].properties;
      let imageThen = properties.imageThen;
      let imageNow = properties.imageNow;
      let imageUrl = properties.image || "default-image-url";

      // Display imageThen, imageNow if both exist, otherwise fallback to imageUrl
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

      document
        .getElementById("close-btn")
        .addEventListener("click", function () {
          infoPanel.style.display = "none";
        });
    }
  });
});
