mapboxgl.accessToken =
  "pk.eyJ1IjoibW9udHJlYWx0aGVuYW5kbm93IiwiYSI6ImNsemE0b2Q3MTAxNnIycm9va2UxNHE5MTAifQ.xzpBb9fHCoJ03Yu7YZm5aw";

const adminMap = new mapboxgl.Map({
  container: "admin-map",
  style: "mapbox://styles/montrealthenandnow/clevx8q00000901o4q8dsipxd",
  center: [-73.57731, 45.50022],
  zoom: 12.76,
});

let tempMarker = null;
let pointsData = [];

// Update point counter display
function updatePointCounter() {
  const counterElement = document.getElementById("point-count");
  if (counterElement) {
    counterElement.textContent = pointsData.length;
  }
  
  // Update points list
  const pointsList = document.getElementById("points-list");
  const pointsListItems = document.getElementById("points-list-items");
  
  if (pointsData.length > 0) {
    pointsList.style.display = "block";
    pointsListItems.innerHTML = pointsData
      .map((point, index) => 
        `<li><strong>${index + 1}.</strong> ${point.properties.title || 'Untitled'} 
         (${point.geometry.coordinates[1].toFixed(4)}, ${point.geometry.coordinates[0].toFixed(4)})</li>`
      )
      .join('');
  } else {
    pointsList.style.display = "none";
  }
}

// Initialize admin interface
adminMap.on("load", function () {
  // Click on map to set coordinates
  adminMap.on("click", function (e) {
    const coords = e.lngLat;

    // Update form inputs
    document.getElementById("longitude").value = coords.lng.toFixed(6);
    document.getElementById("latitude").value = coords.lat.toFixed(6);

    // Remove existing temp marker
    if (tempMarker) {
      tempMarker.remove();
    }

    // Add temporary marker
    const markerElement = document.createElement("div");
    markerElement.className = "temp-marker";

    tempMarker = new mapboxgl.Marker(markerElement)
      .setLngLat([coords.lng, coords.lat])
      .addTo(adminMap);
  });
});

// File upload handling
function setupFileUpload(dropZoneId, inputId, previewId) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  // Click to select file
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    handleFileSelect(e.target.files[0], preview);
  });

  // Drag and drop
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect(files[0], preview);
    }
  });
}

function handleFileSelect(file, previewElement) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }

  // Generate human-readable filename
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const fileExtension = file.name.split(".").pop().toLowerCase();
  
  // Clean the original filename - keep alphanumeric and common punctuation
  const cleanName = file.name
    .replace(`.${file.name.split(".").pop()}`, '') // remove extension
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // keep letters, numbers, spaces, dashes, underscores
    .replace(/\s+/g, '-') // replace spaces with dashes
    .toLowerCase()
    .substring(0, 30); // limit length
  
  const uniqueFilename = `${dateStr}_${timeStr}_${cleanName}.${fileExtension}`;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewElement.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <span class="filename">${file.name}</span>
        `;

    // Show GitHub upload instructions
    const instructionsId = previewElement.id.replace(
      "preview",
      "github-instructions"
    );
    const instructionsElement = document.getElementById(instructionsId);

    if (instructionsElement) {
      const githubUser =
        document.getElementById("github-user").value || "your-username";
      const githubRepo =
        document.getElementById("github-repo").value || "your-repo";
      const githubBranch =
        document.getElementById("github-branch").value || "main";

      const githubUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/images/${uniqueFilename}`;

      instructionsElement.innerHTML = `
                <strong>📝 GitHub Upload Instructions:</strong><br>
                1. Save this image as: <code>${uniqueFilename}</code> 
                <button class="copy-filename" onclick="copyToClipboard('${uniqueFilename}')">Copy</button><br>
                2. Upload to your GitHub repo in the <code>/images/</code> folder<br>
                3. The generated URL will be: <br>
                <code style="word-break: break-all;">${githubUrl}</code>
                <button class="copy-filename" onclick="copyToClipboard('${githubUrl}')">Copy URL</button>
            `;
      instructionsElement.classList.add("show");
    }
  };
  reader.readAsDataURL(file);

  // Store the unique filename for later use
  previewElement.dataset.filename = uniqueFilename;
}

// Initialize file uploads
setupFileUpload("drop-zone-then", "image-then", "preview-then");
setupFileUpload("drop-zone-now", "image-now", "preview-now");

// Address geocoding functionality
document.getElementById("geocode-btn").addEventListener("click", async () => {
  const address = document.getElementById("address").value.trim();
  if (!address) {
    alert("Please enter an address");
    return;
  }

  const geocodeBtn = document.getElementById("geocode-btn");
  geocodeBtn.disabled = true;
  geocodeBtn.textContent = "Loading...";

  try {
    // Use Mapbox Geocoding API
    const query = encodeURIComponent(`${address}, Montreal, Quebec, Canada`);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}&country=CA&proximity=-73.57731,45.50022&bbox=-74.2591,45.1000,-73.1986,45.9000`
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].center;
      const longitude = coordinates[0];
      const latitude = coordinates[1];

      // Update form inputs
      document.getElementById("longitude").value = longitude.toFixed(6);
      document.getElementById("latitude").value = latitude.toFixed(6);

      // Remove existing temp marker
      if (tempMarker) {
        tempMarker.remove();
      }

      // Add temporary marker
      const markerElement = document.createElement("div");
      markerElement.className = "temp-marker";

      tempMarker = new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .addTo(adminMap);

      // Center map on the location
      adminMap.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 1000,
      });

      alert(`Address found: ${data.features[0].place_name}`);
    } else {
      alert(
        "Address not found. Please try a different address or enter coordinates manually."
      );
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    alert(
      "Error finding address. Please try again or enter coordinates manually."
    );
  } finally {
    geocodeBtn.disabled = false;
    geocodeBtn.textContent = "Get Coordinates";
  }
});

// Allow Enter key to trigger geocoding
document.getElementById("address").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("geocode-btn").click();
  }
});

// Form submission
document.getElementById("point-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const longitude = parseFloat(formData.get("longitude"));
  const latitude = parseFloat(formData.get("latitude"));

  if (isNaN(longitude) || isNaN(latitude)) {
    alert("Please enter valid coordinates or click on the map");
    return;
  }

  // Process images and create point data
  const imageThenFile = document.getElementById("image-then").files[0];
  const imageNowFile = document.getElementById("image-now").files[0];
  const isInvisibleLayer = document.getElementById("invisible-layer").checked;

  // Get GitHub configuration
  const githubUser =
    document.getElementById("github-user").value || "your-username";
  const githubRepo =
    document.getElementById("github-repo").value || "your-repo";
  const githubBranch = document.getElementById("github-branch").value || "main";

  // Generate GitHub raw URLs using stored filenames
  const imageThenPath = imageThenFile
    ? `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/images/${
        document.getElementById("preview-then").dataset.filename
      }`
    : null;
  const imageNowPath = imageNowFile
    ? `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/images/${
        document.getElementById("preview-now").dataset.filename
      }`
    : null;

  const pointData = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      title: formData.get("title"),
      description: formData.get("description"),
      imageThen: imageThenPath,
      imageNow: imageNowPath,
      layer: isInvisibleLayer ? "mtlinvisible" : "Points",
    },
  };

  // Add to points array
  pointsData.push(pointData);
  
  // Debug logging
  console.log(`Point added! Total points: ${pointsData.length}`);
  console.log('Current pointsData:', pointsData);

  // Update point counter
  updatePointCounter();

  // Clear form
  e.target.reset();
  document.getElementById("preview-then").innerHTML = "";
  document.getElementById("preview-now").innerHTML = "";
  document.getElementById("github-instructions-then").classList.remove("show");
  document.getElementById("github-instructions-now").classList.remove("show");

  // Remove temp marker
  if (tempMarker) {
    tempMarker.remove();
    tempMarker = null;
  }

  alert(
    `Point added successfully! Total points: ${pointsData.length}\n\nRemember to upload your images to GitHub as instructed.`
  );

  // Show upload reminder if there were images
  if (imageThenFile || imageNowFile) {
    console.log("📝 GitHub Upload Reminder:");
    console.log("1. Save images with the generated filenames");
    console.log("2. Upload to your GitHub repo in /images/ folder");
    console.log("3. The URLs are already generated in your GeoJSON output");
  }
});

// Export functionality
document.getElementById("export-btn").addEventListener("click", () => {
  console.log(`Export triggered. Points available: ${pointsData.length}`);
  console.log('Points data at export:', pointsData);
  
  if (pointsData.length === 0) {
    alert("No points to export");
    return;
  }

  const geojson = {
    type: "FeatureCollection",
    features: pointsData,
  };

  const output = document.getElementById("output");
  output.value = JSON.stringify(geojson, null, 2);

  // Show instructions
  const instructions = `
// Instructions for updating your Mapbox dataset:
// 1. Copy the GeoJSON below OR download the file using the Download button
// 2. Go to Mapbox Studio -> Datasets
// 3. Select your dataset or create a new one
// 4. Import this GeoJSON data (copy/paste or upload file)
// 5. Update your map style to use the new dataset

`;

  output.value = instructions + output.value;
});

// Copy to clipboard
document.getElementById("copy-btn").addEventListener("click", () => {
  const output = document.getElementById("output");
  output.select();
  document.execCommand("copy");
  alert("Copied to clipboard!");
});

// Download GeoJSON file
document.getElementById("download-btn").addEventListener("click", () => {
  if (pointsData.length === 0) {
    alert("No points to download");
    return;
  }

  const geojson = {
    type: "FeatureCollection",
    features: pointsData,
  };

  const jsonString = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "montreal-map-points.geojson";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Toggle instructions visibility
document
  .getElementById("toggle-instructions")
  .addEventListener("click", function () {
    const instructions = document.querySelector(".workflow-instructions");
    const button = this;

    if (instructions.classList.contains("collapsed")) {
      instructions.classList.remove("collapsed");
      button.textContent = "Hide Instructions";
    } else {
      instructions.classList.add("collapsed");
      button.textContent = "Show Instructions";
    }
  });

// Copy to clipboard function
function copyToClipboard(text) {
  const button = event?.target;
  
  // Try modern clipboard API first (requires HTTPS)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showCopySuccess(button);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        fallbackCopyToClipboard(text, button);
      });
  } else {
    // Fallback for HTTP or older browsers
    fallbackCopyToClipboard(text, button);
  }
}

function fallbackCopyToClipboard(text, button) {
  // Create a temporary textarea element
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      showCopySuccess(button);
    } else {
      alert("Copy failed. Please select and copy manually.");
    }
  } catch (err) {
    console.error("Fallback copy failed: ", err);
    alert("Copy failed. Please select and copy manually.");
  }

  document.body.removeChild(textArea);
}

function showCopySuccess(button) {
  // Show brief success feedback
  if (!button) return;
  const originalText = button.textContent;
  button.textContent = "✓";
  button.style.background = "#28a745";
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "";
  }, 1000);
}
