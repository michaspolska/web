/* API endpoints – dopasuj ścieżki do swoich skryptów Perl */
const API_SUPPLIERS_URL        = "https://a1.justmike.space/app/list_suppliers.pl";
const API_ADD_SUPPLIER         = "https://a1.justmike.space/app/add_supplier.pl";
const API_DELETE_SUPPLIER      = "https://a1.justmike.space/app/delete_supplier.pl";
const API_ADD_PRODUCT          = "https://a1.justmike.space/app/add_supplier_product.pl";
const API_DELETE_SUPPLIER_PROD = "https://a1.justmike.space/app/delete_supplier_product.pl";
const API_PRODUCTS_URL         = "https://a1.justmike.space/app/list_products.pl";
const API_LOGOUT_URL           = "https://a1.justmike.space/app/logout.pl";

const API_CUSTOMERS_URL        = "https://a1.justmike.space/app/list_customers.pl";
const API_ADD_CUSTOMER         = "https://a1.justmike.space/app/add_customer.pl";
const API_ADD_CUSTOMER_PRODUCT = "https://a1.justmike.space/app/add_customer_product.pl";
const API_DEL_CUSTOMER_PRODUCT = "https://a1.justmike.space/app/delete_customer_product.pl";
const API_DELETE_CUSTOMER      = "https://a1.justmike.space/app/delete_customer.pl";

const API_SAVE_PRICELIST       = "https://a1.justmike.space/app/save_pricelist.pl";

const API_BASE          = "https://a1.justmike.space/app";
const API_PRICE_LISTS   = API_BASE + "/odb_price_lists.pl";
const API_PUBLIC_PL     = API_BASE + "/odb_public_pricelists.pl";


const LOGIN_PAGE               = "/login.html";

/* global caches */
let MASTER_PRODUCTS = [];        // z list_products.pl
let LOWEST_PRICES   = new Map(); // produkt -> {unit, price}

function getCsrfToken() {
  return sessionStorage.getItem("csrfToken") || "";
}

function formatPLN(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

async function loadMasterProducts() {
  const csrf = getCsrfToken();
  try {
    const resp = await fetch(API_PRODUCTS_URL, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": csrf
      }
    });
    if (!resp.ok) {
      MASTER_PRODUCTS = [];
      return;
    }
    const data = await resp.json();
    MASTER_PRODUCTS = Array.isArray(data) ? data : [];
  } catch (e) {
    MASTER_PRODUCTS = [];
  }
}

/* odśwież datalisty dla dostawców i odbiorców */
function refreshAllDatalists() {
  // dostawcy – MASTER_PRODUCTS
  document.querySelectorAll(".supplier-card[data-type='supplier']").forEach(card => {
    const supplierId = card.dataset.supplierId;
    const datalistId = `products-master-list-${supplierId}`;
    const dl = document.getElementById(datalistId);
    if (!dl) return;

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
    dl.innerHTML = optionsHtml;
  });

  // odbiorcy – LOWEST_PRICES
  document.querySelectorAll(".supplier-card[data-type='customer']").forEach(card => {
    const customerId = card.dataset.customerId;
    const datalistId = `products-lowest-list-${customerId}`;
    const dl = document.getElementById(datalistId);
    if (!dl) return;

    let optionsHtml = "";
    LOWEST_PRICES.forEach((info, name) => {
      optionsHtml += `<option value="${name}"
                           data-unit="${info.unit}"
                           data-price="${info.price}">${name}</option>`;
    });
    dl.innerHTML = optionsHtml;
  });
}

/* buduje mapę najniższych cen, tabelę "Produkty" i aktualizuje cenniki */
function recomputeLowestNetPrices() {
  const productsMap = new Map(); // produkt -> {unit, prices: Map<supplierName, price>}

  document.querySelectorAll(".supplier-card[data-type='supplier']").forEach(card => {
    const supplierName = card.querySelector(".supplier-name")?.textContent || "";
    const rows = card.querySelectorAll("tbody tr");

    rows.forEach(tr => {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 3) return;

      const name  = tds[0].textContent.trim();
      const unit  = tds[1].textContent.trim();
      const netTd = tds[2];

      if (!name) return;

      const netText = netTd.textContent.trim()
        .replace(/\s/g, "")
        .replace("zł", "")
        .replace(",", ".");
      const price = parseFloat(netText);
      if (isNaN(price)) return;

      let entry = productsMap.get(name);
      if (!entry) {
        entry = { unit, prices: new Map() };
        productsMap.set(name, entry);
      }
      entry.unit = entry.unit || unit;
      entry.prices.set(supplierName, price);
    });
  });

  LOWEST_PRICES = new Map();
  productsMap.forEach((entry, name) => {
    let minPrice = Infinity;
    entry.prices.forEach(price => {
      if (price < minPrice) minPrice = price;
    });
    if (isFinite(minPrice)) {
      LOWEST_PRICES.set(name, { unit: entry.unit, price: minPrice });
    }
  });

  const suppliersSet = new Set();
  productsMap.forEach(entry => {
    entry.prices.forEach((_, sName) => suppliersSet.add(sName));
  });
  const suppliersList = Array.from(suppliersSet)
    .sort((a, b) => a.localeCompare(b, "pl"));

  const headerRow = document.getElementById("productsHeaderRow");
  const body = document.querySelector("#productsTable tbody");
  if (!headerRow || !body) return;

  headerRow.innerHTML = "<th>Produkt</th>";
  suppliersList.forEach(sName => {
    const th = document.createElement("th");
    th.textContent = sName;
    headerRow.appendChild(th);
  });

  body.innerHTML = "";
  const sortedProducts = Array.from(productsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "pl"));

  sortedProducts.forEach(([name, entry]) => {
    let minPrice = Infinity;
    entry.prices.forEach(price => {
      if (price < minPrice) minPrice = price;
    });

    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.innerHTML = `${name}<br><span style="color:#626c71;font-size:0.8rem;">${entry.unit || ""}</span>`;
    tr.appendChild(nameTd);

    suppliersList.forEach(sName => {
      const td = document.createElement("td");
      const price = entry.prices.get(sName);
      if (price != null) {
        td.textContent = formatPLN(price);
        td.classList.add("price-cell");
        if (price === minPrice) td.classList.add("cell-cheapest");
      } else {
        td.textContent = "-";
      }
      tr.appendChild(td);
    });

    body.appendChild(tr);
  });

  document.querySelectorAll(".supplier-card[data-type='supplier']").forEach(card => {
    const rows = card.querySelectorAll("tbody tr");

    rows.forEach(tr => {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 6) return;

      tds[2].classList.remove("cell-cheapest");
      const name = tds[0].textContent.trim();
      const entry = productsMap.get(name);
      if (!entry) {
        tds[5].textContent = "";
        return;
      }

      let minPrice = Infinity;
      let minSupplier = "";
      entry.prices.forEach((price, sName) => {
        if (price < minPrice) {
          minPrice = price;
          minSupplier = sName;
        }
      });

      tds[5].innerHTML = `
        ${isFinite(minPrice) ? formatPLN(minPrice) : ""}
        ${minSupplier ? `<span class="tag-supplier">(${minSupplier})</span>` : ""}
      `;

      const netText = tds[2].textContent.trim()
        .replace(/\s/g, "")
        .replace("zł", "")
        .replace(",", ".");
      const thisPrice = parseFloat(netText);
      if (!isNaN(thisPrice) && thisPrice === minPrice) {
        tds[2].classList.add("cell-cheapest");
      }
    });
  });

  refreshAllDatalists();
} 
