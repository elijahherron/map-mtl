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
  const sharedDescription = urlParams.get('description');
  const sharedImageThen = urlParams.get('imageThen');
  const sharedImageNow = urlParams.get('imageNow');
  const sharedLat = urlParams.get('lat');
  const sharedLng = urlParams.get('lng');
  
  if (sharedPoint && (sharedImageThen || sharedImageNow)) {
    // Wait for map to load, then show the shared content and zoom to location
    setTimeout(() => {
      // Zoom to location if coordinates are available
      if (sharedLat && sharedLng) {
        const coordinates = [parseFloat(sharedLng), parseFloat(sharedLat)];
        
        // Calculate offset to position marker to the right of modal
        const isMobile = window.innerWidth <= 768;
        const modalWidth = isMobile ? window.innerWidth * 0.95 : Math.min(700, window.innerWidth * 0.6);
        const offsetX = isMobile ? 0 : modalWidth / 2;
        
        map.flyTo({
          center: coordinates,
          zoom: 16,
          duration: 1500,
          offset: [-offsetX, 0]
        });
        
        // Show modal after zoom starts
        setTimeout(() => {
          showSharedPointModal(sharedTitle, sharedDescription, sharedImageThen, sharedImageNow, coordinates);
        }, 300);
      } else {
        // Show modal without coordinates
        setTimeout(() => {
          showSharedPointModal(sharedTitle, sharedDescription, sharedImageThen, sharedImageNow);
        }, 300);
      }
    }, 1000);
  }
}

// Show shared point in a modal
function showSharedPointModal(title, description, imageThen, imageNow, coordinates) {
  const images = [];
  if (imageThen) images.push(`<div style="margin-bottom: 0;"><img src="${imageThen}" alt="Image Then" style="width: 100%; height: auto; display: block; margin: 0; padding: 0; border: 0;"></div>`);
  if (imageNow) images.push(`<div style="margin-top: 10px; margin-bottom: 0;"><img src="${imageNow}" alt="Image Now" style="width: 100%; height: auto; display: block; margin: 0; padding: 0; border: 0;"></div>`);
  
  // Add temporary marker to map if coordinates are provided
  let tempMarker = null;
  if (coordinates && coordinates.length === 2) {
    tempMarker = new mapboxgl.Marker({
      color: '#d14747',
      scale: 1.5
    })
    .setLngLat(coordinates)
    .addTo(map);
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content shared-point-modal">
      <div class="modal-header">
        <div style="position: relative; width: 100%;">
          <h3 style="margin: 0; color: #d14747; font-family: 'PT Serif', serif; font-style: italic;">${title || 'Montreal Then & Now'}</h3>
          <h3 style="position: absolute; top: 0; right: 30px; margin: 0; color: #000000b6; font-family: 'PT Serif', serif; font-style: italic; font-size: 16px;">${description || ''}</h3>
        </div>
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
      </div>
      <div class="modal-body">
        <div style="text-align: center; line-height: 0;">
          ${images.join('')}
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="this.closest('.modal').remove(); window.history.replaceState({}, document.title, window.location.pathname);" style="background: rgba(255, 255, 255, 0.9); color: #d14747; border: 1px solid rgba(209, 71, 71, 0.3); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.3s ease; backdrop-filter: blur(8px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);" onmouseover="this.style.background='rgba(255, 255, 255, 1)'; this.style.color='#b83838'; this.style.borderColor='rgba(209, 71, 71, 0.5)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.color='#d14747'; this.style.borderColor='rgba(209, 71, 71, 0.3)'; this.style.transform=''; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.15)';">
            Explore the Map
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Function to clean up modal and marker
  function cleanup() {
    if (tempMarker) {
      tempMarker.remove();
    }
    modal.remove();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Update close button to use cleanup function
  const closeBtn = modal.querySelector('.close');
  closeBtn.onclick = cleanup;
  
  const exploreBtn = modal.querySelector('button');
  exploreBtn.onclick = cleanup;
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      cleanup();
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

        const shareUrl = generateShareUrl(featureId, properties.title, properties.description, imageThen, imageNow, coordinates);
        
        const content = `
          <div id="info-panel-text">
            <h3>${properties.title || "No title"}</h3>
            <h3>${properties.description || "No date"}</h3>
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
function generateShareUrl(featureId, title, description, imageThen, imageNow, coordinates) {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    point: featureId || 'unknown',
    title: title || 'Montreal Then & Now',
    ...(description && { description }),
    ...(imageThen && { imageThen }),
    ...(imageNow && { imageNow }),
    ...(coordinates && { 
      lat: coordinates[1].toFixed(6), 
      lng: coordinates[0].toFixed(6) 
    })
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
          </div>
          <div class="share-buttons-single">
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


// Share via Facebook
function shareViaFacebook() {
  const { shareUrl } = window.currentShareData;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
}
