const API_BASE = '/api'; // via netlify.toml redirect

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
const totalHoursCell = document.getElementById('totalHours');

// Stel de datum van vandaag in als standaard
dateInput.valueAsDate = new Date();

function updateUI() {
  if (token) {
    hoursSection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    // Verberg de login/register knoppen als je ingelogd bent
    registerBtn.style.display = 'none';
    loginBtn.style.display = 'none';
    
    authMessage.textContent = 'Ingelogd. Welkom!';
    loadHours();
  } else {
    hoursSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    registerBtn.style.display = 'inline-block';
    loginBtn.style.display = 'inline-block';
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
    // Reset inputs en update tabel
    // dateInput.value = ''; // Datum laten staan
    // startTimeInput.value = ''; // Tijd laten staan
    // endTimeInput.value = '';
    descriptionInput.value = '';
    authMessage.textContent = 'Uren succesvol opgeslagen.';
    loadHours();
  }
}

async function deleteHour(id) {
    // Gebruik een custom modal of confirm voor eenvoud
    if (!token || !window.confirm('Weet je zeker dat je deze urenregistratie wilt verwijderen?')) return;

    authMessage.textContent = 'Bezig met verwijderen...';

    const res = await fetch(`${API_BASE}/deleteHour`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id }) // Stuur de MongoDB ID mee
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
  
  hoursTableBody.innerHTML = '';
  let totalHours = 0; // Totaal uren teller
  
  // Sorteer de uren op datum (meest recente eerst)
  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  data.forEach(row => {
    const tr = document.createElement('tr');
    
    // Gebruik de startTijd en eindTijd van MongoDB, dit zijn ISO strings
    const startObj = new Date(row.startTime);
    const endObj = new Date(row.endTime);
    
    // Formatteer de datum 
    const formattedDate = startObj.toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' });
    
    // Formatteer de tijd
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const startTimeFormatted = startObj.toLocaleTimeString('nl-NL', timeOptions);
    const endTimeFormatted = endObj.toLocaleTimeString('nl-NL', timeOptions);

    totalHours += row.hours; // Totaal optellen

    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${startTimeFormatted}</td>
      <td>${endTimeFormatted}</td>
      <td>${row.hours.toFixed(2)}</td>
      <td>${row.description || '—'}</td>
      <td><button class="delete-btn" data-id="${row._id}">Verwijder</button></td>
    `;
    hoursTableBody.appendChild(tr);
  });

  // Update de totaalrij
  totalHoursCell.textContent = totalHours.toFixed(2);

  // Voeg event listeners toe aan de nieuwe delete knoppen
  document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => {
          // Haal de MongoDB ID op die we in de data-id hebben gezet
          const id = e.target.getAttribute('data-id'); 
          deleteHour(id);
      });
  });
}

// --- Event Listeners ---
registerBtn.addEventListener('click', register);
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', () => setToken(null));
addHoursBtn.addEventListener('click', addHours);

// init
updateUI();