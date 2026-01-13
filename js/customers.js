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
    <button type="button" class="primary btn-add-cust-product">+ Dodaj produkt</button>
  `;

  const nameInput = addRow.querySelector(".cust-prod-name");

  // nie ma już unit/cena w wierszu dodawania – usuwamy ich obsługę
  /*
  const unitSelect = addRow.querySelector(".cust-prod-unit");
  const priceInput = addRow.querySelector(".cust-price-net");

  nameInput.addEventListener("input", () => {
    const val = nameInput.value.trim();
    const entry = LOWEST_PRICES.get(val);
    if (!entry) return;
    unitSelect.value = entry.unit || "szt";
    priceInput.value = entry.price;
  });
  */

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

async function addProductForCustomer(cardEl, customerId) {
  const nameInput = cardEl.querySelector(".cust-prod-name");
  const name = (nameInput.value || "").trim();
  if (!name) return alert('Wybierz produkt');

  const csrf = getCsrfToken();
  const payload = {
    customer_id: customerId.toString(),
    product_name: name
  };
  console.log('Sending to add_customer_product.pl:', payload);

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

    console.log('Response status:', resp.status, 'ok:', resp.ok);
    const data = await resp.json();
    console.log('Full response:', data);

    if (!resp.ok || !data.ok) {
      alert(`Błąd: ${data.error || 'HTTP ' + resp.status} ${data.msg || ''}`);
      return;
    }

    const p = data.product;
    const tbody = cardEl.querySelector(".products-table tbody");
    const tr = document.createElement("tr");
    tr.dataset.customerId = customerId;
    tr.dataset.productName = p.name;
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
  } catch (e) {
    console.error('Fetch error:', e);
    alert('Błąd połączenia');
  }
}
