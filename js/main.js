async function doLogout() {
  console.log('Logout started'); // Debug
  const csrf = getCsrfToken();
  if (!csrf) {
    console.warn('No CSRF token');
    gotoLogin();
    return;
  }
  try {
    const response = await fetch(API_LOGOUT_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": csrf
      }
    });
    if (!response.ok) {
      console.warn('Logout fetch failed:', response.status);
    }
  } catch (error) {
    console.error('Logout error:', error); // Pokazuje w konsoli
  }
  sessionStorage.clear(); // Pełny clear zamiast removeItem jednego klucza [web:32]
  gotoLogin();
}

function gotoLogin() {
  window.location.href = LOGIN_PAGE;
}

// reszta bez zmian: zakładki, search, reload, addSupplier, addCustomer...

document.getElementById("logoutBtn").addEventListener("click", doLogout); // Bez async wrappera

window.addEventListener("load", async () => {
  await loadMasterProducts();
  await loadSuppliers();
  recomputeLowestNetPrices();
  await loadCustomers();
});
