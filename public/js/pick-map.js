// Address -> map pin picker used on the "list your place" form.
// Uses Leaflet + OpenStreetMap tiles (free, no API key) and the free
// Nominatim geocoding API to turn a typed address into a starting pin,
// which the owner can then drag to the exact spot.
(function () {
  const BUDAPEST_CENTER = [47.4979, 19.0402];

  const map = L.map('pickMap').setView(BUDAPEST_CENTER, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  let marker = null;
  const latInput = document.getElementById('latInput');
  const lngInput = document.getElementById('lngInput');

  function setMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        latInput.value = pos.lat;
        lngInput.value = pos.lng;
      });
    }
    latInput.value = lat;
    lngInput.value = lng;
    map.setView([lat, lng], 16);
  }

  // Restore previous pin if the form was re-rendered after a validation error.
  if (latInput.value && lngInput.value) {
    setMarker(parseFloat(latInput.value), parseFloat(lngInput.value));
  }

  map.on('click', (e) => setMarker(e.latlng.lat, e.latlng.lng));

  document.getElementById('locateBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    if (!address) {
      alert('Type a street address first.');
      return;
    }
    const query = encodeURIComponent(`${address}, Budapest, Hungary`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await res.json();
      if (data && data[0]) {
        setMarker(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        alert('Could not find that address automatically — click on the map to place the pin manually.');
      }
    } catch (err) {
      alert('Could not reach the map service — click on the map to place the pin manually.');
    }
  });
})();
