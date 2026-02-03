const API_BASE = '/api';
let token = localStorage.getItem('token') || null;

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('authMessage');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');

// Elementen voor instellingen Modal
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const hourlyRateInput = document.getElementById('hourlyRateInput');
const kmRateInput = document.getElementById('kmRateInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const hoursSection = document.getElementById('hoursSection');
const dateInput = document.getElementById('date');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const descriptionInput = document.getElementById('description');
const addHoursBtn = document.getElementById('addHoursBtn');
const hoursTableBody = document.getElementById('hoursTableBody');
const periodStartInput = document.getElementById('periodStart');
const periodEndInput = document.getElementById('periodEnd');
const totalHoursMonthEl = document.getElementById('totalHoursMonth');
const totalHoursAllEl = document.getElementById('totalHoursAll');
const totalEarningsEl = document.getElementById('totalEarnings');
const copyBtn = document.getElementById('copyBtn');
const migrateBtn = document.getElementById('migrateBtn');
const prevPeriodBtn = document.getElementById('prevPeriodBtn');
const nextPeriodBtn = document.getElementById('nextPeriodBtn');

let allRows = [];
let currentSort = { by: 'date', dir: 'desc' };

// Instellingen, worden geladen vanuit DB
let userSettings = {
    hourlyRate: 16.35,
    kmRate: 0.23
};
// Constanten voor berekeningen
const OFFICE_KM = 62;

// Helper functie om tijd te normaliseren naar HH:MM formaat
function normalizeTime(timeValue) {
    if (!timeValue) return '00:00';
    // Als het al een string in HH:MM formaat is
    if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue;
    }
    // Als het een ISO string of Date object is
    try {
        const date = new Date(timeValue);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '00:00';
    }
}

// Stel de datum van vandaag in als standaard
dateInput.valueAsDate = new Date();
// Stel periode in op deze maand
const storedStart = localStorage.getItem('periodStart');
const storedEnd = localStorage.getItem('periodEnd');

if (storedStart && storedEnd) {
    periodStartInput.value = storedStart;
    periodEndInput.value = storedEnd;
} else {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    periodStartInput.value = firstDay.toISOString().slice(0, 10);
    periodEndInput.value = lastDay.toISOString().slice(0, 10);
}

// --- Thema Functies ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        if(themeToggleBtn) themeToggleBtn.textContent = '☀️ Wissel naar Licht Thema';
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        if(themeToggleBtn) themeToggleBtn.textContent = '🌙 Wissel naar Donker Thema';
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// Pas opgeslagen of standaard thema toe bij laden
const savedTheme = localStorage.getItem('theme') || 'dark'; // Standaard donker
applyTheme(savedTheme);

function updateUI() {
    if (token) {
        hoursSection.style.display = 'block';
        logoutBtn.style.display = 'inline-flex';
        if (settingsBtn) settingsBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'none';
        loginBtn.style.display = 'none';
        authMessage.textContent = 'Ingelogd. Welkom!';
        loadHours();
        loadSettings();
    } else {
        hoursSection.style.display = 'none';
        logoutBtn.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
        registerBtn.style.display = 'inline-flex';
        loginBtn.style.display = 'inline-flex';
        authMessage.textContent = 'Log in of registreer om verder te gaan.';
    }
}

function setToken(newToken) {
    token = newToken;
    if (newToken) {
        localStorage.setItem('token', newToken);
    } else {
        localStorage.removeItem('token');
    }
    updateUI();
}

// --- API Functies ---
async function register() {
    const email = emailInput.value;
    const password = passwordInput.value;
    authMessage.textContent = 'Bezig met registreren...';
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
        setToken(data.token);
        authMessage.textContent = 'Registratie gelukt. Je bent nu ingelogd.';
    } else {
        authMessage.textContent = data.error || 'Registratie mislukt';
    }
}

async function login() {
    const email = emailInput.value;
    const password = passwordInput.value;
    authMessage.textContent = 'Bezig met inloggen...';
    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
        setToken(data.token);
        authMessage.textContent = 'Login gelukt.';
    } else {
        authMessage.textContent = data.error || 'Login mislukt (controleer gegevens)';
    }
}

async function loadSettings() {
    if (!token) return;
    try {
        const res = await fetch(`${API_BASE}/getSettings`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            throw new Error('Instellingen ophalen mislukt');
        }
        const settings = await res.json();
        userSettings.hourlyRate = settings.hourlyRate;
        userSettings.kmRate = settings.kmRate;

        // Update placeholders in de modal
        if (hourlyRateInput) hourlyRateInput.value = userSettings.hourlyRate;
        if (kmRateInput) kmRateInput.value = userSettings.kmRate;

        // Herbereken de tabel met de nieuwe tarieven
        renderTable();
    } catch (err) {
        console.error(err);
        authMessage.textContent = 'Kon instellingen niet laden.';
    }
}

async function saveSettings() {
    if (!token) return;

    const newHourlyRate = parseFloat(hourlyRateInput.value);
    const newKmRate = parseFloat(kmRateInput.value);

    if (isNaN(newHourlyRate) || isNaN(newKmRate) || newHourlyRate < 0 || newKmRate < 0) {
        alert('Vul geldige, positieve getallen in voor de tarieven.');
        return;
    }

    authMessage.textContent = 'Instellingen opslaan...';
    try {
        const res = await fetch(`${API_BASE}/updateSettings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ hourlyRate: newHourlyRate, kmRate: newKmRate })
        });

        const data = await res.json();
        if (!res.ok) { throw new Error(data.error || 'Opslaan van instellingen mislukt.'); }

        authMessage.textContent = 'Instellingen succesvol opgeslagen.';
        await loadSettings(); // Herlaad instellingen en render tabel opnieuw
        if (settingsModal) settingsModal.style.display = 'none';
    } catch (err) { authMessage.textContent = `Fout: ${err.message}`; }
}

async function addHours() {
    if (!token) {
        authMessage.textContent = 'Eerst inloggen';
        return;
    }
    if (!dateInput.value || !startTimeInput.value || !endTimeInput.value) {
        authMessage.textContent = 'Vul datum, starttijd en eindtijd in.';
        return;
    }
    authMessage.textContent = 'Bezig met opslaan...';
    const res = await fetch(`${API_BASE}/addHours`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            date: dateInput.value,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            description: descriptionInput.value
        })
    });
    const data = await res.json();
    if (!res.ok) {
        authMessage.textContent = data.error || 'Opslaan mislukt. Zorg ervoor dat de eindtijd na de starttijd ligt.';
    } else {
        startTimeInput.value = '';
        endTimeInput.value = '';
        descriptionInput.value = '';
        authMessage.textContent = 'Uren succesvol opgeslagen.';
        loadHours();
    }
}

async function migrateOldData() {
    if (!token) return;
    if (!window.confirm('Dit zet oude Date tijden om naar HH:MM formaat. Dit hoef je maar 1x te doen. Doorgaan?')) return;
    authMessage.textContent = 'Bezig met migreren...';
    migrateBtn.disabled = true;
    const res = await fetch(`${API_BASE}/migrateTime`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await res.json();
    migrateBtn.disabled = false;
    if (res.ok) {
        authMessage.textContent = `Migratie voltooid! ${data.migrated} records gemigreerd, ${data.skipped} al correct.`;
        loadHours();
    } else if (res.status === 401) {
        setToken(null);
        authMessage.textContent = 'Sessie verlopen. Gelieve opnieuw in te loggen.';
    } else {
        authMessage.textContent = data.error || 'Migratie mislukt.';
    }
}

async function updateHour(id, date, startTime, endTime, description) {
    if (!token) return;
    authMessage.textContent = 'Bezig met bijwerken...';
    const res = await fetch(`${API_BASE}/updateHour`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id, date, startTime, endTime, description })
    });
    const data = await res.json();
    if (res.ok) {
        authMessage.textContent = 'Succesvol bijgewerkt.';
        loadHours();
    } else if (res.status === 401) {
        setToken(null);
        authMessage.textContent = 'Sessie verlopen. Gelieve opnieuw in te loggen.';
    } else {
        authMessage.textContent = data.error || 'Bijwerken mislukt.';
    }
}

async function deleteHour(id) {
    if (!token || !window.confirm('Weet je zeker dat je deze urenregistratie wilt verwijderen?')) return;
    authMessage.textContent = 'Bezig met verwijderen...';
    const res = await fetch(`${API_BASE}/deleteHour`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (res.ok) {
        authMessage.textContent = 'Registratie succesvol verwijderd.';
        loadHours();
    } else if (res.status === 401) {
        setToken(null);
        authMessage.textContent = 'Sessie verlopen. Gelieve opnieuw in te loggen.';
    } else {
        authMessage.textContent = data.error || 'Verwijderen mislukt.';
    }
}

async function loadHours() {
    if (!token) return;
    const res = await fetch(`${API_BASE}/getHours`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
        setToken(null);
        return;
    }
    const data = await res.json();
    if (!res.ok) {
        authMessage.textContent = data.error || 'Ophalen mislukt';
        return;
    }
    allRows = data;
    renderTable();
}

// Helper functie om te checken of een dag kantoor is
function isOfficeDay(description) {
    if (!description) return false;
    const lowerDesc = description.toLowerCase();
    return lowerDesc.includes('kantoor');
}

// Bereken verdiensten
function calculateEarnings(rows) {
    let totalHours = 0;
    let officeDays = 0;

    rows.forEach(row => {
        totalHours += row.hours;
        if (isOfficeDay(row.description)) {
            officeDays++;
        }
    });

    const hourlyPay = totalHours * userSettings.hourlyRate;
    const travelAllowance = officeDays * OFFICE_KM * userSettings.kmRate;
    const totalGross = hourlyPay + travelAllowance;

    return {
        totalHours: totalHours.toFixed(2),
        hourlyPay: hourlyPay.toFixed(2),
        officeDays,
        travelAllowance: travelAllowance.toFixed(2),
        totalGross: totalGross.toFixed(2),
        hourlyRate: userSettings.hourlyRate,
        kmRate: userSettings.kmRate
    };
}

function savePeriod() {
    localStorage.setItem('periodStart', periodStartInput.value);
    localStorage.setItem('periodEnd', periodEndInput.value);
}

function shiftPeriod(direction) {
    const start = new Date(periodStartInput.value);
    const end = new Date(periodEndInput.value);

    // Bereken duur van huidige periode in milliseconden
    const duration = end.getTime() - start.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    let newStart, newEnd;

    if (direction === 'next') {
        // Nieuwe start is oude eind + 1 dag
        newStart = new Date(end.getTime() + oneDay);
        newEnd = new Date(newStart.getTime() + duration);
    } else {
        // Nieuwe eind is oude start - 1 dag
        newEnd = new Date(start.getTime() - oneDay);
        newStart = new Date(newEnd.getTime() - duration);
    }

    // Zet waardes terug (toISOString pakt UTC, wat goed werkt voor YYYY-MM-DD strings)
    periodStartInput.value = newStart.toISOString().slice(0, 10);
    periodEndInput.value = newEnd.toISOString().slice(0, 10);

    savePeriod();
    renderTable();
}

function renderTable() {
    hoursTableBody.innerHTML = '';
    if (!allRows || allRows.length === 0) {
        totalHoursMonthEl.textContent = '0';
        totalHoursAllEl.textContent = '0';
        totalEarningsEl.innerHTML = 'Geen data';
        return;
    }

    const periodStart = new Date(periodStartInput.value);
    const periodEnd = new Date(periodEndInput.value);
    periodEnd.setHours(23, 59, 59, 999); // Include hele dag

    let totalAll = 0;
    let filteredRows = [];

    // sorteer
    const sorted = [...allRows].sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        if (currentSort.by === 'date') {
            return currentSort.dir === 'asc' ? aDate - bDate : bDate - aDate;
        } else if (currentSort.by === 'hours') {
            return currentSort.dir === 'asc' ? a.hours - b.hours : b.hours - a.hours;
        } else if (currentSort.by === 'start') {
            const aStart = normalizeTime(a.startTime);
            const bStart = normalizeTime(b.startTime);
            return currentSort.dir === 'asc'
                ? aStart.localeCompare(bStart)
                : bStart.localeCompare(aStart);
        } else if (currentSort.by === 'end') {
            const aEnd = normalizeTime(a.endTime);
            const bEnd = normalizeTime(b.endTime);
            return currentSort.dir === 'asc'
                ? aEnd.localeCompare(bEnd)
                : bEnd.localeCompare(aEnd);
        }
        return 0;
    });

    sorted.forEach(row => {
        const rowDate = new Date(row.date);
        const formattedDate = rowDate.toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        totalAll += row.hours;

        if (rowDate >= periodStart && rowDate <= periodEnd) {
            filteredRows.push(row);

            const normalizedStartTime = normalizeTime(row.startTime);
            const normalizedEndTime = normalizeTime(row.endTime);

            const tr = document.createElement('tr');
            tr.dataset.id = row._id;
            tr.dataset.date = row.date.split('T')[0];
            tr.dataset.startTime = normalizedStartTime;
            tr.dataset.endTime = normalizedEndTime;
            tr.dataset.description = row.description || '';

            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td>${normalizedStartTime}</td>
                <td>${normalizedEndTime}</td>
                <td>${row.hours.toFixed(2)}</td>
                <td>${row.description || ''}</td>
                <td class="actions">
                    <button class="btn-edit">✏️</button>
                    <button class="btn-delete">🗑️</button>
                </td>
            `;

            // Edit knop
            tr.querySelector('.btn-edit').addEventListener('click', () => {
                const newDate = prompt('Datum (YYYY-MM-DD):', tr.dataset.date);
                if (!newDate) return;
                const newStart = prompt('Starttijd (HH:MM):', tr.dataset.startTime);
                if (!newStart) return;
                const newEnd = prompt('Eindtijd (HH:MM):', tr.dataset.endTime);
                if (!newEnd) return;
                const newDesc = prompt('Omschrijving:', tr.dataset.description);
                if (newDesc === null) return;
                updateHour(tr.dataset.id, newDate, newStart, newEnd, newDesc);
            });

            // Delete knop
            tr.querySelector('.btn-delete').addEventListener('click', () => {
                deleteHour(tr.dataset.id);
            });

            hoursTableBody.appendChild(tr);
        }
    });

    // Update totalen
    const earnings = calculateEarnings(filteredRows);
    totalHoursMonthEl.textContent = earnings.totalHours;
    totalHoursAllEl.textContent = totalAll.toFixed(2);

    totalEarningsEl.innerHTML = `
        <strong>Bruto verdiensten (periode):</strong><br>
        Uren: ${earnings.totalHours}u × €${earnings.hourlyRate.toFixed(2)} = €${earnings.hourlyPay}<br>
        Reiskosten: ${earnings.officeDays} kantoordag(en) × ${OFFICE_KM}km × €${earnings.kmRate.toFixed(2)} = €${earnings.travelAllowance}<br>
        <strong>Totaal bruto: €${earnings.totalGross}</strong>
    `;
}

function sortBy(column) {
    if (currentSort.by === column) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.by = column;
        currentSort.dir = 'desc';
    }
    renderTable();
}

function copyHoursToClipboard() {
    if (!allRows || allRows.length === 0) {
        alert('Geen uren om te kopiëren.');
        return;
    }

    const periodStart = new Date(periodStartInput.value);
    const periodEnd = new Date(periodEndInput.value);
    periodEnd.setHours(23, 59, 59, 999);

    const filteredRows = allRows.filter(row => {
        const rowDate = new Date(row.date);
        return rowDate >= periodStart && rowDate <= periodEnd;
    });

    if (filteredRows.length === 0) {
        alert('Geen uren in de geselecteerde periode.');
        return;
    }

    const sorted = filteredRows.sort((a, b) => new Date(a.date) - new Date(b.date));

    let text = 'Datum\tStart\tEind\tUren\tOmschrijving\n';
    sorted.forEach(row => {
        const rowDate = new Date(row.date);
        const formattedDate = rowDate.toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const startTime = normalizeTime(row.startTime);
        const endTime = normalizeTime(row.endTime);
        text += `${formattedDate}\t${startTime}\t${endTime}\t${row.hours.toFixed(2)}\t${row.description || ''}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        alert(`${filteredRows.length} dagen gekopieerd naar klembord (${periodStartInput.value} tot ${periodEndInput.value})`);
    }).catch(() => {
        alert('Kopiëren mislukt. Probeer nogmaals.');
    });
}

// Event listeners
registerBtn.addEventListener('click', register);
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', () => {
    setToken(null);
    authMessage.textContent = 'Uitgelogd.';
});

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        if (!settingsModal) return;
        hourlyRateInput.value = userSettings.hourlyRate;
        kmRateInput.value = userSettings.kmRate;
        settingsModal.style.display = 'block';
    });
}
if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });
}
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
}
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}
window.addEventListener('click', (event) => {
    if (event.target === settingsModal) { settingsModal.style.display = 'none'; }
});
addHoursBtn.addEventListener('click', addHours);
copyBtn.addEventListener('click', copyHoursToClipboard);
migrateBtn.addEventListener('click', migrateOldData);

periodStartInput.addEventListener('change', () => {
    savePeriod();
    renderTable();
});
periodEndInput.addEventListener('change', () => {
    savePeriod();
    renderTable();
});
prevPeriodBtn.addEventListener('click', () => shiftPeriod('prev'));
nextPeriodBtn.addEventListener('click', () => shiftPeriod('next'));

// Sorteer headers
document.getElementById('th-date').addEventListener('click', () => sortBy('date'));
document.getElementById('th-start').addEventListener('click', () => sortBy('start'));
document.getElementById('th-end').addEventListener('click', () => sortBy('end'));
document.getElementById('th-hours').addEventListener('click', () => sortBy('hours'));

// Initialiseer
updateUI();
