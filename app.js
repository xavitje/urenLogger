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
const hoursInput = document.getElementById('hours');
const descriptionInput = document.getElementById('description');
const addHoursBtn = document.getElementById('addHoursBtn');
const hoursTableBody = document.getElementById('hoursTableBody');

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
  
  const hoursValue = Number(hoursInput.value);

  if (!dateInput.value || hoursValue <= 0 || isNaN(hoursValue)) {
      authMessage.textContent = 'Vul een geldige datum en uren (> 0) in.';
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
      hours: hoursValue,
      description: descriptionInput.value
    })
  });
  const data = await res.json();
  if (!res.ok) {
    authMessage.textContent = data.error || 'Opslaan mislukt';
  } else {
    // Reset inputs en update tabel
    // dateInput.value = ''; // Datum laten staan is vaak handig
    hoursInput.value = '';
    descriptionInput.value = '';
    authMessage.textContent = 'Uren succesvol opgeslagen.';
    loadHours();
  }
}

async function loadHours() {
  if (!token) return;
  const res = await fetch(`${API_BASE}/getHours`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  if (res.status === 401) { // Ongeautoriseerd, token is verlopen of ongeldig
      setToken(null);
      return;
  }

  const data = await res.json();
  if (!res.ok) {
    authMessage.textContent = data.error || 'Ophalen mislukt';
    return;
  }
  
  hoursTableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    const d = new Date(row.date);
    // Vriendelijker datumformaat
    const formattedDate = d.toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' });
    
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${row.hours}</td>
      <td>${row.description || '—'}</td>
    `;
    hoursTableBody.appendChild(tr);
  });
}

registerBtn.addEventListener('click', register);
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', () => setToken(null));
addHoursBtn.addEventListener('click', addHours);

// init
updateUI();