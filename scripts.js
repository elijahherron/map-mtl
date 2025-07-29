mapboxgl.accessToken =
  "pk.eyJ1IjoibW9udHJlYWx0aGVuYW5kbm93IiwiYSI6ImNsemE0b2Q3MTAxNnIycm9va2UxNHE5MTAifQ.xzpBb9fHCoJ03Yu7YZm5aw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/montrealthenandnow/clevx8q00000901o4q8dsipxd",
  center: [-73.57731, 45.50022],
  zoom: 12.76,
  pitchWithRotate: false,
});

map.touchPitch.disable();

// Check for shared URL parameters on page load
function checkForSharedPoint() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedPoint = urlParams.get('point');
  const sharedTitle = urlParams.get('title');
  const sharedImageThen = urlParams.get('imageThen');
  const sharedImageNow = urlParams.get('imageNow');
  
  if (sharedPoint && (sharedImageThen || sharedImageNow)) {
    // Wait for map to load, then show the shared content
    setTimeout(() => {
      showSharedPointModal(sharedTitle, sharedImageThen, sharedImageNow);
    }, 1000);
  }
}

// Show shared point in a modal
function showSharedPointModal(title, imageThen, imageNow) {
  const images = [];
  if (imageThen) images.push(`<div style="margin-bottom: 0;"><img src="${imageThen}" alt="Image Then" style="max-width: 100%; display: block; margin: 0; padding: 0; border: 0;"></div>`);
  if (imageNow) images.push(`<div style="margin-top: 10px; margin-bottom: 0;"><img src="${imageNow}" alt="Image Now" style="max-width: 100%; display: block; margin: 0; padding: 0; border: 0;"></div>`);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title || 'Montreal Then & Now'}</h3>
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
      </div>
      <div class="modal-body">
        <div style="text-align: center; line-height: 0;">
          ${images.join('')}
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="this.closest('.modal').remove(); window.history.replaceState({}, document.title, window.location.pathname);" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            Explore the Map
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
}

map.on("load", function () {
  const isMobile = window.innerWidth <= 768;
  
  // Check if this is a shared link
  checkForSharedPoint();

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

  function handleLayerHover(layerId) {
    let popup;

    map.on("mouseenter", layerId, function (e) {
      map.getCanvas().style.cursor = "pointer";

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

  handleLayerHover("Points");
  handleLayerHover("mtlinvisible");

  function handleLayerClick(layerId) {
    map.on("click", layerId, function (e) {
      if (e.features.length > 0) {
        const properties = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates;
        const featureId = e.features[0].id;

        let imageThen = properties.imageThen;
        let imageNow = properties.imageNow;
        let imageUrl = properties.imageUrl || "default-image-url";

        const images = [];
        if (imageThen) images.push(`<img src="${imageThen}" alt="Image Then">`);
        if (imageNow) images.push(`<img src="${imageNow}" alt="Image Now">`);
        if (images.length === 0)
          images.push(`<img src="${imageUrl}" alt="Image">`);

        const shareUrl = generateShareUrl(featureId, properties.title, imageThen, imageNow);
        
        const content = `
          <div id="info-panel-text">
            <h2>${properties.title || "No title"}</h2>
            <h3>${properties.description || "No description"}</h3>
          </div>
          <button id="share-btn" onclick="openShareModal('${shareUrl}', '${properties.title || 'Montreal Then & Now'}', '${imageThen || ''}', '${imageNow || ''}')">↗ Share</button>
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

        // Add click outside to close functionality
        const clickOutsideHandler = function(e) {
          // Check if click is outside the info panel and not on a map point
          if (!infoPanel.contains(e.target) && 
              infoPanel.style.display === "block" && 
              !e.target.closest('.mapboxgl-canvas-container')) {
            infoPanel.style.display = "none";
            document.removeEventListener("click", clickOutsideHandler);
          }
        };
        
        // Remove any existing click handlers first
        document.removeEventListener("click", window.currentClickHandler);
        
        // Store reference to current handler
        window.currentClickHandler = clickOutsideHandler;
        
        // Add event listener after a short delay to prevent immediate closing
        setTimeout(() => {
          document.addEventListener("click", clickOutsideHandler);
        }, 100);
      }
    });
  }

  handleLayerClick("Points");
  handleLayerClick("mtlinvisible");

  map.setLayoutProperty("mtlinvisible", "visibility", "none");
});

// Generate shareable URL
function generateShareUrl(featureId, title, imageThen, imageNow) {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    point: featureId || 'unknown',
    title: title || 'Montreal Then & Now',
    ...(imageThen && { imageThen }),
    ...(imageNow && { imageNow })
  });
  return `${baseUrl}?${params.toString()}`;
}

// Open share modal
function openShareModal(shareUrl, title, imageThen, imageNow) {
  const modal = document.getElementById('share-modal');
  if (!modal) {
    createShareModal();
  }
  
  document.getElementById('share-url-input').value = shareUrl;
  document.getElementById('share-title').textContent = title;
  
  // Update share links
  updateShareLinks(shareUrl, title, imageThen, imageNow);
  
  document.getElementById('share-modal').style.display = 'block';
}

// Create share modal HTML
function createShareModal() {
  const modal = document.createElement('div');
  modal.id = 'share-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="share-title">Share This Point</h3>
        <span class="close" onclick="closeShareModal()">&times;</span>
      </div>
      <div class="modal-body">
        <div class="share-url-section">
          <label for="share-url-input">Shareable Link:</label>
          <div class="url-input-container">
            <input type="text" id="share-url-input" readonly>
            <button onclick="copyShareUrl()" id="copy-url-btn">Copy</button>
          </div>
        </div>
        <div class="share-options">
          <h4>Share via:</h4>
          <div class="share-buttons">
            <button id="email-share" onclick="shareViaEmail()">📧 Email</button>
            <button id="sms-share" onclick="shareViaSMS()">💬 Message</button>
            <button id="twitter-share" onclick="shareViaTwitter()">🐦 Twitter</button>
            <button id="facebook-share" onclick="shareViaFacebook()">📘 Facebook</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeShareModal();
    }
  });
}

// Update share links with current data
function updateShareLinks(shareUrl, title, imageThen, imageNow) {
  window.currentShareData = { shareUrl, title, imageThen, imageNow };
}

// Close share modal
function closeShareModal() {
  document.getElementById('share-modal').style.display = 'none';
}

// Copy share URL to clipboard
function copyShareUrl() {
  const input = document.getElementById('share-url-input');
  input.select();
  input.setSelectionRange(0, 99999);
  
  try {
    const successful = document.execCommand('copy');
    const button = document.getElementById('copy-url-btn');
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.style.background = '#28a745';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  } catch (err) {
    alert('Copy failed. Please select and copy manually.');
  }
}

// Share via email
function shareViaEmail() {
  const { shareUrl, title } = window.currentShareData;
  const subject = encodeURIComponent(`Check out this Montreal Then & Now location: ${title}`);
  const body = encodeURIComponent(`Take a look at this interesting Montreal location showing how it looked then and now:\n\n${title}\n\n${shareUrl}`);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

// Share via SMS
function shareViaSMS() {
  const { shareUrl, title } = window.currentShareData;
  const message = encodeURIComponent(`Check out this Montreal Then & Now location: ${title} - ${shareUrl}`);
  window.open(`sms:?body=${message}`);
}

// Share via Twitter
function shareViaTwitter() {
  const { shareUrl, title } = window.currentShareData;
  const text = encodeURIComponent(`Check out this Montreal Then & Now location: ${title}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`);
}

// Share via Facebook
function shareViaFacebook() {
  const { shareUrl } = window.currentShareData;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
}
