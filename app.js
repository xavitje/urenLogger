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

function updateUI() {
  if (token) {
    hoursSection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    authMessage.textContent = 'Ingelogd';
    loadHours();
  } else {
    hoursSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    authMessage.textContent = '';
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
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok && data.token) {
    setToken(data.token);
    authMessage.textContent = 'Registratie gelukt';
  } else {
    authMessage.textContent = data.error || 'Registratie mislukt';
  }
}

async function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok && data.token) {
    setToken(data.token);
    authMessage.textContent = 'Login gelukt';
  } else {
    authMessage.textContent = data.error || 'Login mislukt';
  }
}

async function addHours() {
  if (!token) {
    authMessage.textContent = 'Eerst inloggen';
    return;
  }
  const res = await fetch(`${API_BASE}/addHours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      date: dateInput.value,
      hours: Number(hoursInput.value),
      description: descriptionInput.value
    })
  });
  const data = await res.json();
  if (!res.ok) {
    authMessage.textContent = data.error || 'Opslaan mislukt';
  } else {
    dateInput.value = '';
    hoursInput.value = '';
    descriptionInput.value = '';
    loadHours();
  }
}

async function loadHours() {
  if (!token) return;
  const res = await fetch(`${API_BASE}/getHours`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  if (!res.ok) {
    authMessage.textContent = data.error || 'Ophalen mislukt';
    return;
  }
  hoursTableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    const d = new Date(row.date);
    tr.innerHTML = `
      <td>${d.toISOString().substring(0, 10)}</td>
      <td>${row.hours}</td>
      <td>${row.description || ''}</td>
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
