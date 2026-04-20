const API_BASE = '/api/v1';

const requestForm = document.getElementById('recovery-request-form');
const resetForm = document.getElementById('reset-password-form');
const statusBox = document.getElementById('recovery-status');
const tokenInput = document.getElementById('reset-token');
const passwordInput = document.getElementById('reset-password');
const confirmInput = document.getElementById('reset-password-confirm');

function setStatus(message, data) {
  const suffix = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  statusBox.textContent = `${new Date().toLocaleTimeString()}\n${message}${suffix}`;
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token') || '';
}

async function parseResponse(response) {
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || text || `HTTP ${response.status}`);
  }

  return payload;
}

async function requestRecovery(event) {
  event.preventDefault();
  const username = document.getElementById('recovery-username').value.trim();

  try {
    const response = await fetch(`${API_BASE}/auth/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    const payload = await parseResponse(response);
    setStatus('Correo de recuperacion enviado.', payload);
    requestForm.reset();
  } catch (error) {
    setStatus(`No se pudo enviar el correo: ${error.message}`);
  }
}

async function resetPassword(event) {
  event.preventDefault();
  const token = tokenInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!token) {
    setStatus('Falta el token de recuperacion.');
    return;
  }

  if (password.length < 6) {
    setStatus('La nueva contrasena debe tener al menos 6 caracteres.');
    return;
  }

  if (password !== confirm) {
    setStatus('Las contrasenas no coinciden.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/changePassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    const payload = await parseResponse(response);
    setStatus('Contrasena actualizada correctamente. Ya puedes volver al panel e iniciar sesion.', payload);
    resetForm.reset();
    tokenInput.value = token;
  } catch (error) {
    setStatus(`No se pudo cambiar la contrasena: ${error.message}`);
  }
}

const initialToken = getTokenFromUrl();
if (initialToken) {
  tokenInput.value = initialToken;
  setStatus('Token detectado en el enlace. Ya puedes escribir tu nueva contrasena.');
}

requestForm.addEventListener('submit', requestRecovery);
resetForm.addEventListener('submit', resetPassword);
