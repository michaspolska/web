function createCustomerCard(customer) {
  const card = document.createElement("div");
  card.className = "supplier-card";
  card.dataset.type = "customer";
  card.dataset.customerId = customer.id;

  const header = document.createElement("div");
  header.className = "supplier-header";

  const nameEl = document.createElement("div");
  nameEl.className = "supplier-name";
  nameEl.textContent = customer.name;

  const headerBtns = document.createElement("div");
  headerBtns.className = "supplier-header-buttons";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "danger";
  deleteBtn.textContent = "Usuń odbiorcę";
  deleteBtn.addEventListener("click", () => deleteCustomer(customer.id));

  headerBtns.appendChild(deleteBtn);
  header.appendChild(nameEl);
  header.appendChild(headerBtns);

  const addRow = document.createElement("div");
  addRow.className = "supplier-add-product";

  const datalistId = `products-lowest-list-${customer.id}`;

  let optionsHtml = "";
  LOWEST_PRICES.forEach((info, name) => {
    optionsHtml += `<option value="${name}"
                         data-unit="${info.unit}"
                         data-price="${info.price}">${name}</option>`;
  });

  addRow.innerHTML = `
    <input list="${datalistId}" class="cust-prod-name" placeholder="Wybierz produkt">
    <datalist id="${datalistId}">
      ${optionsHtml}
    </datalist>
    <input type="number" step="0.01" min="0" class="cust-price-net" placeholder="Cena netto" readonly>
    <button type="button" class="primary btn-add-cust-product">+ Dodaj produkt</button>
  `;

  const nameInput = addRow.querySelector(".cust-prod-name");
  const unitSelect = addRow.querySelector(".cust-prod-unit");
  const priceInput = addRow.querySelector(".cust-price-net");

  nameInput.addEventListener("input", () => {
    const val = nameInput.value.trim();
    const entry = LOWEST_PRICES.get(val);
    if (!entry) return;
    unitSelect.value = entry.unit || "szt";
    priceInput.value = entry.price;
  });

  const addBtn = addRow.querySelector(".btn-add-cust-product");
  addBtn.addEventListener("click", () => addProductForCustomer(card, customer.id));

  const tableWrap = document.createElement("div");
  tableWrap.className = "products-table-wrapper";

  const table = document.createElement("table");
  table.className = "products-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Produkt</th>
        <th>Cena netto (najniższa)</th>
        <th>Cena brutto</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  if (Array.isArray(customer.products) && customer.products.length > 0) {
    for (const p of customer.products) {
      const entry = LOWEST_PRICES.get(p.name) || { unit: p.unit, price: null };
      const tr = document.createElement("tr");
      tr.dataset.customerId = customer.id;
      tr.dataset.productId = p.product_id;
      tr.innerHTML = `
        <td>${p.name}</td>
        <td class="price-cell">${entry.price != null ? formatPLN(entry.price) : "-"}</td>
        <td class="price-gross-cell">${p.price_gross != null ? formatPLN(p.price_gross) : "-"}</td>
        <td><button type="button" class="danger btn-del-cust-product">Usuń</button></td>
        `;
      tr.querySelector(".btn-del-cust-product")
        .addEventListener("click", () => deleteCustomerProductRow(tr));
      tbody.appendChild(tr);
    }
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">Brak produktów w cenniku odbiorcy.</td>`;
    tbody.appendChild(tr);
  }

  tableWrap.appendChild(table);
  card.appendChild(header);
  card.appendChild(addRow);
  card.appendChild(tableWrap);
  return card;
}

async function loadCustomers() {
  const container = document.getElementById("customersContainer");
  container.innerHTML = "<p class='info'>Ładowanie odbiorców...</p>";

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_CUSTOMERS_URL, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": csrf
      }
    });

    if (!resp.ok) {
      container.innerHTML = "<p class='info'>Błąd ładowania odbiorców.</p>";
      return;
    }

    const data = await resp.json();
    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p class='info'>Brak odbiorców.</p>";
      return;
    }

    for (const c of data) {
      const card = createCustomerCard(c);
      container.appendChild(card);
    }

    refreshAllDatalists();
  } catch (e) {
    container.innerHTML = "<p class='info'>Błąd połączenia.</p>";
  }
}

async function addCustomer() {
  const input = document.getElementById('newCustomerName');
  const name = input.value.trim();
  const errorBox = document.getElementById('error');

  if (errorBox) errorBox.textContent = '';
  if (!name) {
    if (errorBox) errorBox.textContent = 'Podaj nazwę odbiorcy.';
    return;
  }

  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_ADD_CUSTOMER, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
      },
      body: JSON.stringify({ name })
    });

    if (!resp.ok) {
      if (errorBox) errorBox.textContent = 'Błąd dodawania odbiorcy.';
      return;
    }
    const data = await resp.json();
    if (!data.ok) {
      if (errorBox) errorBox.textContent = 'Błąd dodawania odbiorcy.';
      return;
    }

    input.value = '';
    if (errorBox) errorBox.textContent = '';
    await loadCustomers();
  } catch (e) {
    if (errorBox) errorBox.textContent = 'Błąd połączenia.';
  }
}

async function addProductForCustomer(cardEl, customerId) {  // przerób na async
  const nameInput = cardEl.querySelector(".cust-prod-name");
  const name = (nameInput.value || "").trim();
  if (!name) return alert('Wybierz produkt');

  const csrf = getCsrfToken();
  const payload = {  // debug
    customer_id: customerId.toString(),
    product_name: name
  };
  console.log('Sending to add_customer_product.pl:', payload);  // <<-- DEBUG

  try {
    const resp = await fetch(API_ADD_CUSTOMER_PRODUCT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', resp.status, 'ok:', resp.ok);  // <<-- DEBUG
    const data = await resp.json();
    console.log('Full response:', data);  // <<-- DEBUG

    if (!resp.ok || !data.ok) {
      alert(`Błąd: ${data.error || 'HTTP ' + resp.status} ${data.msg || ''}`);
      return;
    }

    const p = data.product;
    const tbody = cardEl.querySelector(".products-table tbody");
    const tr = document.createElement("tr");
    tr.dataset.customerId = customerId;
    tr.dataset.productName = p.name;  // <<-- do delete po nazwie (jak add)
    tr.innerHTML = `
      <td>${p.name}</td>
      <td class="price-cell">${formatPLN(p.price_net)}</td>
      <td class="price-gross-cell">${formatPLN(p.price_gross)}</td>
      <td><button type="button" class="danger btn-del-cust-product">Usuń</button></td>
    `;
    tr.querySelector(".btn-del-cust-product")
      .addEventListener("click", () => deleteCustomerProductRow(tr));

    if (tbody.children.length === 1 && tbody.children[0].querySelector("td[colspan]")) {
      tbody.innerHTML = "";
    }
    tbody.appendChild(tr);

    nameInput.value = "";
    alert(`Dodano: ${p.name} ${formatPLN(p.price_gross)}`);
  } catch (e) {
    console.error('Fetch error:', e);
    alert('Błąd połączenia');
  }
}

async function deleteCustomerProductRow(tr) {
  const customerId = tr.dataset.customerId;
  const productName = tr.dataset.productName || tr.querySelector('td:first-child').textContent.trim();  // fallback
  if (!customerId || !productName) {
    tr.remove();
    return alert('Brak danych do usunięcia');
  }
  if (!confirm(`Usunąć "${productName}" z odbiorcy?`)) return;

  const csrf = getCsrfToken();
  console.log('Deleting:', {customer_id: customerId, product_name: productName});  // debug

  try {
    const resp = await fetch(API_DEL_CUSTOMER_PRODUCT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify({
        customer_id: customerId,
        product_name: productName  // po nazwie (jak add)
      })
    });

    const data = await resp.json();
    console.log('Delete response:', data);

    if (!resp.ok || !data.ok) {
      alert(`Błąd usuwania: ${data.error || resp.status}`);
      return;
    }

    const tbody = tr.parentElement;
    tr.remove();
    if (tbody.children.length === 0) {
      const emptyTr = document.createElement("tr");
      emptyTr.innerHTML = `<td colspan="4">Brak produktów w cenniku odbiorcy.</td>`;
      tbody.appendChild(emptyTr);
    }
  } catch (e) {
    console.error(e);
    alert('Błąd połączenia');
  }
}


async function deleteCustomer(id) {
  if (!confirm("Usunąć odbiorcę wraz z jego cennikiem?")) return;
  const csrf = getCsrfToken();

  try {
    const resp = await fetch(API_DELETE_CUSTOMER, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf
      },
      body: JSON.stringify({ customer_id: id })
    });

    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.ok) return;

    await loadCustomers();
  } catch (e) {}
}
