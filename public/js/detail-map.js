// Shows a single read-only pin on the listing detail page.
(function () {
  const el = document.getElementById('map');
  if (!el) return;
  const lat = parseFloat(el.dataset.lat);
  const lng = parseFloat(el.dataset.lng);

  const map = L.map('map', { scrollWheelZoom: false }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);
  L.marker([lat, lng]).addTo(map);
})();
