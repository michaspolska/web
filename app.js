// Game State
const gameState = {
    cash: 10000,
    day: 1,
    stage: 1,
    portfolioValue: 10000,
    totalInvested: 0,
    peakPortfolioValue: 10000,
    lifetimeGains: 0,
    gameSpeed: 1,
    lastUpdateTime: Date.now(),
    dayProgress: 0,
    portfolio: [],
    completedMissions: [],
    unlockedAchievements: [],
    crashTriggered: false,
    crashStartDay: 0
};

// Instruments data
const instruments = {
    'TechPol': { type: 'stock', price: 100, basePrice: 100, volatility: 0.12, trend: 0, description: 'Technologiczna spółka', stage: 1, history: [100] },
    'BankLux': { type: 'stock', price: 50, basePrice: 50, volatility: 0.08, trend: 0, description: 'Bank', stage: 1, history: [50] },
    'EnerMax': { type: 'stock', price: 75, basePrice: 75, volatility: 0.10, trend: 0, description: 'Energia', stage: 1, history: [75] },
    'BioMed': { type: 'stock', price: 120, basePrice: 120, volatility: 0.10, trend: 0, description: 'Biotechnologia', stage: 2, history: [120] },
    'AutoDrive': { type: 'stock', price: 85, basePrice: 85, volatility: 0.11, trend: 0, description: 'Motoryzacja', stage: 2, history: [85] },
    'ObligacjeSkarbowe': { type: 'bond', price: 1000, basePrice: 1000, volatility: 0, trend: 0.0006, description: 'Obligacje 90D (3% rocznie)', stage: 2, history: [1000] },
    'ETF_WIG20': { type: 'etf', price: 40, basePrice: 40, volatility: 0.06, trend: 0, description: 'ETF śledzi WIG20', stage: 2, history: [40] },
    'ETF_DAX': { type: 'etf', price: 45, basePrice: 45, volatility: 0.05, trend: 0, description: 'ETF śledzi DAX', stage: 2, history: [45] }
};

// News templates
const newsTemplates = [
    { text: 'TechPol zaprezentował nowy produkt', target: 'TechPol', impact: 0.12, type: 'positive' },
    { text: 'TechPol reportuje wzrost przychodów', target: 'TechPol', impact: 0.10, type: 'positive' },
    { text: 'Prezes TechPol zrezygnował', target: 'TechPol', impact: -0.12, type: 'negative' },
    { text: 'TechPol traci kontrakt z kluczowym klientem', target: 'TechPol', impact: -0.08, type: 'negative' },
    { text: 'BankLux obniżył marże kredytowe', target: 'BankLux', impact: -0.08, type: 'negative' },
    { text: 'Rząd obniża stopy procentowe - wzrost akcji banków', target: 'BankLux', impact: 0.10, type: 'positive' },
    { text: 'BankLux zwiększa dywidendę', target: 'BankLux', impact: 0.08, type: 'positive' },
    { text: 'EnerMax zyskał nowy kontrakt energetyczny', target: 'EnerMax', impact: 0.10, type: 'positive' },
    { text: 'Krach surowcowy - spadek spółek energetycznych', target: 'EnerMax', impact: -0.12, type: 'negative' },
    { text: 'Ceny surowców rosną - korzyści dla EnerMax', target: 'EnerMax', impact: 0.09, type: 'positive' },
    { text: 'BioMed otrzymuje zatwierdzenie FDA na nowy lek', target: 'BioMed', impact: 0.15, type: 'positive' },
    { text: 'Nowa regulacja ekologiczna - kurs BioMed w górę', target: 'BioMed', impact: 0.08, type: 'positive' },
    { text: 'AutoDrive prezentuje prototyp samochodu elektrycznego', target: 'AutoDrive', impact: 0.11, type: 'positive' },
    { text: 'Problemy z produkcją w AutoDrive', target: 'AutoDrive', impact: -0.10, type: 'negative' }
];

// Missions
const missions = [
    { id: 'first_buy', stage: 1, name: 'Pierwszy krok', description: 'Kup swoją pierwszą akcję', condition: () => gameState.portfolio.length > 0, reward: 1000, completed: false },
    { id: 'stage1_goal', stage: 1, name: 'Cel etapu 1', description: 'Osiągnij 15% zysku (11,500 zł)', condition: () => gameState.portfolioValue >= 11500, reward: 5000, completed: false },
    { id: 'diversify', stage: 2, name: 'Dywersyfikacja', description: 'Posiadaj co najmniej 3 różne instrumenty', condition: () => gameState.portfolio.length >= 3, reward: 2000, completed: false },
    { id: 'buy_bonds', stage: 2, name: 'Bezpieczna inwestycja', description: 'Kup obligacje skarbowe', condition: () => gameState.portfolio.some(p => p.name === 'ObligacjeSkarbowe'), reward: 1500, completed: false },
    { id: 'survive_crash', stage: 3, name: 'Przetrwaj kryzys', description: 'Przetrwaj krach ze stratą <30%', condition: () => gameState.crashTriggered && gameState.day > gameState.crashStartDay + 20 && (gameState.portfolioValue / gameState.peakPortfolioValue) > 0.7, reward: 10000, completed: false }
];

// Achievements
const achievements = [
    { id: 'first_million', name: 'Pierwszy Milion', description: 'Osiągnij portfel wart 1,000,000 zł', icon: '💎', condition: () => gameState.portfolioValue >= 1000000, unlocked: false },
    { id: 'golden_bull', name: 'Złoty Byk', description: 'Zarabiaj 100% w ciągu roku', icon: '🐂', condition: () => gameState.portfolioValue >= 20000, unlocked: false },
    { id: 'calm_master', name: 'Mistrz Spokoju', description: 'Przetrwaj kryzys ze stratą <30%', icon: '🧘', condition: () => missions.find(m => m.id === 'survive_crash')?.completed, unlocked: false },
    { id: 'diversified', name: 'Mistrz Dywersyfikacji', description: 'Posiadaj 5 różnych instrumentów', icon: '🎯', condition: () => gameState.portfolio.length >= 5, unlocked: false }
];

// News storage
const newsHistory = [];
let nextNewsDay = 3;

// Initialize game
function initGame() {
    updateUI();
    renderInstruments();
    renderPortfolio();
    renderMissions();
    renderAchievements();
    showMentorMessage("Witaj w świecie inwestycji! Nazywam się Pan Kamil i będę Twoim mentorem. Zacznij od zakupu pierwszych akcji. Kliknij przycisk KUP przy wybranej spółce.");
    startGameLoop();
}

// Game loop
let gameLoopInterval;
function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    
    gameLoopInterval = setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - gameState.lastUpdateTime) / 1000; // seconds
        gameState.lastUpdateTime = now;
        
        // Progress time (1 day = 10 seconds real time, modified by speed)
        gameState.dayProgress += (deltaTime / 10) * gameState.gameSpeed;
        
        // If a day passed
        if (gameState.dayProgress >= 1) {
            gameState.day++;
            gameState.dayProgress = 0;
            onNewDay();
        }
        
        // Update prices more frequently
        updatePrices();
        updatePortfolioValue();
        updateUI();
        checkMissions();
        checkAchievements();
    }, 1000); // Update every second
}

// On new day
function onNewDay() {
    // Check for news
    if (gameState.day >= nextNewsDay) {
        generateNews();
        nextNewsDay = gameState.day + Math.floor(Math.random() * 3) + 3; // Next news in 3-5 days
    }
    
    // Stage transitions
    if (gameState.stage === 1 && gameState.portfolioValue >= 11500 && gameState.day >= 30) {
        advanceToStage(2);
    }
    
    if (gameState.stage === 2 && gameState.day >= 90) {
        advanceToStage(3);
    }
    
    // Crash event
    if (gameState.stage === 3 && gameState.day === 91 && !gameState.crashTriggered) {
        triggerCrash();
    }
    
    // Recovery after crash
    if (gameState.crashTriggered && gameState.day === gameState.crashStartDay + 20) {
        startRecovery();
    }
}

// Update prices
function updatePrices() {
    const availableInstruments = getAvailableInstruments();
    
    availableInstruments.forEach(name => {
        const instrument = instruments[name];
        
        if (instrument.type === 'bond') {
            // Bonds have fixed growth
            instrument.price += instrument.basePrice * instrument.trend;
        } else {
            // Stocks and ETFs have volatility
            const randomChange = (Math.random() - 0.5) * 2 * instrument.volatility;
            const trendChange = instrument.trend;
            const totalChange = randomChange + trendChange;
            
            instrument.price *= (1 + totalChange);
            instrument.price = Math.max(instrument.price, instrument.basePrice * 0.1); // Floor at 10% of base
        }
        
        // Store history (keep last 30 data points)
        instrument.history.push(instrument.price);
        if (instrument.history.length > 30) {
            instrument.history.shift();
        }
    });
}

// Get available instruments for current stage
function getAvailableInstruments() {
    return Object.keys(instruments).filter(name => instruments[name].stage <= gameState.stage);
}

// Generate news
function generateNews() {
    const availableInstruments = getAvailableInstruments();
    const availableNews = newsTemplates.filter(news => availableInstruments.includes(news.target));
    
    if (availableNews.length === 0) return;
    
    const news = availableNews[Math.floor(Math.random() * availableNews.length)];
    const instrument = instruments[news.target];
    
    // Apply impact
    instrument.price *= (1 + news.impact);
    instrument.trend = news.impact * 0.2; // Temporary trend
    
    // Add to news history
    newsHistory.unshift({
        day: gameState.day,
        text: news.text,
        type: news.type
    });
    
    if (newsHistory.length > 5) newsHistory.pop();
    
    renderNews();
    
    // Reset trend after some time
    setTimeout(() => {
        instrument.trend = 0;
    }, 5000);
}

// Trigger crash
function triggerCrash() {
    gameState.crashTriggered = true;
    gameState.crashStartDay = gameState.day;
    
    // Crash all stocks and ETFs by 40%
    Object.keys(instruments).forEach(name => {
        const instrument = instruments[name];
        if (instrument.type === 'stock' || instrument.type === 'etf') {
            instrument.price *= 0.6; // -40%
            instrument.trend = -0.05; // Negative trend
        }
    });
    
    newsHistory.unshift({
        day: gameState.day,
        text: '⚠️ KRACH RYNKOWY! Wszystkie akcje spadają dramatycznie!',
        type: 'negative'
    });
    
    renderNews();
    showMentorMessage("Nadszedł kryzys! To naturalny element rynku. Pamiętaj: to tylko chwilowa sytuacja. Możesz sprzedać ze stratą w panice, albo czekać na odbicie. Historia pokazuje, że rynki zawsze się odbudowują.");
}

// Start recovery
function startRecovery() {
    Object.keys(instruments).forEach(name => {
        const instrument = instruments[name];
        if (instrument.type === 'stock' || instrument.type === 'etf') {
            instrument.trend = 0.08; // Strong positive trend
        }
    });
    
    newsHistory.unshift({
        day: gameState.day,
        text: '📈 Rynek zaczyna się odbijać! Inwestorzy wracają do kupowania.',
        type: 'positive'
    });
    
    renderNews();
    
    // Reset trend after recovery
    setTimeout(() => {
        Object.keys(instruments).forEach(name => {
            instruments[name].trend = 0;
        });
    }, 30000);
}

// Advance to next stage
function advanceToStage(newStage) {
    gameState.stage = newStage;
    
    const stageMessages = {
        2: "Gratulacje! Odblokowany Etap 2: Dywersyfikacja. Teraz dostępne są obligacje i ETF-y. Zacznij budować zrównoważony portfel!",
        3: "Witaj w Etapie 3: Kryzys rynkowy. Przygotuj się na trudne czasy. Twoja wiedza i opanowanie zostaną poddane próbie.",
        4: "Etap 4: Inwestor profesjonalny. Odblokowujesz zaawansowane narzędzia i międzynarodowe rynki."
    };
    
    showMentorMessage(stageMessages[newStage] || "Nowy etap rozpoczęty!");
    updateStageUI();
    renderInstruments();
}

// Update stage UI
function updateStageUI() {
    const stageInfo = {
        1: { name: 'Etap 1: Pierwsze kroki', desc: 'Zbuduj swoją pierwszą pozycję inwestycyjną. Cel: 15% zysku' },
        2: { name: 'Etap 2: Dywersyfikacja portfela', desc: 'Odkryj obligacje i ETF-y. Zbalansuj swoje inwestycje' },
        3: { name: 'Etap 3: Kryzys rynkowy', desc: 'Przetrwaj krach i naucz się psychologii rynku' },
        4: { name: 'Etap 4: Inwestor profesjonalny', desc: 'Zaawansowane strategie i międzynarodowe rynki' },
        5: { name: 'Etap 5: Imperium finansowe', desc: 'Załóż własny fundusz i zarządzaj kapitałem innych' }
    };
    
    const info = stageInfo[gameState.stage];
    document.getElementById('stageName').textContent = info.name;
    document.getElementById('stageDescription').textContent = info.desc;
}

// Calculate portfolio value
function updatePortfolioValue() {
    let totalValue = gameState.cash;
    
    gameState.portfolio.forEach(position => {
        const instrument = instruments[position.name];
        if (instrument) {
            totalValue += position.quantity * instrument.price;
        }
    });
    
    gameState.portfolioValue = totalValue;
    
    if (gameState.portfolioValue > gameState.peakPortfolioValue) {
        gameState.peakPortfolioValue = gameState.portfolioValue;
    }
}

// Render instruments table
function renderInstruments() {
    const tbody = document.getElementById('instrumentsTableBody');
    tbody.innerHTML = '';
    
    const availableInstruments = getAvailableInstruments();
    
    availableInstruments.forEach(name => {
        const instrument = instruments[name];
        const history = instrument.history;
        const changeToday = history.length >= 2 ? ((instrument.price - history[history.length - 2]) / history[history.length - 2]) * 100 : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="instrument-name">
                    ${getInstrumentIcon(instrument.type)} ${name}
                    <span class="instrument-type">${getInstrumentTypeName(instrument.type)}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">${instrument.description}</div>
            </td>
            <td class="price">${formatCurrency(instrument.price)}</td>
            <td class="change ${changeToday >= 0 ? 'positive' : 'negative'}">
                ${changeToday >= 0 ? '+' : ''}${changeToday.toFixed(2)}%
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-buy" onclick="openBuyModal('${name}')">KUP</button>
                    <button class="btn btn-sell" onclick="openSellModal('${name}')" ${!hasInstrument(name) ? 'disabled' : ''}>SPRZEDAJ</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get instrument icon
function getInstrumentIcon(type) {
    const icons = {
        'stock': '📊',
        'bond': '🪙',
        'etf': '🌍'
    };
    return icons[type] || '📊';
}

// Get instrument type name
function getInstrumentTypeName(type) {
    const names = {
        'stock': 'Akcje',
        'bond': 'Obligacje',
        'etf': 'ETF'
    };
    return names[type] || 'Akcje';
}

// Check if player has instrument
function hasInstrument(name) {
    return gameState.portfolio.some(p => p.name === name);
}

// Open buy modal
function openBuyModal(instrumentName) {
    const instrument = instruments[instrumentName];
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Kup ${instrumentName}`;
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Cena jednostki: ${formatCurrency(instrument.price)}</label>
        </div>
        <div class="form-group">
            <label class="form-label">Ile chcesz kupić?</label>
            <input type="number" class="form-input" id="buyQuantity" min="1" value="1">
        </div>
        <div class="info-row">
            <span class="info-label">Całkowity koszt:</span>
            <span class="info-value" id="totalCost">${formatCurrency(instrument.price)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Dostępna gotówka:</span>
            <span class="info-value">${formatCurrency(gameState.cash)}</span>
        </div>
        <div id="buyAlert"></div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">ANULUJ</button>
            <button class="btn btn-buy" onclick="executeBuy('${instrumentName}')">KAUF</button>
        </div>
    `;
    
    // Update total cost on quantity change
    document.getElementById('buyQuantity').addEventListener('input', (e) => {
        const quantity = parseInt(e.target.value) || 0;
        const totalCost = quantity * instrument.price;
        document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    });
    
    modalOverlay.classList.remove('hidden');
}

// Execute buy
function executeBuy(instrumentName) {
    const quantity = parseInt(document.getElementById('buyQuantity').value) || 0;
    const instrument = instruments[instrumentName];
    const totalCost = quantity * instrument.price;
    
    if (quantity <= 0) {
        showBuyAlert('Musisz kupić co najmniej 1 jednostkę.', 'error');
        return;
    }
    
    if (totalCost > gameState.cash) {
        showBuyAlert('Brak wystarczających środków!', 'error');
        return;
    }
    
    // Execute purchase
    gameState.cash -= totalCost;
    
    // Add to portfolio or update existing position
    const existingPosition = gameState.portfolio.find(p => p.name === instrumentName);
    if (existingPosition) {
        existingPosition.quantity += quantity;
        existingPosition.totalCost += totalCost;
        existingPosition.avgPrice = existingPosition.totalCost / existingPosition.quantity;
    } else {
        gameState.portfolio.push({
            name: instrumentName,
            quantity: quantity,
            avgPrice: instrument.price,
            totalCost: totalCost
        });
    }
    
    updatePortfolioValue();
    updateUI();
    renderPortfolio();
    renderInstruments();
    closeModal();
}

// Show buy alert
function showBuyAlert(message, type) {
    const alertDiv = document.getElementById('buyAlert');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

// Open sell modal
function openSellModal(instrumentName) {
    const position = gameState.portfolio.find(p => p.name === instrumentName);
    if (!position) return;
    
    const instrument = instruments[instrumentName];
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Sprzedaj ${instrumentName}`;
    
    const currentValue = position.quantity * instrument.price;
    const profitLoss = currentValue - position.totalCost;
    const profitLossPercent = (profitLoss / position.totalCost) * 100;
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Obecna cena: ${formatCurrency(instrument.price)}</label>
        </div>
        <div class="form-group">
            <label class="form-label">Posiadasz: ${position.quantity} jednostek</label>
        </div>
        <div class="form-group">
            <label class="form-label">Ile chcesz sprzedać?</label>
            <input type="number" class="form-input" id="sellQuantity" min="1" max="${position.quantity}" value="${position.quantity}">
        </div>
        <div class="info-row">
            <span class="info-label">Przychód ze sprzedaży:</span>
            <span class="info-value" id="totalRevenue">${formatCurrency(currentValue)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Zysk/Strata:</span>
            <span class="info-value ${profitLoss >= 0 ? 'positive' : 'negative'}" id="profitLoss">
                ${formatCurrency(profitLoss)} (${profitLossPercent.toFixed(2)}%)
            </span>
        </div>
        <div id="sellAlert"></div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">ANULUJ</button>
            <button class="btn btn-sell" onclick="executeSell('${instrumentName}')">SPRZEDAJ</button>
        </div>
    `;
    
    // Update calculations on quantity change
    document.getElementById('sellQuantity').addEventListener('input', (e) => {
        const quantity = parseInt(e.target.value) || 0;
        const revenue = quantity * instrument.price;
        const cost = (position.totalCost / position.quantity) * quantity;
        const profit = revenue - cost;
        const profitPercent = (profit / cost) * 100;
        
        document.getElementById('totalRevenue').textContent = formatCurrency(revenue);
        document.getElementById('profitLoss').textContent = `${formatCurrency(profit)} (${profitPercent.toFixed(2)}%)`;
        document.getElementById('profitLoss').className = `info-value ${profit >= 0 ? 'positive' : 'negative'}`;
    });
    
    modalOverlay.classList.remove('hidden');
}

// Execute sell
function executeSell(instrumentName) {
    const quantity = parseInt(document.getElementById('sellQuantity').value) || 0;
    const position = gameState.portfolio.find(p => p.name === instrumentName);
    const instrument = instruments[instrumentName];
    
    if (quantity <= 0 || quantity > position.quantity) {
        showSellAlert('Nieprawidłowa liczba jednostek.', 'error');
        return;
    }
    
    // Execute sale
    const revenue = quantity * instrument.price;
    gameState.cash += revenue;
    
    // Update position
    const costOfSold = (position.totalCost / position.quantity) * quantity;
    position.quantity -= quantity;
    position.totalCost -= costOfSold;
    
    // Remove if empty
    if (position.quantity === 0) {
        gameState.portfolio = gameState.portfolio.filter(p => p.name !== instrumentName);
    }
    
    updatePortfolioValue();
    updateUI();
    renderPortfolio();
    renderInstruments();
    closeModal();
}

// Show sell alert
function showSellAlert(message, type) {
    const alertDiv = document.getElementById('sellAlert');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

// Close modal
function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

// Render portfolio
function renderPortfolio() {
    const container = document.getElementById('portfolioContainer');
    
    if (gameState.portfolio.length === 0) {
        container.innerHTML = '<div class="empty-state">Twój portfel jest pusty. Kup pierwsze akcje!</div>';
        return;
    }
    
    container.innerHTML = '';
    
    gameState.portfolio.forEach(position => {
        const instrument = instruments[position.name];
        const currentValue = position.quantity * instrument.price;
        const profitLoss = currentValue - position.totalCost;
        const profitLossPercent = (profitLoss / position.totalCost) * 100;
        
        const div = document.createElement('div');
        div.className = 'portfolio-item';
        div.innerHTML = `
            <div class="portfolio-header">
                <div class="portfolio-name">${getInstrumentIcon(instrument.type)} ${position.name}</div>
                <div class="portfolio-profit ${profitLoss >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(profitLoss)} (${profitLossPercent.toFixed(2)}%)
                </div>
            </div>
            <div class="portfolio-details">
                <div>Ilość: ${position.quantity}</div>
                <div>Cena średnia: ${formatCurrency(position.avgPrice)}</div>
                <div>Cena obecna: ${formatCurrency(instrument.price)}</div>
                <div>Wartość: ${formatCurrency(currentValue)}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Render news
function renderNews() {
    const container = document.getElementById('newsContainer');
    
    if (newsHistory.length === 0) {
        container.innerHTML = '<div class="empty-state">Czekaj na pierwsze wiadomości...</div>';
        return;
    }
    
    container.innerHTML = '';
    
    newsHistory.forEach(news => {
        const div = document.createElement('div');
        div.className = `news-item ${news.type}`;
        div.innerHTML = `
            <div class="news-time">Dzień ${news.day}</div>
            <div>${news.text}</div>
        `;
        container.appendChild(div);
    });
}

// Render missions
function renderMissions() {
    const container = document.getElementById('missionsContainer');
    const currentMissions = missions.filter(m => m.stage === gameState.stage);
    
    if (currentMissions.length === 0) {
        container.innerHTML = '<div class="empty-state">Brak misji w tym etapie</div>';
        return;
    }
    
    container.innerHTML = '';
    
    currentMissions.forEach(mission => {
        const div = document.createElement('div');
        div.className = `mission-item ${mission.completed ? 'mission-completed' : ''}`;
        div.innerHTML = `
            <div class="mission-name">${mission.name}</div>
            <div class="mission-desc">${mission.description}</div>
            <div class="mission-reward">Nagroda: ${formatCurrency(mission.reward)}</div>
            <div class="mission-status ${mission.completed ? 'completed' : 'active'}">
                ${mission.completed ? '✓ Ukończono' : '⏳ W trakcie'}
            </div>
        `;
        container.appendChild(div);
    });
}

// Check missions
function checkMissions() {
    missions.forEach(mission => {
        if (!mission.completed && mission.stage === gameState.stage && mission.condition()) {
            mission.completed = true;
            gameState.cash += mission.reward;
            showMentorMessage(`Gratulacje! Ukończono misję: ${mission.name}. Otrzymujesz ${formatCurrency(mission.reward)} nagrody!`);
            renderMissions();
        }
    });
}

// Render achievements
function renderAchievements() {
    const container = document.getElementById('achievementsContainer');
    
    container.innerHTML = '';
    
    achievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = `achievement-item ${achievement.unlocked ? 'achievement-unlocked' : 'achievement-locked'}`;
        div.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Check achievements
function checkAchievements() {
    achievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.condition()) {
            achievement.unlocked = true;
            showMentorMessage(`🏆 Nowe osiągnięcie odblokowane: ${achievement.name}!`);
            renderAchievements();
        }
    });
}

// Show mentor message
function showMentorMessage(message) {
    const dialog = document.getElementById('mentorDialog');
    const messageEl = document.getElementById('mentorMessage');
    
    messageEl.textContent = message;
    dialog.classList.remove('hidden');
}

// Close mentor
function closeMentor() {
    document.getElementById('mentorDialog').classList.add('hidden');
}

// Update UI
function updateUI() {
    document.getElementById('cashDisplay').textContent = formatCurrency(gameState.cash);
    document.getElementById('portfolioValue').textContent = formatCurrency(gameState.portfolioValue);
    
    const totalProfit = gameState.portfolioValue - 10000;
    const totalProfitPercent = ((gameState.portfolioValue - 10000) / 10000) * 100;
    const profitEl = document.getElementById('totalProfit');
    profitEl.textContent = `${formatCurrency(totalProfit)} (${totalProfitPercent.toFixed(2)}%)`;
    profitEl.className = `stat-value ${totalProfit >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('dayDisplay').textContent = gameState.day;
}

// Format currency
function formatCurrency(amount) {
    return `${amount.toFixed(2)} zł`;
}

// Set game speed
function setGameSpeed(speed) {
    gameState.gameSpeed = speed;
}

// Reset game
function resetGame() {
    if (!confirm('Czy na pewno chcesz zresetować grę? Cały postęp zostanie utracony.')) return;
    
    gameState.cash = 10000;
    gameState.day = 1;
    gameState.stage = 1;
    gameState.portfolioValue = 10000;
    gameState.totalInvested = 0;
    gameState.peakPortfolioValue = 10000;
    gameState.lifetimeGains = 0;
    gameState.gameSpeed = 1;
    gameState.dayProgress = 0;
    gameState.portfolio = [];
    gameState.completedMissions = [];
    gameState.unlockedAchievements = [];
    gameState.crashTriggered = false;
    gameState.crashStartDay = 0;
    
    // Reset instruments
    Object.keys(instruments).forEach(name => {
        instruments[name].price = instruments[name].basePrice;
        instruments[name].trend = 0;
        instruments[name].history = [instruments[name].basePrice];
    });
    
    // Reset missions
    missions.forEach(m => m.completed = false);
    
    // Reset achievements
    achievements.forEach(a => a.unlocked = false);
    
    // Reset news
    newsHistory.length = 0;
    nextNewsDay = 3;
    
    updateUI();
    updateStageUI();
    renderInstruments();
    renderPortfolio();
    renderNews();
    renderMissions();
    renderAchievements();
    showMentorMessage("Zaczynamy od nowa! Witaj ponownie w świecie inwestycji.");
}

// Initialize on load
initGame();