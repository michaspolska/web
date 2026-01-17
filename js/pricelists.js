async function saveCustomerPricelist(cardEl, customer) {
  const customerId   = customer.id;
  const customerName = customer.name;

  // proste okna do nazwy i daty cennika
  const name = prompt("Nazwa cennika dla " + customerName + ":", "Cennik " + customerName);
  if (!name) return;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const validFrom = prompt("Data obowiązywania (YYYY-MM-DD):", today);
  if (!validFrom) return;

  const rows  = cardEl.querySelectorAll(".products-table tbody tr");
  const items = [];

  const parsePLN = (txt) => {
    if (!txt) return null;
    txt = txt
      .replace(/\s*zł\s*$/i, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const v = parseFloat(txt);
    return Number.isNaN(v) ? null : v;
  };

  rows.forEach(tr => {
    if (tr.querySelector("td[colspan]")) return; // wiersz "Brak produktów..."

    const nameTd  = tr.querySelector("td:first-child");
    const netTd   = tr.querySelector(".price-cell");
    const grossTd = tr.querySelector(".price-gross-cell");
    if (!nameTd) return;

    const prodName  = nameTd.textContent.trim();
    const netText   = netTd   ? netTd.textContent.trim()   : "";
    const grossText = grossTd ? grossTd.textContent.trim() : "";

    const priceNet   = netText   && netText !== "-"   ? parsePLN(netText)   : null;
    const priceGross = grossText && grossText !== "-" ? parsePLN(grossText) : null;

    items.push({
      product_name: prodName,
      price_net:   priceNet,
      price_gross: priceGross
    });
  });

  if (items.length === 0) {
    alert("Ten odbiorca nie ma żadnych pozycji w cenniku.");
    return;
  }

  const payload = {
    customer_id: customerId,
    name,
    valid_from: validFrom,
    items
  };

  console.log("Saving pricelist for customer:", payload);

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_SAVE_PRICELIST, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      alert("Błąd zapisu cennika: " + (data.error || ("HTTP " + resp.status)));
      return;
    }

    alert("Cennik dla " + customerName + " zapisany.");
  } catch (e) {
    console.error(e);
    alert("Błąd połączenia przy zapisie cennika.");
  }
}
// config.js:
// const API_PRICE_LISTS = BASE_URL + "/price_lists.pl";
// const API_PUBLIC_PL   = BASE_URL + "/public_pricelists.pl";

async function initPricelistsTab() {
  const btn = document.getElementById('createPriceListBtn');
  if (!btn) return; // jesteśmy na innym ekranie

  btn.addEventListener('click', createPriceList);
  document.getElementById('addItemRowBtn').addEventListener('click', addItemRow);
  document.getElementById('saveItemsBtn').addEventListener('click', saveItems);
  document.getElementById('generateLinkBtn').addEventListener('click', generateShareLink);
  document.getElementById('copyShareLinkBtn').addEventListener('click', copyShareLink);

  await loadPriceLists();
}

async function createPriceList() {
  const name = document.getElementById('newPriceListName').value.trim() || "Nowy cennik";

  const resp = await fetch(API_PRICE_LISTS, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!resp.ok) { alert("Błąd tworzenia cennika"); return; }
  const pl = await resp.json();
  await loadPriceLists();
  openPriceListEditor(pl.id, pl.name);
}

async function loadPriceLists() {
  const resp = await fetch(API_PRICE_LISTS, { credentials: 'include' });
  if (!resp.ok) return;
  const list = await resp.json();
  const container = document.getElementById('pricelistsTable');
  container.innerHTML = '';
  list.forEach(pl => {
    const row = document.createElement('div');
    row.className = 'card clickable';
    row.textContent = pl.name + (pl.is_public ? " (publiczny)" : "");
    row.addEventListener('click', () => openPriceListEditor(pl.id, pl.name));
    container.appendChild(row);
  });
}

async function openPriceListEditor(id, name) {
  const editor = document.getElementById('pricelistEditor');
  editor.classList.remove('hidden');
  document.getElementById('pricelistShare').classList.add('hidden');
  document.getElementById('plEditorTitle').textContent = name;
  const table = document.getElementById('plItemsTable');
  table.dataset.plId = id;

  // TODO: opcjonalnie GET /api/price-lists/:id i wypełnienie istniejących pozycji
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  addItemRow(); // startowa pusta linia
}

function addItemRow() {
  const table = document.getElementById('plItemsTable');
  const tbody = table.querySelector('tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="pl-item-name"></td>
    <td><input type="number" step="0.01" class="pl-item-price"></td>
    <td><input type="text" value="PLN" class="pl-item-currency"></td>
    <td><input type="text" class="pl-item-desc"></td>
    <td><button class="outline btn-del-row">X</button></td>
  `;
  tr.querySelector('.btn-del-row').addEventListener('click', () => tr.remove());
  tbody.appendChild(tr);
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
      item_name: name,
      price_value: parseFloat(tr.querySelector('.pl-item-price').value) || 0,
      currency: tr.querySelector('.pl-item-currency').value || 'PLN',
      description: tr.querySelector('.pl-item-desc').value || null
    });
  });

  const resp = await fetch(API_PRICE_LISTS + "/" + plId + "/items", {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });

  if (!resp.ok) { alert("Błąd zapisu pozycji"); return; }
  alert("Pozycje zapisane");
}

async function generateShareLink() {
  const table = document.getElementById('plItemsTable');
  const plId = table.dataset.plId;
  if (!plId) return;

  const resp = await fetch(API_PRICE_LISTS + "/" + plId + "/generate-link", {
    method: 'POST',
    credentials: 'include'
  });
  if (!resp.ok) { alert("Błąd generowania linku"); return; }
  const data = await resp.json();
  document.getElementById('shareLinkInput').value = data.public_url;
  document.getElementById('pricelistShare').classList.remove('hidden');
}

function copyShareLink() {
  const input = document.getElementById('shareLinkInput');
  input.select();
  document.execCommand('copy');
  alert("Link skopiowany");
}

// uruchomienie po załadowaniu strony
document.addEventListener('DOMContentLoaded', initPricelistsTab);

