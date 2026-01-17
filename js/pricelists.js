async function initPricelistsTab() {
  const btn = document.getElementById('createPriceListBtn');
  console.log('initPricelistsTab: btn =', btn);
  if (!btn) return; // jeśli nie ma przycisku, jesteśmy na innym ekranie

  btn.addEventListener('click', () => {
    console.log('createPriceListBtn clicked');
    createPriceList();
  });

  document.getElementById('addItemRowBtn').addEventListener('click', addItemRow);
  document.getElementById('saveItemsBtn').addEventListener('click', saveItems);
  document.getElementById('generateLinkBtn').addEventListener('click', generateShareLink);
  document.getElementById('copyShareLinkBtn').addEventListener('click', copyShareLink);

  await loadPriceLists();
}
async function loadPublicPricelistByUrl(publicUrl) {
  if (!publicUrl) return;
  try {
    const res  = await fetch(publicUrl, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();

    console.log('public pricelist data', data);

    const box = document.getElementById('pricelistPublicPreview');
    if (!box) return;

    if (!res.ok || data.ok === false) {
      box.textContent = 'Błąd: ' + (data.error || ('HTTP ' + res.status));
      return;
    }

    box.innerHTML = `
      <h3>${data.name}</h3>
      <table class="table">
        <thead>
          <tr><th>Nazwa pozycji</th><th>Cena</th><th>Waluta</th><th>Opis</th></tr>
        </thead>
        <tbody>
          ${data.items.map(it => `
            <tr>
              <td>${it.item_name}</td>
              <td>${it.price_value}</td>
              <td>${it.currency}</td>
              <td>${it.description || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error('loadPublicPricelistByUrl error', e);
  }
}


async function saveItems() {
  const table = document.getElementById('plItemsTable');
  const plId = table.dataset.plId;
  if (!plId) { alert("Brak id cennika"); return; }

  const items = [];
  table.querySelectorAll('tbody tr').forEach(tr => {
    const name = tr.querySelector('.pl-item-name').value.trim();
    if (!name) return;
    items.push({
      item_name:   name,
      price_value: parseFloat(tr.querySelector('.pl-item-price').value) || 0,
      currency:    tr.querySelector('.pl-item-currency').value || 'PLN',
      description: tr.querySelector('.pl-item-desc').value || ''
    });
  });

  if (items.length === 0) {
    alert("Dodaj przynajmniej jedną pozycję");
    return;
  }

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(`${API_PRICE_LISTS}/${plId}/items`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
      },
      body: JSON.stringify({ items })
    });

    let data;
    try { data = await resp.json(); } catch { data = {}; }

    if (!resp.ok || data.ok === false) {
      console.error('saveItems error', resp.status, data);
      alert("Błąd zapisu pozycji: " + (data.error || ("HTTP " + resp.status)));
      return;
    }

    alert(`Zapisano ${data.inserted || items.length} pozycji`);
  } catch (e) {
    console.error('saveItems fetch error', e);
    alert("Błąd połączenia przy zapisie pozycji.");
  }
}

async function generateShareLink() {
  const table = document.getElementById('plItemsTable');
  const plId = table.dataset.plId;
  if (!plId) { alert("Brak id cennika"); return; }

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(`${API_PRICE_LISTS}/${plId}/generate-link`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': csrf
      }
    });

    let data;
    try { data = await resp.json(); } catch { data = {}; }

    if (!resp.ok || data.ok === false) {
      console.error('generateShareLink error', resp.status, data);
      alert("Błąd generowania linku: " + (data.error || ("HTTP " + resp.status)));
      return;
    }

    document.getElementById('shareLinkInput').value = data.public_url;
    document.getElementById('pricelistShare').classList.remove('hidden');
  } catch (e) {
    console.error('generateShareLink fetch error', e);
    alert("Błąd połączenia przy generowaniu linku.");
  }
}

async function createPriceList() {
  const name = document.getElementById('newPriceListName').value.trim() || "Nowy cennik";
  if (!name) return;

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_PRICE_LISTS, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
      },
      body: JSON.stringify({ name })
    });

    let data;
    try { data = await resp.json(); } catch { data = {}; }

    if (!resp.ok || data.ok === false) {
      console.error('createPriceList error', resp.status, data);
      alert("Błąd tworzenia cennika: " + (data.error || ("HTTP " + resp.status)));
      return;
    }

    await loadPriceLists();
    openPriceListEditor(data.id, data.name);
  } catch (e) {
    console.error('createPriceList fetch error', e);
    alert("Błąd połączenia przy tworzeniu cennika.");
  }
}
