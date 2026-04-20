const API_BASE = '/api/v1';
const TOKEN_KEY = 'banarica_admin_token';

const modules = [
  {
    key: 'usuarios',
    label: 'Usuarios',
    description: 'Administra cuentas internas y roles del sistema.',
    endpoint: `${API_BASE}/usuarios`,
    idField: 'username',
    requiresAuth: true,
    fields: [
      { name: 'username', label: 'Usuario', type: 'text', required: true },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'apellido', label: 'Apellido', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'password', label: 'Clave', type: 'password', required: true, createOnly: true },
      { name: 'tel', label: 'Telefono', type: 'text', required: true },
      { name: 'id_rol', label: 'Rol', type: 'select', required: true, options: ['Super administrador', 'Operador'] },
      { name: 'isBlock', label: 'Bloqueado', type: 'checkbox' }
    ],
    columns: ['username', 'nombre', 'apellido', 'email', 'id_rol', 'isBlock']
  },
  {
    key: 'almacenes',
    label: 'Almacenes',
    description: 'Gestiona bodegas, direcciones y canales de contacto.',
    endpoint: `${API_BASE}/almacenes`,
    idField: 'consecutivo',
    fields: [
      { name: 'consecutivo', label: 'Consecutivo', type: 'text', helper: 'Opcional. Si existe, se usa para editar.' },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'razon_social', label: 'Razon social', type: 'text', required: true },
      { name: 'direccion', label: 'Direccion', type: 'text', required: true },
      { name: 'telefono', label: 'Telefono', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'isBlock', label: 'Bloqueado', type: 'checkbox' }
    ],
    columns: ['consecutivo', 'nombre', 'razon_social', 'telefono', 'email', 'isBlock']
  },
  {
    key: 'categorias',
    label: 'Categorias',
    description: 'Crea y edita categorias base para inventario.',
    endpoint: `${API_BASE}/categorias`,
    idField: 'consecutivo',
    fields: [
      { name: 'consecutivo', label: 'Consecutivo', type: 'text', helper: 'Opcional al crear.' },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'isBlock', label: 'Bloqueada', type: 'checkbox' }
    ],
    columns: ['consecutivo', 'nombre', 'isBlock']
  },
  {
    key: 'proveedores',
    label: 'Proveedores',
    description: 'Gestiona proveedores con sus datos operativos.',
    endpoint: `${API_BASE}/proveedores`,
    idField: 'consecutivo',
    fields: [
      { name: 'consecutivo', label: 'Consecutivo', type: 'text', helper: 'Opcional al crear.' },
      { name: 'razon_social', label: 'Razon social', type: 'text', required: true },
      { name: 'direccion', label: 'Direccion', type: 'text', required: true },
      { name: 'tel', label: 'Telefono', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'isBlock', label: 'Bloqueado', type: 'checkbox' }
    ],
    columns: ['consecutivo', 'razon_social', 'tel', 'email', 'isBlock']
  },
  {
    key: 'productos',
    label: 'Productos',
    description: 'Gestiona catalogo, costos y configuraciones de inventario.',
    endpoint: `${API_BASE}/productos`,
    idField: 'consecutivo',
    fields: [
      { name: 'consecutivo', label: 'Consecutivo', type: 'text', helper: 'Opcional al crear.' },
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'bulto', label: 'Bulto', type: 'number', required: true },
      { name: 'cons_categoria', label: 'Categoria', type: 'text', required: true },
      { name: 'cons_proveedor', label: 'Proveedor', type: 'text', required: true },
      { name: 'salida_sin_stock', label: 'Salida sin stock', type: 'checkbox' },
      { name: 'serial', label: 'Maneja serial', type: 'checkbox' },
      { name: 'permitir_traslados', label: 'Permite traslados', type: 'checkbox' },
      { name: 'costo', label: 'Costo', type: 'number', required: true },
      { name: 'isBlock', label: 'Bloqueado', type: 'checkbox' }
    ],
    columns: ['consecutivo', 'name', 'cons_categoria', 'cons_proveedor', 'costo', 'isBlock']
  }
];

const state = {
  currentModule: modules[0],
  records: [],
  selectedRecord: null,
  token: localStorage.getItem(TOKEN_KEY) || ''
};

const moduleNav = document.getElementById('module-nav');
const moduleTitle = document.getElementById('module-title');
const moduleDescription = document.getElementById('module-description');
const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const recordForm = document.getElementById('record-form');
const formTitle = document.getElementById('form-title');
const statusLog = document.getElementById('status-log');
const sessionStatus = document.getElementById('session-status');
const searchInput = document.getElementById('search-input');

function logStatus(message, data) {
  const suffix = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  statusLog.textContent = `${new Date().toLocaleTimeString()}\n${message}${suffix}`;
}

function authHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...extra
  };
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {})
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = text;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || text || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function updateSessionStatus() {
  sessionStatus.textContent = state.token
    ? 'Token JWT activo en este navegador.'
    : 'Sin token activo.';
}

function renderModules() {
  moduleNav.innerHTML = '';

  modules.forEach((module) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `module-button${state.currentModule.key === module.key ? ' active' : ''}`;
    button.textContent = module.label;
    button.addEventListener('click', () => {
      state.currentModule = module;
      state.selectedRecord = null;
      searchInput.value = '';
      renderModules();
      renderModuleInfo();
      renderForm();
      loadRecords();
    });
    moduleNav.appendChild(button);
  });
}

function renderModuleInfo() {
  moduleTitle.textContent = state.currentModule.label;
  moduleDescription.textContent = state.currentModule.description;
}

function fieldValue(record, field) {
  return record?.[field.name];
}

function renderForm() {
  const module = state.currentModule;
  const editing = Boolean(state.selectedRecord);

  formTitle.textContent = editing ? `Editando ${module.label.slice(0, -1) || module.label}` : `Nuevo ${module.label.slice(0, -1) || module.label}`;
  recordForm.innerHTML = '';

  module.fields.forEach((field) => {
    if (!editing && field.editOnly) return;
    if (editing && field.createOnly && field.name === 'password') {
      // Keep password optional when editing.
    }

    const wrapper = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = field.label;
    wrapper.appendChild(caption);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach((option) => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        input.appendChild(optionElement);
      });
    } else if (field.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'checkbox';
    } else {
      input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
      input.type = field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text';
      if (field.type === 'number') {
        input.step = 'any';
      }
    }

    input.name = field.name;
    if (field.required && (!editing || !field.createOnly)) {
      input.required = true;
    }

    if (editing) {
      if (field.type === 'checkbox') {
        input.checked = Boolean(fieldValue(state.selectedRecord, field));
      } else if (field.type !== 'password') {
        input.value = fieldValue(state.selectedRecord, field) ?? '';
      }
    } else if (field.type === 'checkbox') {
      input.checked = false;
    }

    if (editing && field.name === module.idField) {
      input.readOnly = true;
    }

    wrapper.appendChild(input);

    if (field.helper) {
      const helper = document.createElement('small');
      helper.className = 'helper';
      helper.textContent = field.helper;
      wrapper.appendChild(helper);
    }

    recordForm.appendChild(wrapper);
  });

  const actionBar = document.createElement('div');
  actionBar.className = 'toolbar';

  const submit = document.createElement('button');
  submit.className = 'primary';
  submit.type = 'submit';
  submit.textContent = editing ? 'Guardar cambios' : 'Crear registro';

  actionBar.appendChild(submit);
  recordForm.appendChild(actionBar);
}

function filteredRecords() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return state.records;

  return state.records.filter((record) =>
    JSON.stringify(record).toLowerCase().includes(term)
  );
}

function renderTable() {
  const module = state.currentModule;
  const records = filteredRecords();

  tableHead.innerHTML = '';
  tableBody.innerHTML = '';

  const headerRow = document.createElement('tr');
  [...module.columns, 'acciones'].forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  records.forEach((record) => {
    const row = document.createElement('tr');

    module.columns.forEach((column) => {
      const td = document.createElement('td');
      const value = record[column];
      td.textContent = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
      row.appendChild(td);
    });

    const actions = document.createElement('td');
    actions.className = 'cell-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'ghost';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => {
      state.selectedRecord = record;
      renderForm();
      logStatus(`Registro cargado para edicion: ${record[module.idField] || 'sin id'}`);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'ghost danger';
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => deleteRecord(record));

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    tableBody.appendChild(row);
  });

  if (records.length === 0) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = module.columns.length + 1;
    td.textContent = 'No hay registros para mostrar.';
    row.appendChild(td);
    tableBody.appendChild(row);
  }
}

function normalizeRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.usuario) return [payload];
  return [];
}

async function loadRecords() {
  const module = state.currentModule;

  try {
    const payload = await apiFetch(module.endpoint);
    state.records = normalizeRecords(payload);
    renderTable();
    logStatus(`Datos cargados para ${module.label}.`, { total: state.records.length });
  } catch (error) {
    state.records = [];
    renderTable();
    logStatus(`No se pudo cargar ${module.label}: ${error.message}`);
  }
}

function readFormData() {
  const module = state.currentModule;
  const data = {};

  module.fields.forEach((field) => {
    const element = recordForm.elements.namedItem(field.name);
    if (!element) return;

    if (field.type === 'checkbox') {
      data[field.name] = element.checked;
      return;
    }

    if (field.type === 'number') {
      data[field.name] = element.value === '' ? null : Number(element.value);
      return;
    }

    if (field.type === 'password' && state.selectedRecord && !element.value) {
      return;
    }

    if (element.value !== '') {
      data[field.name] = element.value;
    }
  });

  return data;
}

async function saveRecord(event) {
  event.preventDefault();
  const module = state.currentModule;
  const payload = readFormData();
  const editing = Boolean(state.selectedRecord);

  try {
    if (editing) {
      const id = state.selectedRecord[module.idField];
      await apiFetch(`${module.endpoint}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      logStatus(`Registro actualizado en ${module.label}.`, payload);
    } else {
      await apiFetch(module.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      logStatus(`Registro creado en ${module.label}.`, payload);
    }

    state.selectedRecord = null;
    renderForm();
    await loadRecords();
  } catch (error) {
    logStatus(`No se pudo guardar en ${module.label}: ${error.message}`, payload);
  }
}

async function deleteRecord(record) {
  const module = state.currentModule;
  const id = record[module.idField];

  if (!window.confirm(`Vas a eliminar "${id}". Esta accion no se puede deshacer.`)) {
    return;
  }

  try {
    await apiFetch(`${module.endpoint}/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (state.selectedRecord?.[module.idField] === id) {
      state.selectedRecord = null;
      renderForm();
    }
    await loadRecords();
    logStatus(`Registro eliminado de ${module.label}: ${id}`);
  } catch (error) {
    logStatus(`No se pudo eliminar ${id}: ${error.message}`);
  }
}

async function login(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const text = await response.text();
    let payload = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch (error) {
      payload = text;
    }

    if (!response.ok) {
      throw new Error(payload?.message || payload || 'No fue posible iniciar sesion');
    }

    state.token = payload.token;
    localStorage.setItem(TOKEN_KEY, state.token);
    updateSessionStatus();
    logStatus('Sesion iniciada correctamente.', payload.usuario);
    await loadRecords();
  } catch (error) {
    logStatus(`Error de autenticacion: ${error.message}`);
  }
}

async function loadProfile() {
  if (!state.token) {
    logStatus('No hay token activo para consultar el perfil.');
    return;
  }

  try {
    const profile = await apiFetch(`${API_BASE}/auth/profile`);
    logStatus('Perfil cargado.', profile);
  } catch (error) {
    logStatus(`No se pudo cargar el perfil: ${error.message}`);
  }
}

function logout() {
  state.token = '';
  localStorage.removeItem(TOKEN_KEY);
  updateSessionStatus();
  logStatus('Sesion cerrada.');
}

document.getElementById('login-form').addEventListener('submit', login);
document.getElementById('load-profile').addEventListener('click', loadProfile);
document.getElementById('logout').addEventListener('click', logout);
document.getElementById('refresh-data').addEventListener('click', loadRecords);
document.getElementById('new-record').addEventListener('click', () => {
  state.selectedRecord = null;
  renderForm();
  logStatus(`Formulario listo para crear en ${state.currentModule.label}.`);
});
document.getElementById('reset-form').addEventListener('click', () => {
  state.selectedRecord = null;
  renderForm();
});
document.getElementById('search-input').addEventListener('input', renderTable);
recordForm.addEventListener('submit', saveRecord);

updateSessionStatus();
renderModules();
renderModuleInfo();
renderForm();
loadRecords();
