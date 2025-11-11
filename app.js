// ============================================
// FINANSOWY TYCOON - Improved Game Logic
// Implementacja naturalnych wahań kursu z GBM
// 1 dzień gry = 60 sekund rzeczywistych
// Zmiana kursu co 20 sekund (3 razy na dzień)
// ============================================

// Generator liczb z rozkładu normalnego (Box-Muller)
function gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Game State
const gameState = {
    cash: 10000,
    day: 1,
    dayProgress: 0,  // Śledzi postęp w dniu (0-60)
    stage: 1,
    portfolio: {},
    totalInvested: 0,
    peakValue: 10000,
    lifetimeGains: 0,
    newsHistory: [],
    missions: {},
    achievements: {},
    mentorShown: {}
};

// Instrumenty finansowe - ETAP 1 (15 firm)
const instruments = {
    stage1: {
        TechPol: {
            name: 'TechPol',
            type: 'stock',
            basePrice: 100,
            price: 100,
            trend: 0.00015,
            volatility: 0.04,
            priceHistory: [100],
            owned: 0,
            boughtAt: 0
        },
        BankLux: {
            name: 'BankLux',
            type: 'stock',
            basePrice: 50,
            price: 50,
            trend: 0.00005,
            volatility: 0.03,
            priceHistory: [50],
            owned: 0,
            boughtAt: 0
        },
        EnerMax: {
            name: 'EnerMax',
            type: 'stock',
            basePrice: 75,
            price: 75,
            trend: -0.00005,
            volatility: 0.035,
            priceHistory: [75],
            owned: 0,
            boughtAt: 0
        },
        RetailCorp: {
            name: 'RetailCorp',
            type: 'stock',
            basePrice: 45,
            price: 45,
            trend: 0.0001,
            volatility: 0.032,
            priceHistory: [45],
            owned: 0,
            boughtAt: 0
        },
        PharmaTech: {
            name: 'PharmaTech',
            type: 'stock',
            basePrice: 120,
            price: 120,
            trend: 0.00012,
            volatility: 0.045,
            priceHistory: [120],
            owned: 0,
            boughtAt: 0
        },
        IndustrialCo: {
            name: 'IndustrialCo',
            type: 'stock',
            basePrice: 80,
            price: 80,
            trend: 0.00008,
            volatility: 0.038,
            priceHistory: [80],
            owned: 0,
            boughtAt: 0
        },
        TeleCom: {
            name: 'TeleCom',
            type: 'stock',
            basePrice: 55,
            price: 55,
            trend: 0.00003,
            volatility: 0.028,
            priceHistory: [55],
            owned: 0,
            boughtAt: 0
        },
        ConstructionHub: {
            name: 'ConstructionHub',
            type: 'stock',
            basePrice: 65,
            price: 65,
            trend: 0.0001,
            volatility: 0.042,
            priceHistory: [65],
            owned: 0,
            boughtAt: 0
        },
        FoodBrand: {
            name: 'FoodBrand',
            type: 'stock',
            basePrice: 38,
            price: 38,
            trend: 0.00006,
            volatility: 0.025,
            priceHistory: [38],
            owned: 0,
            boughtAt: 0
        },
        MediaGroup: {
            name: 'MediaGroup',
            type: 'stock',
            basePrice: 72,
            price: 72,
            trend: 0.00004,
            volatility: 0.035,
            priceHistory: [72],
            owned: 0,
            boughtAt: 0
        },
        AutoMotive: {
            name: 'AutoMotive',
            type: 'stock',
            basePrice: 95,
            price: 95,
            trend: 0.00007,
            volatility: 0.041,
            priceHistory: [95],
            owned: 0,
            boughtAt: 0
        },
        FinanceBank: {
            name: 'FinanceBank',
            type: 'stock',
            basePrice: 110,
            price: 110,
            trend: 0.00009,
            volatility: 0.033,
            priceHistory: [110],
            owned: 0,
            boughtAt: 0
        },
        CleanEnergy: {
            name: 'CleanEnergy',
            type: 'stock',
            basePrice: 88,
            price: 88,
            trend: 0.00014,
            volatility: 0.048,
            priceHistory: [88],
            owned: 0,
            boughtAt: 0
        },
        RealEstate: {
            name: 'RealEstate',
            type: 'stock',
            basePrice: 125,
            price: 125,
            trend: 0.00006,
            volatility: 0.039,
            priceHistory: [125],
            owned: 0,
            boughtAt: 0
        },
        TravelPlus: {
            name: 'TravelPlus',
            type: 'stock',
            basePrice: 42,
            price: 42,
            trend: 0.00008,
            volatility: 0.044,
            priceHistory: [42],
            owned: 0,
            boughtAt: 0
        }
    },
    stage2: {
        BioMed: {
            name: 'BioMed',
            type: 'stock',
            basePrice: 120,
            price: 120,
            trend: 0.00018,
            volatility: 0.052,
            priceHistory: [120],
            owned: 0,
            boughtAt: 0
        },
        AutoDrive: {
            name: 'AutoDrive',
            type: 'stock',
            basePrice: 85,
            price: 85,
            trend: 0.00009,
            volatility: 0.036,
            priceHistory: [85],
            owned: 0,
            boughtAt: 0
        },
        SoftwareHub: {
            name: 'SoftwareHub',
            type: 'stock',
            basePrice: 145,
            price: 145,
            trend: 0.00016,
            volatility: 0.046,
            priceHistory: [145],
            owned: 0,
            boughtAt: 0
        },
        GreenPlastic: {
            name: 'GreenPlastic',
            type: 'stock',
            basePrice: 58,
            price: 58,
            trend: 0.00011,
            volatility: 0.041,
            priceHistory: [58],
            owned: 0,
            boughtAt: 0
        },
        DroneLogistics: {
            name: 'DroneLogistics',
            type: 'stock',
            basePrice: 135,
            price: 135,
            trend: 0.0002,
            volatility: 0.055,
            priceHistory: [135],
            owned: 0,
            boughtAt: 0
        },
        HealthTech: {
            name: 'HealthTech',
            type: 'stock',
            basePrice: 99,
            price: 99,
            trend: 0.00017,
            volatility: 0.049,
            priceHistory: [99],
            owned: 0,
            boughtAt: 0
        },
        WaterSystems: {
            name: 'WaterSystems',
            type: 'stock',
            basePrice: 67,
            price: 67,
            trend: 0.0001,
            volatility: 0.034,
            priceHistory: [67],
            owned: 0,
            boughtAt: 0
        },
        SecureCloud: {
            name: 'SecureCloud',
            type: 'stock',
            basePrice: 155,
            price: 155,
            trend: 0.00019,
            volatility: 0.051,
            priceHistory: [155],
            owned: 0,
            boughtAt: 0
        },
        SpaceComm: {
            name: 'SpaceComm',
            type: 'stock',
            basePrice: 175,
            price: 175,
            trend: 0.00021,
            volatility: 0.058,
            priceHistory: [175],
            owned: 0,
            boughtAt: 0
        },
        NanoMaterials: {
            name: 'NanoMaterials',
            type: 'stock',
            basePrice: 165,
            price: 165,
            trend: 0.00015,
            volatility: 0.053,
            priceHistory: [165],
            owned: 0,
            boughtAt: 0
        },
        'Obligacje Skarbowe': {
            name: 'Obligacje Skarbowe',
            type: 'bond',
            basePrice: 1000,
            price: 1000,
            trend: 0,
            volatility: 0,
            yieldRate: 0.03,
            maturityDays: 90,
            priceHistory: [1000],
            owned: 0,
            boughtAt: 0,
            maturityDay: 0
        },
        'ETF WIG20': {
            name: 'ETF WIG20',
            type: 'etf',
            basePrice: 40,
            price: 40,
            trend: 0.00009,
            volatility: 0.025,
            priceHistory: [40],
            owned: 0,
            boughtAt: 0
        },
        'ETF DAX': {
            name: 'ETF DAX',
            type: 'etf',
            basePrice: 45,
            price: 45,
            trend: 0.00012,
            volatility: 0.028,
            priceHistory: [45],
            owned: 0,
            boughtAt: 0
        },
        'ETF SP500': {
            name: 'ETF SP500',
            type: 'etf',
            basePrice: 52,
            price: 52,
            trend: 0.00014,
            volatility: 0.03,
            priceHistory: [52],
            owned: 0,
            boughtAt: 0
        },
        'ETF NIKKEI': {
            name: 'ETF NIKKEI',
            type: 'etf',
            basePrice: 38,
            price: 38,
            trend: 0.00011,
            volatility: 0.027,
            priceHistory: [38],
            owned: 0,
            boughtAt: 0
        }
    }
};

const news = {
    positive: [
        { text: 'TechPol zaprezentował nowy produkt', effect: { TechPol: 0.08 } },
        { text: 'BankLux zwiększył zysk o 25%', effect: { BankLux: 0.06 } },
        { text: 'EnerMax zyskał nowy kontrakt', effect: { EnerMax: 0.07 } },
        { text: 'Rząd obniża stopy procentowe', effect: { BankLux: 0.05, FinanceBank: 0.05 } },
        { text: 'BioMed otrzyma pozwolenie na nowy lek', effect: { BioMed: 0.12 } },
        { text: 'AutoDrive podpisuje umowę europejską', effect: { AutoDrive: 0.09 } },
        { text: 'CleanEnergy otrzyma dotacje rządowe', effect: { CleanEnergy: 0.11 } },
        { text: 'RetailCorp otworzy 50 nowych sklepów', effect: { RetailCorp: 0.07 } },
        { text: 'PharmaTech zapowiada nową linię produktów', effect: { PharmaTech: 0.08 } },
        { text: 'TeleCom wdrożył 5G na całym terenie', effect: { TeleCom: 0.06 } }
    ],
    negative: [
        { text: 'TechPol raportuje problemy techniczne', effect: { TechPol: -0.06 } },
        { text: 'BankLux obniża marżę kredytową', effect: { BankLux: -0.04 } },
        { text: 'Krach surowcowy - energia w dół', effect: { EnerMax: -0.08, CleanEnergy: -0.05 } },
        { text: 'BioMed lek nie przeszedł testów', effect: { BioMed: -0.09 } },
        { text: 'AutoDrive wycofuje się z Azji', effect: { AutoDrive: -0.06 } },
        { text: 'Problemy logistyczne w sektorze transportu', effect: { DroneLogistics: -0.07, TravelPlus: -0.05 } },
        { text: 'Konflikt handlowy wpływa na ceny', effect: { AutoMotive: -0.07, IndustrialCo: -0.05 } },
        { text: 'Podatki od korporacji rosną', effect: { PharmaTech: -0.05, SoftwareHub: -0.04 } }
    ]
};

const missions = {
    stage1: [
        { id: 'buy_first', name: 'Pierwszy krok', desc: 'Kup swoją pierwszą akcję', reward: 1000, completed: false },
        { id: 'reach_15', name: 'Cel etapu 1', desc: 'Osiągnij 15% zysku (11,500 zł)', reward: 5000, completed: false }
    ],
    stage2: [
        { id: 'bonds_40', name: 'Dywersyfikacja', desc: 'Zainwestuj 40% w obligacje', reward: 2000, completed: false },
        { id: 'hold_60', name: 'Cierpliwość', desc: 'Utrzymaj portfel przez 60 dni', reward: 3000, completed: false }
    ],
    stage3: [
        { id: 'survive_crash', name: 'Mistrz spokoju', desc: 'Przetrwaj kryzys ze stratą <30%', reward: 10000, completed: false }
    ]
};

const achievements = [
    { id: 'first_million', name: '💎 Pierwszy Milion', desc: 'Osiągnij portfel wart 1,000,000 zł', unlocked: false },
    { id: 'golden_bull', name: '🐂 Złoty Byk', desc: 'Zarabiaj 100% w ciągu roku', unlocked: false },
    { id: 'calm_master', name: '🧘 Mistrz Spokoju', desc: 'Przetrwaj kryzys bez paniki', unlocked: false },
    { id: 'diversified', name: '🌍 Międzynarodowiec', desc: 'Inwestuj w 3 różne instrumenty', unlocked: false }
];

const stageInfo = {
    1: {
        name: 'Etap 1: Pierwsze kroki',
        desc: 'Zbuduj swoją pierwszą pozycję inwestycyjną. Cel: 15% zysku',
        mentor: 'Cześć! Jestem Pan Kamil. Zaczyniemy od prostych inwestycji w akcje. Pamiętaj - inwestowanie to maraton, nie sprint! 📈'
    },
    2: {
        name: 'Etap 2: Dywersyfikacja',
        desc: 'Otwierają się nowe instrumenty. Naucz się zarządzać ryzykiem.',
        mentor: 'Gratulacje! Teraz pora na dywersyfikację. Obligacje to bezpieczna przystań, ETF-y to stabilny wzrost. 💼'
    },
    3: {
        name: 'Etap 3: Kryzys rynkowy',
        desc: 'Rynek pada! To test Twojej determinacji. Pamiętaj - to okazja, nie katastrofa.',
        mentor: 'UWAGA! Krach rynkowy! Ceny akcji spadają. To moment, gdy inwestorzy tracą nerwy. Ty bądź silny! 📉'
    }
};

// ============================================
// FUNKCJE AKTUALIZACJI CEN
// ============================================

function updateInstrumentPrice(instrument) {
    let mu = instrument.trend;
    let sigma = instrument.volatility;
    let dt = 1;
    
    let epsilon = gaussianRandom();
    let factor = Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * epsilon * 0.3);
    
    let oldPrice = instrument.price;
    instrument.price = Math.max(0.01, oldPrice * factor);
    
    if (instrument.priceHistory.length > 100) {
        instrument.priceHistory.shift();
    }
    instrument.priceHistory.push(instrument.price);
}

function applyNewsEffect(instrument, percentChange) {
    let priceChange = instrument.price * (percentChange / 100);
    instrument.price = Math.max(0.01, instrument.price + priceChange);
    
    if (instrument.priceHistory.length > 100) {
        instrument.priceHistory.shift();
    }
    instrument.priceHistory.push(instrument.price);
}

/**
 * Aktualizuj ceny wszystkich instrumentów
 */
function updateAllPrices() {
    let currentInstruments = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        currentInstruments = [...currentInstruments, ...Object.values(instruments.stage2)];
    }
    
    currentInstruments.forEach(inst => {
        if (inst.type !== 'bond') {
            updateInstrumentPrice(inst);
        }
    });
    
    // Logika krachu w etapie 3
    if (gameState.stage >= 3 && gameState.day >= 91 && gameState.day <= 110) {
        currentInstruments.forEach(inst => {
            if (inst.type === 'stock') {
                if (gameState.day === 91) {
                    inst.price *= 0.60;
                } else if (gameState.day > 111) {
                    inst.trend = 0.0005;
                }
            }
        });
    }
    
    updateInstrumentsTable();
    updatePortfolio();
}

/**
 * Główna pętla - uruchamia się co 1 sekundę (60 sekund = 1 dzień)
 */
function gameTickEverySecond() {
    gameState.dayProgress += 1;
    
    // Koniec dnia - przejdź do następnego
    if (gameState.dayProgress >= 60) {
        gameState.day += 1;
        gameState.dayProgress = 0;
        
        // Losowe wiadomości
        if (gameState.day % 4 === 0 && Math.random() > 0.5) {
            generateRandomNews();
        }
        
        // Sprawdzaj etapy
        checkStageMilestones();
    }
    
    updateHeader();
}

/**
 * Generuj losową wiadomość rynkową
 */
function generateRandomNews() {
    let newsType = Math.random() > 0.4 ? news.positive : news.negative;
    let newsItem = newsType[Math.floor(Math.random() * newsType.length)];
    
    let newsEvent = {
        day: gameState.day,
        text: newsItem.text,
        type: newsType === news.positive ? 'positive' : 'negative',
        effect: newsItem.effect
    };
    
    Object.keys(newsItem.effect).forEach(instrName => {
        let instruments_list = [...Object.values(instruments.stage1)];
        if (gameState.stage >= 2) {
            instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
        }
        
        let instrument = instruments_list.find(i => i.name === instrName);
        if (instrument) {
            applyNewsEffect(instrument, newsItem.effect[instrName]);
        }
    });
    
    gameState.newsHistory.push(newsEvent);
    
    if (gameState.newsHistory.length > 5) {
        gameState.newsHistory.shift();
    }
    
    updateNews();
}

/**
 * Sprawdzaj kamienie milowe etapów
 */
function checkStageMilestones() {
    let portfolioValue = getPortfolioValue();
    let totalProfit = portfolioValue - 10000;
    
    if (gameState.stage === 1 && gameState.day >= 30 && totalProfit >= 1500) {
        gameState.stage = 2;
        showMentorMessage(stageInfo[2].mentor);
        showNotification('Przeszedłeś do Etapu 2: Dywersyfikacja!', 'success');
    }
    
    if (gameState.stage === 2 && gameState.day >= 91) {
        gameState.stage = 3;
        showMentorMessage(stageInfo[3].mentor);
        showNotification('⚠️ KRYZYS RYNKOWY! Ceny akcji spadają!', 'error');
    }
}

// ============================================
// FUNKCJE PORTFELA I TRANSAKCJI
// ============================================

function buyInstrument(instrName, quantity) {
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    let instrument = instruments_list.find(i => i.name === instrName);
    if (!instrument) return;
    
    let totalCost = instrument.price * quantity;
    if (gameState.cash < totalCost) {
        showNotification('❌ Niewystarczająco gotówki!', 'error');
        return;
    }
    
    gameState.cash -= totalCost;
    
    if (!gameState.portfolio[instrName]) {
        gameState.portfolio[instrName] = {
            quantity: 0,
            boughtPrice: instrument.price,
            totalCost: 0
        };
    }
    
    gameState.portfolio[instrName].quantity += quantity;
    gameState.portfolio[instrName].totalCost += totalCost;
    gameState.portfolio[instrName].boughtPrice = 
        gameState.portfolio[instrName].totalCost / gameState.portfolio[instrName].quantity;
    
    gameState.totalInvested += totalCost;
    
    checkMissionProgress('buy_first');
    
    showNotification(`✅ Kupiłeś ${quantity} ${instrName}!`, 'success');
    closeModal();
    updateUI();
}

function sellInstrument(instrName, quantity) {
    if (!gameState.portfolio[instrName]) return;
    
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    let instrument = instruments_list.find(i => i.name === instrName);
    if (!instrument) return;
    
    let held = gameState.portfolio[instrName].quantity;
    if (quantity > held) {
        showNotification('❌ Posiadasz mniej!', 'error');
        return;
    }
    
    let totalValue = instrument.price * quantity;
    gameState.cash += totalValue;
    gameState.portfolio[instrName].quantity -= quantity;
    
    if (gameState.portfolio[instrName].quantity === 0) {
        delete gameState.portfolio[instrName];
    }
    
    showNotification(`✅ Sprzedałeś ${quantity} ${instrName}!`, 'success');
    closeModal();
    updateUI();
}

function getPortfolioValue() {
    let value = gameState.cash;
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    Object.keys(gameState.portfolio).forEach(instrName => {
        let instrument = instruments_list.find(i => i.name === instrName);
        if (instrument) {
            value += instrument.price * gameState.portfolio[instrName].quantity;
        }
    });
    
    return value;
}

// ============================================
// FUNKCJE MISJI I OSIĄGNIĘĆ
// ============================================

function checkMissionProgress(missionId) {
    let allMissions = { ...missions.stage1, ...missions.stage2, ...missions.stage3 };
    let mission = Object.values(allMissions).find(m => m.id === missionId);
    
    if (!mission) return;
    
    let completed = false;
    
    if (missionId === 'buy_first') {
        completed = Object.keys(gameState.portfolio).length > 0;
    } else if (missionId === 'reach_15') {
        let profit = getPortfolioValue() - 10000;
        completed = profit >= 1500;
    } else if (missionId === 'bonds_40') {
        let bondValue = 0;
        if (gameState.portfolio['Obligacje Skarbowe']) {
            bondValue = gameState.portfolio['Obligacje Skarbowe'].quantity * 1000;
        }
        completed = bondValue >= getPortfolioValue() * 0.4;
    } else if (missionId === 'hold_60') {
        completed = gameState.day >= 120;
    } else if (missionId === 'survive_crash') {
        let loss = 10000 - getPortfolioValue();
        completed = loss < 3000;
    }
    
    if (completed && !mission.completed) {
        mission.completed = true;
        gameState.cash += mission.reward;
        showNotification(`🎉 Misja ukończona! +${mission.reward} zł`, 'success');
    }
}

// ============================================
// FUNKCJE UI
// ============================================

function updateUI() {
    updateHeader();
    updateInstrumentsTable();
    updatePortfolio();
    updateNews();
    updateMissions();
    updateAchievements();
}

function updateHeader() {
    let portfolioValue = getPortfolioValue();
    let totalProfit = portfolioValue - 10000;
    let profitPercent = ((totalProfit / 10000) * 100).toFixed(2);
    
    document.getElementById('cashDisplay').textContent = formatCurrency(gameState.cash);
    document.getElementById('portfolioValue').textContent = formatCurrency(portfolioValue);
    document.getElementById('totalProfit').textContent = 
        `${formatCurrency(totalProfit)} (${profitPercent}%)`;
    document.getElementById('dayDisplay').textContent = gameState.day;
    
    document.getElementById('stageName').textContent = stageInfo[gameState.stage].name;
    document.getElementById('stageDescription').textContent = stageInfo[gameState.stage].desc;
    
    let profitElement = document.getElementById('totalProfit');
    profitElement.classList.remove('positive', 'negative');
    profitElement.classList.add(totalProfit >= 0 ? 'positive' : 'negative');
}

function updateInstrumentsTable() {
    let tbody = document.getElementById('instrumentsTableBody');
    tbody.innerHTML = '';

    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2)
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];

    instruments_list.forEach(inst => {
        let dayChange = inst.priceHistory.length > 1
            ? ((inst.price - inst.priceHistory[inst.priceHistory.length - 2]) /
                inst.priceHistory[inst.priceHistory.length - 2]) * 100
            : 0;

        // Bezpiecznie sprawdzamy czy instrument jest w portfelu i ilość > 0
        const myHolding = gameState.portfolio[inst.name];
        const canSell = myHolding && myHolding.quantity > 0;

        let row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="instrument-name">
                    ${inst.name}
                    <span class="instrument-type">${inst.type.toUpperCase()}</span>
                </div>
            </td>
            <td><span class="price">${formatCurrency(inst.price)}</span></td>
            <td><span class="change ${dayChange >= 0 ? 'positive' : 'negative'}">
                ${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}%
            </span></td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-buy" onclick="openBuyModal('${inst.name}')">KUP</button>
                    <button class="btn btn-sell" onclick="openSellModal('${inst.name}')" ${!canSell ? 'disabled' : ''}>SPRZEDAJ</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}



function updatePortfolio() {
    let container = document.getElementById('portfolioContainer');
    container.innerHTML = '';
    
    if (Object.keys(gameState.portfolio).length === 0) {
        container.innerHTML = '<div class="empty-state">Twój portfel jest pusty. Kup pierwsze akcje!</div>';
        return;
    }
    
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    Object.keys(gameState.portfolio).forEach(instrName => {
        let holding = gameState.portfolio[instrName];
        let instrument = instruments_list.find(i => i.name === instrName);
        
        let currentValue = instrument.price * holding.quantity;
        let profit = currentValue - holding.totalCost;
        let profitPercent = (profit / holding.totalCost * 100).toFixed(2);
        
        let item = document.createElement('div');
        item.className = 'portfolio-item';
        item.innerHTML = `
            <div class="portfolio-header">
                <div class="portfolio-name">${instrName}</div>
                <div class="portfolio-profit ${profit >= 0 ? 'positive' : 'negative'}">
                    ${profit >= 0 ? '+' : ''}${formatCurrency(profit)} (${profitPercent}%)
                </div>
            </div>
            <div class="portfolio-details">
                <div><strong>Ilość:</strong> ${holding.quantity}</div>
                <div><strong>Cena kupna:</strong> ${formatCurrency(holding.boughtPrice)}</div>
                <div><strong>Cena obecna:</strong> ${formatCurrency(instrument.price)}</div>
                <div><strong>Wartość:</strong> ${formatCurrency(currentValue)}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateNews() {
    let container = document.getElementById('newsContainer');
    container.innerHTML = '';
    
    if (gameState.newsHistory.length === 0) {
        container.innerHTML = '<div class="empty-state">Czekaj na pierwsze wiadomości...</div>';
        return;
    }
    
    gameState.newsHistory.forEach(newsItem => {
        let item = document.createElement('div');
        item.className = `news-item ${newsItem.type}`;
        item.innerHTML = `
            <div class="news-time">Dzień ${newsItem.day}</div>
            <div>${newsItem.text}</div>
        `;
        container.appendChild(item);
    });
}

function updateMissions() {
    let container = document.getElementById('missionsContainer');
    container.innerHTML = '';
    
    let currentMissions = gameState.stage === 1 ? missions.stage1 :
                         gameState.stage === 2 ? missions.stage2 : missions.stage3;
    
    currentMissions.forEach(mission => {
        let item = document.createElement('div');
        item.className = `mission-item ${mission.completed ? 'mission-completed' : ''}`;
        item.innerHTML = `
            <div class="mission-name">${mission.name}</div>
            <div class="mission-desc">${mission.desc}</div>
            <div class="mission-reward">💰 ${mission.reward} zł</div>
            <div class="mission-status ${mission.completed ? 'completed' : 'active'}">
                ${mission.completed ? '✅ Ukończona' : '⏳ W toku'}
            </div>
        `;
        container.appendChild(item);
    });
}

function updateAchievements() {
    let container = document.getElementById('achievementsContainer');
    container.innerHTML = '';
    
    achievements.forEach(ach => {
        let item = document.createElement('div');
        item.className = `achievement-item ${ach.unlocked ? 'achievement-unlocked' : 'achievement-locked'}`;
        item.innerHTML = `
            <div class="achievement-icon">${ach.name.split(' ')[0]}</div>
            <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// ============================================
// MODALNE I DIALOGI
// ============================================

function openBuyModal(instrName) {
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    let instrument = instruments_list.find(i => i.name === instrName);
    if (!instrument) return;
    
    let modal = document.getElementById('modalOverlay');
    let title = document.getElementById('modalTitle');
    let body = document.getElementById('modalBody');
    
    title.textContent = `Kup ${instrName}`;
    
    body.innerHTML = `
        <div class="modal-body">
            <div class="alert alert-success">Cena: <strong>${formatCurrency(instrument.price)}</strong></div>
            <div class="form-group">
                <label class="form-label">Ilość do kupienia:</label>
                <input type="number" id="buyQuantity" min="1" value="1" class="form-input" onchange="updateBuyCost('${instrName}')">
            </div>
            <div class="info-row">
                <span class="info-label">Całkowity koszt:</span>
                <span class="info-value" id="buyCost">${formatCurrency(instrument.price)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Dostępna gotówka:</span>
                <span class="info-value ${gameState.cash >= instrument.price ? '' : 'negative'}">${formatCurrency(gameState.cash)}</span>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">ANULUJ</button>
            <button class="btn btn-buy" onclick="confirmBuy('${instrName}')">KAUF</button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function updateBuyCost(instrName) {
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    let instrument = instruments_list.find(i => i.name === instrName);
    let quantity = parseInt(document.getElementById('buyQuantity').value) || 1;
    let cost = instrument.price * quantity;
    
    document.getElementById('buyCost').textContent = formatCurrency(cost);
}

function confirmBuy(instrName) {
    let quantity = parseInt(document.getElementById('buyQuantity').value) || 1;
    buyInstrument(instrName, quantity);
}

function openSellModal(instrName) {
    if (!gameState.portfolio[instrName]) {
        showNotification('❌ Nie posiadasz tego instrumentu!', 'error');
        return;
    }
    
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    let instrument = instruments_list.find(i => i.name === instrName);
    let holding = gameState.portfolio[instrName];
    
    let modal = document.getElementById('modalOverlay');
    let title = document.getElementById('modalTitle');
    let body = document.getElementById('modalBody');
    
    title.textContent = `Sprzedaj ${instrName}`;
    
    body.innerHTML = `
        <div class="modal-body">
            <div class="alert alert-success">Cena: <strong>${formatCurrency(instrument.price)}</strong></div>
            <div class="form-group">
                <label class="form-label">Ilość do sprzedania (Posiadasz: ${holding.quantity}):</label>
                <input type="number" id="sellQuantity" min="1" max="${holding.quantity}" value="1" class="form-input" onchange="updateSellValue('${instrName}')">
            </div>
            <div class="info-row">
                <span class="info-label">Wartość sprzedaży:</span>
                <span class="info-value" id="sellValue">${formatCurrency(instrument.price)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Zysk/Strata:</span>
                <span class="info-value" id="sellProfit"></span>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">ANULUJ</button>
            <button class="btn btn-sell" onclick="confirmSell('${instrName}')">SPRZEDAJ</button>
        </div>
    `;
    
    updateSellValue(instrName);
    modal.classList.remove('hidden');
}

function updateSellValue(instrName) {
    let instruments_list = [...Object.values(instruments.stage1)];
    if (gameState.stage >= 2) {
        instruments_list = [...instruments_list, ...Object.values(instruments.stage2)];
    }
    
    let instrument = instruments_list.find(i => i.name === instrName);
    let holding = gameState.portfolio[instrName];
    let quantity = parseInt(document.getElementById('sellQuantity').value) || 1;
    
    let value = instrument.price * quantity;
    let profit = value - (holding.boughtPrice * quantity);
    
    document.getElementById('sellValue').textContent = formatCurrency(value);
    document.getElementById('sellProfit').textContent = 
        `<span class="${profit >= 0 ? 'positive' : 'negative'}">${profit >= 0 ? '+' : ''}${formatCurrency(profit)}</span>`;
}

function confirmSell(instrName) {
    let quantity = parseInt(document.getElementById('sellQuantity').value) || 1;
    sellInstrument(instrName, quantity);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

function showMentorMessage(message) {
    let dialog = document.getElementById('mentorDialog');
    document.getElementById('mentorMessage').textContent = message;
    dialog.classList.remove('hidden');
}

function closeMentor() {
    document.getElementById('mentorDialog').classList.add('hidden');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function resetGame() {
    if (confirm('Czy na pewno chcesz zresetować grę?')) {
        location.reload();
    }
}

// ============================================
// INICJALIZACJA GRY
// ============================================

function initGame() {
    showMentorMessage(stageInfo[1].mentor);
    
    // Główna pętla gry - co 1 sekundę
    setInterval(() => {
        gameTickEverySecond();
    }, 1000);
    
    // Aktualizacja cen - co 20 sekund
    setInterval(() => {
        updateAllPrices();
    }, 20000);
    
    updateUI();
}

// Start gry
document.addEventListener('DOMContentLoaded', initGame);
