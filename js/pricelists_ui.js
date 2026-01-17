async function createPriceList() {
  const name = document.getElementById('newPriceListName').value.trim() || "Nowy cennik";

  const resp = await fetch(API_PRICE_LISTS, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!resp.ok) {
    alert("Błąd tworzenia cennika");
    return;
  }
  const data = await resp.json();
  await loadPriceLists();
  openPriceListEditor(data.id, data.name);
}

async function loadPriceLists() {
  const resp = await fetch(API_PRICE_LISTS, { credentials: 'include' });
  if (!resp.ok) return;
  const rows = await resp.json();
  renderPriceListsTable(rows);
}

function renderPriceListsTable(rows) {
  const container = document.getElementById('pricelistsTable');
  container.innerHTML = '';
  rows.forEach(pl => {
    const row = document.createElement('div');
    row.className = 'pl-row';
    row.textContent = pl.name + " (" + (pl.is_public ? "publiczny" : "prywatny") + ")";
    row.addEventListener('click', () => openPriceListEditor(pl.id, pl.name));
    container.appendChild(row);
  });
}

async function openPriceListEditor(id, name) {
  document.getElementById('plEditorTitle').textContent = name;
  document.getElementById('pricelistEditor').classList.remove('hidden');
  document.getElementById('pricelistShare').classList.add('hidden');
  document.getElementById('plItemsTable').dataset.plId = id;

  // TODO: GET /api/price-lists/:id po szczegóły i pozycje (możesz dorobić case w price_lists.pl)
}

async function generateShareLink() {
  const table = document.getElementById('plItemsTable');
  const plId = table.dataset.plId;
  if (!plId) return;

  const resp = await fetch(API_PRICE_LISTS + "/" + plId + "/generate-link", {
    method: 'POST',
    credentials: 'include'
  });
  if (!resp.ok) {
    alert("Błąd generowania linku");
    return;
  }
  const data = await resp.json();
  const url = data.public_url;
  document.getElementById('shareLinkInput').value = url;
  document.getElementById('pricelistShare').classList.remove('hidden');
}

function copyShareLink() {
  const input = document.getElementById('shareLinkInput');
  input.select();
  document.execCommand('copy');
  alert("Skopiowano link cennika");
}

document.getElementById('createPriceListBtn').addEventListener('click', createPriceList);
document.getElementById('generateLinkBtn').addEventListener('click', generateShareLink);
document.getElementById('copyShareLinkBtn').addEventListener('click', copyShareLink);

// Wywołaj loadPriceLists() przy starcie zakładki
