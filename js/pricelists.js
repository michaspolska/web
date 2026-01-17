// zbieranie cennika odbiorców + zapis
async function saveCustomersPricelist() {
  const nameInput = document.getElementById("pricelistName");
  const dateInput = document.getElementById("pricelistDate");
  const errorBox  = document.getElementById("error");

  if (errorBox) errorBox.textContent = "";

  const name = (nameInput?.value || "").trim();
  const validFrom = (dateInput?.value || "").trim(); // YYYY-MM-DD

  if (!name) {
    if (errorBox) errorBox.textContent = "Podaj nazwę cennika.";
    else alert("Podaj nazwę cennika.");
    return;
  }
  if (!validFrom) {
    if (errorBox) errorBox.textContent = "Podaj datę obowiązywania cennika.";
    else alert("Podaj datę obowiązywania cennika.");
    return;
  }

  // wszystkie karty odbiorców
  const cards = document.querySelectorAll(".supplier-card[data-type='customer']");
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

  cards.forEach(card => {
    const customerId = card.dataset.customerId;
    const rows = card.querySelectorAll(".products-table tbody tr");

    rows.forEach(tr => {
      // pomiń wiersz "Brak produktów..."
      if (tr.querySelector("td[colspan]")) return;

      const nameTd  = tr.querySelector("td:first-child");
      const netTd   = tr.querySelector(".price-cell");
      const grossTd = tr.querySelector(".price-gross-cell");
      if (!nameTd) return;

      const productName = nameTd.textContent.trim();
      const netText   = netTd   ? netTd.textContent.trim()   : "";
      const grossText = grossTd ? grossTd.textContent.trim() : "";

      const priceNet   = netText   && netText !== "-"   ? parsePLN(netText)   : null;
      const priceGross = grossText && grossText !== "-" ? parsePLN(grossText) : null;

      items.push({
        customer_id: customerId,
        product_name: productName,
        price_net: priceNet,
        price_gross: priceGross
      });
    });
  });

  if (items.length === 0) {
    if (!confirm("Brak pozycji w cenniku. Zapisać pusty cennik?")) return;
  }

  const payload = {
    name,
    valid_from: validFrom,
    items
  };

  console.log("Saving customers pricelist:", payload);

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
      const msg = data.error || `HTTP ${resp.status}`;
      if (errorBox) errorBox.textContent = `Błąd zapisu cennika: ${msg}`;
      else alert(`Błąd zapisu cennika: ${msg}`);
      return;
    }

    if (errorBox) errorBox.textContent = "";
    alert("Cennik odbiorców zapisany.");
    // opcjonalnie: czyścić pola
    // nameInput.value = "";
    // dateInput.value = "";
  } catch (e) {
    console.error(e);
    if (errorBox) errorBox.textContent = "Błąd połączenia przy zapisie cennika.";
    else alert("Błąd połączenia przy zapisie cennika.");
  }
}
