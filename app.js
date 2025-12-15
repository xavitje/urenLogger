const API_BASE = '/api';
let token = localStorage.getItem('token') || null;

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('authMessage');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const hoursSection = document.getElementById('hoursSection');
const dateInput = document.getElementById('date');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const descriptionInput = document.getElementById('description');
const addHoursBtn = document.getElementById('addHoursBtn');
const hoursTableBody = document.getElementById('hoursTableBody');
const monthInput = document.getElementById('monthSelect');
const totalHoursMonthEl = document.getElementById('totalHoursMonth');
const totalHoursAllEl = document.getElementById('totalHoursAll');
const copyBtn = document.getElementById('copyBtn');

let allRows = [];
let currentSort = { by: 'date', dir: 'desc' };

// Stel de datum van vandaag in als standaard
dateInput.valueAsDate = new Date();
monthInput.value = new Date().toISOString().slice(0, 7); // yyyy-MM

function updateUI() {
  if (token) {
    hoursSection.style.display = 'block';
    logoutBtn.style.display = 'inline-flex';
    registerBtn.style.display = 'none';
    loginBtn.style.display = 'none';
    authMessage.textContent = 'Ingelogd. Welkom!';
    loadHours();
  } else {
    hoursSection.style.display = 'none';
    logoutBtn.style.display = 'none';
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

function renderTable() {
  hoursTableBody.innerHTML = '';

  if (!allRows || allRows.length === 0) {
    totalHoursMonthEl.textContent = '0';
    totalHoursAllEl.textContent = '0';
    return;
  }

  const monthValue = monthInput.value; // 'yyyy-mm'
  const [yearStr, monthStr] = monthValue.split('-');
  const selectedYear = parseInt(yearStr, 10);
  const selectedMonthIdx = parseInt(monthStr, 10) - 1;

  let totalAll = 0;
  let totalMonth = 0;

  // sorteer
  const sorted = [...allRows].sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);

    if (currentSort.by === 'date') {
      return currentSort.dir === 'asc' ? aDate - bDate : bDate - aDate;
    } else if (currentSort.by === 'hours') {
      return currentSort.dir === 'asc' ? a.hours - b.hours : b.hours - a.hours;
    } else if (currentSort.by === 'start') {
      const aStart = new Date(a.startTime);
      const bStart = new Date(b.startTime);
      return currentSort.dir === 'asc' ? aStart - bStart : bStart - aStart;
    } else if (currentSort.by === 'end') {
      const aEnd = new Date(a.endTime);
      const bEnd = new Date(b.endTime);
      return currentSort.dir === 'asc' ? aEnd - bEnd : bEnd - aEnd;
    }
    return 0;
  });

  sorted.forEach(row => {
    const startObj = new Date(row.startTime);
    const endObj = new Date(row.endTime);
    const rowDate = new Date(row.date);

    const formattedDate = rowDate.toLocaleDateString('nl-NL', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const startTimeFormatted = startObj.toLocaleTimeString('nl-NL', timeOptions);
    const endTimeFormatted = endObj.toLocaleTimeString('nl-NL', timeOptions);

    totalAll += row.hours;

    if (rowDate.getFullYear() === selectedYear && rowDate.getMonth() === selectedMonthIdx) {
      totalMonth += row.hours;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td>${startTimeFormatted}</td>
        <td>${endTimeFormatted}</td>
        <td>${row.hours.toFixed(2)}</td>
        <td>${row.description || ''}</td>
        <td class="actions-cell">
          <button class="button small danger" data-id="${row._id}">Verwijder</button>
        </td>
      `;
      hoursTableBody.appendChild(tr);
    }
  });

  totalHoursMonthEl.textContent = totalMonth.toFixed(2);
  totalHoursAllEl.textContent = totalAll.toFixed(2);

  // click‑handlers voor delete per rij
  hoursTableBody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteHour(id);
    });
  });
}

// Functie om tabeldata te kopiëren
function copyTableData() {
  const monthValue = monthInput.value;
  const [yearStr, monthStr] = monthValue.split('-');
  const selectedYear = parseInt(yearStr, 10);
  const selectedMonthIdx = parseInt(monthStr, 10) - 1;

  // Filter rijen voor de geselecteerde maand
  const filteredRows = allRows.filter(row => {
    const rowDate = new Date(row.date);
    return rowDate.getFullYear() === selectedYear && rowDate.getMonth() === selectedMonthIdx;
  });

  if (filteredRows.length === 0) {
    authMessage.textContent = 'Geen gegevens om te kopiëren.';
    return;
  }

  // Sorteer volgens huidige sorteerinstelling
  const sorted = [...filteredRows].sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);

    if (currentSort.by === 'date') {
      return currentSort.dir === 'asc' ? aDate - bDate : bDate - aDate;
    } else if (currentSort.by === 'hours') {
      return currentSort.dir === 'asc' ? a.hours - b.hours : b.hours - a.hours;
    } else if (currentSort.by === 'start') {
      const aStart = new Date(a.startTime);
      const bStart = new Date(b.startTime);
      return currentSort.dir === 'asc' ? aStart - bStart : bStart - aStart;
    } else if (currentSort.by === 'end') {
      const aEnd = new Date(a.endTime);
      const bEnd = new Date(b.endTime);
      return currentSort.dir === 'asc' ? aEnd - bEnd : bEnd - aEnd;
    }
    return 0;
  });

  // Maak tekstversie met tabs voor Excel/spreadsheets
  let text = 'Datum\tStart\tEind\tUren\tOmschrijving\n';
  
  sorted.forEach(row => {
    const startObj = new Date(row.startTime);
    const endObj = new Date(row.endTime);
    const rowDate = new Date(row.date);

    const formattedDate = rowDate.toLocaleDateString('nl-NL', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const startTimeFormatted = startObj.toLocaleTimeString('nl-NL', timeOptions);
    const endTimeFormatted = endObj.toLocaleTimeString('nl-NL', timeOptions);

    text += `${formattedDate}\t${startTimeFormatted}\t${endTimeFormatted}\t${row.hours.toFixed(2)}\t${row.description || ''}\n`;
  });

  // Kopieer naar klembord
  navigator.clipboard.writeText(text).then(() => {
    authMessage.textContent = `${sorted.length} rij${sorted.length !== 1 ? 'en' : ''} gekopieerd naar klembord.`;
  }).catch(err => {
    console.error('Kopiëren mislukt:', err);
    authMessage.textContent = 'Kopiëren mislukt. Zorg ervoor dat je toestemming hebt gegeven.';
  });
}

// Event listeners
registerBtn.addEventListener('click', register);
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', () => setToken(null));
addHoursBtn.addEventListener('click', addHours);
monthInput.addEventListener('change', renderTable);
copyBtn.addEventListener('click', copyTableData);

document.querySelectorAll('.table-surface th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const sortKey = th.dataset.sort;
    if (!sortKey) return;

    if (currentSort.by === sortKey) {
      currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.by = sortKey;
      currentSort.dir = 'asc';
    }
    renderTable();
  });
});

// init
updateUI();
