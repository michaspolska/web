function createSupplierCard(supplier) {
  const card = document.createElement("div");
  card.className = "supplier-card";
  card.dataset.type = "supplier";
  card.dataset.supplierId = supplier.id;

  const header = document.createElement("div");
  header.className = "supplier-header";

  const nameEl = document.createElement("div");
  nameEl.className = "supplier-name";
  nameEl.textContent = supplier.name;

  const headerBtns = document.createElement("div");
  headerBtns.className = "supplier-header-buttons";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "outline";
  toggleBtn.textContent = "Zwiń cennik";
  toggleBtn.addEventListener("click", () => {
    const tableWrap = card.querySelector(".products-table-wrapper");
    const hidden = tableWrap.style.display === "none";
    tableWrap.style.display = hidden ? "block" : "none";
    toggleBtn.textContent = hidden ? "Zwiń cennik" : "Rozwiń cennik";
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "danger";
  deleteBtn.textContent = "Usuń dostawcę";
  deleteBtn.addEventListener("click", () => deleteSupplier(supplier.id));

  headerBtns.appendChild(toggleBtn);
  headerBtns.appendChild(deleteBtn);

  header.appendChild(nameEl);
  header.appendChild(headerBtns);

  const addRow = document.createElement("div");
  addRow.className = "supplier-add-product";

  const datalistId = `products-master-list-${supplier.id}`;

  let optionsHtml = "";
  for (const prod of MASTER_PRODUCTS) {
    const vatTxt = prod.vat != null && prod.vat !== "" ? prod.vat + " %" : "";
    const priceTxt = prod.price_net != null && prod.price_net !== ""
      ? formatPLN(prod.price_net)
      : "";
    let label = prod.name;
    if (vatTxt)   label += " – " + vatTxt;
    if (priceTxt) label += " – " + priceTxt;

    optionsHtml += `<option value="${prod.name}"
                           data-price="${prod.price_net ?? ""}"
                           data-vat="${prod.vat ?? ""}"
                           data-unit="${prod.unit ?? ""}">${label}</option>`;
  }

  addRow.innerHTML = `
    <input list="${datalistId}" class="prod-name" placeholder="Nazwa produktu (możesz wpisać nowy)">
    <datalist id="${datalistId}">
      ${optionsHtml}
    </datalist>
    <select class="prod-unit">
      <option value="szt">szt</option>
      <option value="kg">kg</option>
      <option value="l">l</option>
    </select>
    <input type="number" step="0.01" min="0" class="prod-price-net" placeholder="Cena netto">
    <input type="number" step="1" min="0" class="prod-vat" placeholder="VAT %" value="23">
    <button type="button" class="primary btn-add-product">+ Dodaj produkt</button>
  `;

  const nameInput  = addRow.querySelector(".prod-name");
  const netInput   = addRow.querySelector(".prod-price-net");
  const vatInput   = addRow.querySelector(".prod-vat");
  const unitSelect = addRow.querySelector(".prod-unit");

  nameInput.addEventListener("input", () => {
    const dl = document.getElementById(datalistId);
    if (!dl) return;
    const val = nameInput.value;
    const opts = dl.options;
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].value === val) {
        const p    = opts[i].getAttribute("data-price");
        const vat  = opts[i].getAttribute("data-vat");
        const unit = opts[i].getAttribute("data-unit");
        if (p !== null && p !== "")   netInput.value = p;
        if (vat !== null && vat !== "") vatInput.value = vat;
        if (unit !== null && unit !== "") unitSelect.value = unit;
        break;
      }
    }
  });

  const addBtn = addRow.querySelector(".btn-add-product");
  addBtn.addEventListener("click", () => addProductForSupplier(card, supplier.id));

  const tableWrap = document.createElement("div");
  tableWrap.className = "products-table-wrapper";

  const table = document.createElement("table");
  table.className = "products-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Produkt</th>
        <th>Jednostka</th>
        <th>Cena netto</th>
        <th>VAT %</th>
        <th>Cena brutto</th>
        <th>Najtańsza cena netto</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  if (Array.isArray(supplier.products) && supplier.products.length > 0) {
    for (const p of supplier.products) {
      const tr = document.createElement("tr");
      tr.dataset.supplierProductId = p.id;
      tr.dataset.productId = p.product_id;
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.unit || ""}</td>
        <td class="price-cell price-cell-net">${formatPLN(p.price_net)}</td>
        <td>${p.vat != null ? p.vat + " %" : ""}</td>
        <td class="price-cell">${formatPLN(p.price_gross)}</td>
        <td class="price-cell"></td>
        <td><button type="button" class="danger btn-del-product">Usuń</button></td>
      `;
      tr.querySelector(".btn-del-product")
        .addEventListener("click", () => deleteProductRow(tr));
      tbody.appendChild(tr);
    }
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7">Brak produktów w cenniku.</td>`;
    tbody.appendChild(tr);
  }

  tableWrap.appendChild(table);
  card.appendChild(header);
  card.appendChild(addRow);
  card.appendChild(tableWrap);

  return card;
}

async function loadSuppliers() {
  const errorBox  = document.getElementById("error");
  const container = document.getElementById("suppliersContainer");
  errorBox.textContent = "";
  container.innerHTML = "<p class='info'>Ładowanie cenników...</p>";

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_SUPPLIERS_URL, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": csrf
      }
    });

    if (!resp.ok) {
      container.innerHTML = "<p class='info'>Błąd ładowania dostawców.</p>";
      return;
    }

    const data = await resp.json();
    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p class='info'>Brak dostawców.</p>";
      return;
    }

    for (const s of data) {
      const card = createSupplierCard(s);
      container.appendChild(card);
    }

    recomputeLowestNetPrices();
  } catch (e) {
    container.innerHTML = "<p class='info'>Błąd połączenia.</p>";
  }
}

async function addSupplier() {
  const nameInput = document.getElementById("newSupplierName");
  const name      = nameInput.value.trim();
  const errorBox  = document.getElementById("error");

  if (!name) {
    errorBox.textContent = "Podaj nazwę dostawcy.";
    return;
  }

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_ADD_SUPPLIER, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify({ name })
    });

    if (!resp.ok) {
      errorBox.textContent = "Błąd dodawania dostawcy.";
      return;
    }

    const data = await resp.json();
    if (!data.ok) {
      errorBox.textContent = "Błąd dodawania dostawcy.";
      return;
    }

    nameInput.value = "";
    errorBox.textContent = "";
    await loadSuppliers();
    await loadCustomers();
  } catch (e) {
    errorBox.textContent = "Błąd połączenia.";
  }
}

async function addProductForSupplier(cardEl, supplierId) {
  const errorBox  = document.getElementById("error");
  const nameInput = cardEl.querySelector(".prod-name");
  const unitSel   = cardEl.querySelector(".prod-unit");
  const netInput  = cardEl.querySelector(".prod-price-net");
  const vatInput  = cardEl.querySelector(".prod-vat");

  const new_name  = (nameInput.value || "").trim();
  const unit      = unitSel.value;
  const price_net = (netInput.value || "").trim();
  const vat       = (vatInput.value || "").trim();

  if (!new_name) {
    errorBox.textContent = "Podaj nazwę produktu.";
    return;
  }
  if (!price_net) {
    errorBox.textContent = "Podaj cenę netto.";
    return;
  }

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_ADD_PRODUCT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify({
        supplier_id: supplierId,
        product_id: null,
        new_name,
        unit,
        price_net,
        vat
      })
    });

    if (!resp.ok) {
      errorBox.textContent = "Błąd dodawania produktu.";
      return;
    }

    const data = await resp.json();
    if (!data.ok) {
      errorBox.textContent = "Błąd dodawania produktu.";
      return;
    }

    if (data.master_product) {
      MASTER_PRODUCTS.push(data.master_product);
    }

    const tbody = cardEl.querySelector(".products-table tbody");
    const p = data.product;
    const tr = document.createElement("tr");
    tr.dataset.supplierProductId = p.id;
    tr.dataset.productId = p.product_id;
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.unit || ""}</td>
      <td class="price-cell price-cell-net">${formatPLN(p.price_net)}</td>
      <td>${p.vat != null ? p.vat + " %" : ""}</td>
      <td class="price-cell">${formatPLN(p.price_gross)}</td>
      <td class="price-cell"></td>
      <td><button type="button" class="danger btn-del-product">Usuń</button></td>
    `;
    tr.querySelector(".btn-del-product")
      .addEventListener("click", () => deleteProductRow(tr));

    if (tbody.children.length === 1 &&
        tbody.children[0].querySelector("td[colspan]")) {
      tbody.innerHTML = "";
    }
    tbody.appendChild(tr);

    nameInput.value  = "";
    netInput.value   = "";
    vatInput.value   = "23";
    unitSel.value    = "szt";

    recomputeLowestNetPrices();
    await loadCustomers();
    errorBox.textContent = "";
  } catch (e) {
    errorBox.textContent = "Błąd połączenia.";
  }
}

async function deleteProductRow(tr) {
  const errorBox = document.getElementById("error");
  const supplierProductId = tr.dataset.supplierProductId;

  if (!supplierProductId) {
    errorBox.textContent = "Brak ID produktu do usunięcia.";
    return;
  }
  if (!confirm("Na pewno usunąć ten produkt z cennika?")) return;

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_DELETE_SUPPLIER_PROD, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify({ supplier_product_id: supplierProductId })
    });

    if (!resp.ok) {
      errorBox.textContent = "Błąd usuwania produktu.";
      return;
    }

    const data = await resp.json();
    if (!data.ok) {
      errorBox.textContent = "Błąd usuwania produktu.";
      return;
    }

    const tbody = tr.parentElement;
    tr.remove();

    if (tbody.children.length === 0) {
      const emptyTr = document.createElement("tr");
      emptyTr.innerHTML = `<td colspan="7">Brak produktów w cenniku.</td>`;
      tbody.appendChild(emptyTr);
    }

    recomputeLowestNetPrices();
    await loadCustomers();
    errorBox.textContent = "";
  } catch (e) {
    errorBox.textContent = "Błąd połączenia.";
  }
}

async function deleteSupplier(id) {
  const errorBox = document.getElementById("error");
  const csrf = getCsrfToken();

  if (!confirm("Na pewno usunąć tego dostawcę wraz z cennikiem?")) return;

  try {
    const resp = await fetch(API_DELETE_SUPPLIER, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify({ supplier_id: id })
    });

    if (!resp.ok) {
      errorBox.textContent = "Błąd usuwania dostawcy.";
      return;
    }

    const data = await resp.json();
    if (!data.ok) {
      errorBox.textContent = "Błąd usuwania dostawcy.";
      return;
    }

    errorBox.textContent = "";
    await loadSuppliers();
    await loadCustomers();
  } catch (e) {
    errorBox.textContent = "Błąd połączenia.";
  }
}
