async function saveCustomerPricelist(cardEl, customer) {
  const customerId = customer.id;
  const customerName = customer.name;

  // nazwa + data, można później zastąpić własnym okienkiem
  const name = prompt("Nazwa cennika dla " + customerName + ":", "Cennik " + customerName);
  if (!name) return;

  const validFrom = prompt("Data obowiązywania (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
  if (!validFrom) return;

  const rows = cardEl.querySelectorAll(".products-table tbody tr");
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
    if (tr.querySelector("td[colspan]")) return; // "Brak produktów..."

    const nameTd  = tr.querySelector("td:first-child");
    const netTd   = tr.querySelector(".price-cell");
    const grossTd = tr.querySelector(".price-gross-cell");
    if (!nameTd) return;

    const prodName = nameTd.textContent.trim();
    const netText   = netTd   ? netTd.textContent.trim()   : "";
    const grossText = grossTd ? grossTd.textContent.trim() : "";

    const priceNet   = netText   && netText !== "-"   ? parsePLN(netText)   : null;
    const priceGross = grossText && grossText !== "-" ? parsePLN(grossText) : null;

    items.push({
      product_name: prodName,
      price_net: priceNet,
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
