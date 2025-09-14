document.addEventListener('DOMContentLoaded', () => {
  // --- KONFIGURACJA API ---
  // WKLEJ TUTAJ SWOJE PRAWDZIWE DANE Z JSONBIN.IO
  const BIN_ID = '68962041203a8b52b5e1f16c'; 
  const API_KEY = '$2a$10$.WL0zgeBXmqg10jJp78WAOtWRN8gZE1BK7z5yrlNYdJVLydL8GTBq';
  const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  // --- Elementy strony ---
  const cardsContainer = document.getElementById('cards');
  const searchInput = document.getElementById('searchInput');
  const arrowLeft = document.getElementById('arrowLeft');
  const arrowRight = document.getElementById('arrowRight');

  // Sprawdzamy, czy jesteśmy na stronie z kartami, aby uniknąć błędów
  if (cardsContainer) {
    const allCards = Array.from(cardsContainer.children);

    // --- LOGIKA ZAPISYWANIA KLIKNIĘĆ (PRZEZ JSONBIN.IO API) ---
    allCards.forEach(card => {
      const readMoreLink = card.querySelector('.read-more');
      if (readMoreLink) {
        readMoreLink.addEventListener('click', async (e) => {
          e.preventDefault(); 
          const title = card.querySelector('h2').textContent.trim();

          try {
            // 1. Pobierz aktualne statystyki z bina (dodajemy klucz do odczytu prywatnego bina)
            let response = await fetch(`${BIN_URL}/latest`, {
              headers: { 'X-Master-Key': API_KEY }
            });

            let stats = {};
            if (response.status === 404) {
              console.log("Bin jest pusty. Tworzę nową strukturę.");
              stats = {}; // Jeśli bin jest pusty, zaczynamy od zera
            } else if (response.ok) {
              const data = await response.json();
              stats = data.record || {}; // Użyj rekordu, jeśli istnieje, w przeciwnym razie pusty obiekt
            } else {
              throw new Error(`Nie udało się pobrać statystyk. Status: ${response.status}`);
            }

            // 2. Zaktualizuj licznik
            stats[title] = (stats[title] || 0) + 1;

            // 3. Wyślij zaktualizowane statystyki z powrotem do bina
            response = await fetch(BIN_URL, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Versioning': 'false' // Wyłącz wersjonowanie, by nie zużywać limitów
              },
              body: JSON.stringify(stats)
            });

            if (!response.ok) throw new Error('Nie udało się zapisać statystyk.');

            console.log(`Pomyślnie zarejestrowano kliknięcie dla: "${title}"`);
            alert('Dziękujemy za zainteresowanie! W realnej aplikacji nastąpiłoby przekierowanie.');
            // window.location.href = e.target.href; // Można odkomentować

          } catch (error) {
            console.error('Wystąpił błąd:', error);
            alert('Wystąpił błąd. Sprawdź konsolę (F12), aby dowiedzieć się więcej.');
          }
        });
      }
    });

    // --- Logika slidera i wyszukiwania ---
    let currentIndex = 0;
    const getVisibleCardsCount = () => { if (window.innerWidth <= 700) return 1; if (window.innerWidth <= 1024) return 2; return 4; };
    
    const updateSlider = () => {
        const cardsPerPage = getVisibleCardsCount();
        const visibleItems = allCards.filter(card => !card.classList.contains('hidden-by-search'));
        if (visibleItems.length < 2) { 
            cardsContainer.style.transform = 'translateX(0px)';
            if (arrowLeft) arrowLeft.classList.add('hidden');
            if (arrowRight) arrowRight.classList.add('hidden');
            return;
        }
        const cardWidth = visibleItems[0].offsetWidth;
        const gap = 30; // Wartość z CSS
        const stepWidth = cardWidth + gap;
        const maxIndex = Math.max(0, visibleItems.length - cardsPerPage);
        currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
        cardsContainer.style.transform = `translateX(-${currentIndex * stepWidth}px)`;
        if (arrowLeft) arrowLeft.classList.toggle('hidden', currentIndex === 0);
        if (arrowRight) arrowRight.classList.toggle('hidden', currentIndex >= maxIndex);
    };

    const filterCards = () => {
      const searchTerm = searchInput.value.toLowerCase();
      allCards.forEach(card => {
        const title = card.querySelector('h2').textContent.toLowerCase();
        card.classList.toggle('hidden-by-search', !title.includes(searchTerm));
      });
      currentIndex = 0;
      updateSlider();
    };

    if (arrowRight) arrowRight.addEventListener('click', () => { currentIndex += 1; updateSlider(); });
    if (arrowLeft) arrowLeft.addEventListener('click', () => { currentIndex -= 1; updateSlider(); });
    if (searchInput) searchInput.addEventListener('input', filterCards);

    let resizeTimeout;
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(updateSlider, 150); });
    
    updateSlider(); // Uruchom na starcie
  }
});
