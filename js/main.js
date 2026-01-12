async function doLogout() {
  const csrf = getCsrfToken();
  try {
    await fetch(API_LOGOUT_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": csrf
      }
    });
  } catch (_) {}
  sessionStorage.removeItem("csrfToken");
  window.location.href = LOGIN_PAGE;
}

/* zakładki */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  const tabId = btn.dataset.tab;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.classList.toggle("active", p.id === tabId);
  });
});

/* filtrowanie tabeli produktów */
document.getElementById("productsSearch").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const rows = document.querySelectorAll("#productsTable tbody tr");
  rows.forEach(row => {
    const nameCell = row.querySelector("td");
    if (!nameCell) return;
    const text = nameCell.textContent.toLowerCase();
    row.style.display = text.includes(q) ? "" : "none";
  });
});

document.getElementById("reloadBtn").addEventListener("click", async () => {
  await loadMasterProducts();
  await loadSuppliers();
  await loadCustomers();
});

document.getElementById("addSupplierBtn").addEventListener("click", addSupplier);
document.getElementById("addCustomerBtn").addEventListener("click", addCustomer);
document.getElementById("logoutBtn").addEventListener("click", doLogout);

window.addEventListener("load", async () => {
  await loadMasterProducts();
  await loadSuppliers();
  recomputeLowestNetPrices();
  await loadCustomers();
});
