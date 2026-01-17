// config.js - DODAJ:
const API_PRICE_LISTS = BASE_URL + "/odb_price_lists.pl";  // ← nazwa pliku!

// saveItems() - DODAJ CSRF:
async function saveItems() {
  const table = document.getElementById('plItemsTable');
  const plId = table.dataset.plId;
  if (!plId) { alert("Brak id cennika"); return; }

  const items = [];
  table.querySelectorAll('tbody tr').forEach(tr => {
    const name = tr.querySelector('.pl-item-name').value.trim();
    if (!name) return;
    items.push({
      item_name: name,
      price_value: parseFloat(tr.querySelector('.pl-item-price').value) || 0,
      currency: tr.querySelector('.pl-item-currency').value || 'PLN',
      description: tr.querySelector('.pl-item-desc').value || ''
    });
  });

  if (items.length === 0) { alert("Dodaj przynajmniej jedną pozycję"); return; }

  const csrf = getCsrfToken();  // ← CSRF!
  
  const resp = await fetch(`${API_PRICE_LISTS}/${plId}/items`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf  // ← CSRF header
    },
    body: JSON.stringify({ items })
  });

  const data = await resp.json();
  if (!resp.ok || !data.ok) {
    alert("Błąd: " + (data.error || resp.status));
    return;
  }
  alert(`Zapisano ${data.inserted} pozycji`);
}

// generateShareLink() - DODAJ CSRF:
async function generateShareLink() {
  const table = document.getElementById('plItemsTable');
  const plId = table.dataset.plId;
  if (!plId) return;

  const csrf = getCsrfToken();
  
  const resp = await fetch(`${API_PRICE_LISTS}/${plId}/generate-link`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrf }
  });

  const data = await resp.json();
  if (!resp.ok || !data.ok) {
    alert("Błąd: " + (data.error || resp.status));
    return;
  }
  
  document.getElementById('shareLinkInput').value = data.public_url;
  document.getElementById('pricelistShare').classList.remove('hidden');
}

// createPriceList() - DODAJ CSRF:
async function createPriceList() {
  const name = document.getElementById('newPriceListName').value.trim() || "Nowy cennik";
  if (!name) return;

  const csrf = getCsrfToken();
  
  const resp = await fetch(API_PRICE_LISTS, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf
    },
    body: JSON.stringify({ name })
  });

  const data = await resp.json();
  if (!resp.ok || !data.ok) {
    alert("Błąd: " + (data.error || resp.status));
    return;
  }
  
  await loadPriceLists();
  openPriceListEditor(data.id, data.name);
}
