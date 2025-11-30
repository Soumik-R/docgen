const API_BASE = "http://127.0.0.1:5000";

const state = {
  users: [],
  sessions: [],
  documents: [],
  requests: [],
};

const selectors = {
  refreshBtn: document.getElementById("refresh-btn"),
  userForm: document.getElementById("user-form"),
  sessionForm: document.getElementById("session-form"),
  documentForm: document.getElementById("document-form"),
  generationForm: document.getElementById("generation-form"),
  userList: document.getElementById("user-list"),
  sessionList: document.getElementById("session-list"),
  documentList: document.getElementById("document-list"),
  requestList: document.getElementById("request-list"),
};

async function fetchJSON(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

function renderList(target, items, formatter) {
  target.innerHTML =
    items.map((item) => `<li>${formatter(item)}</li>`).join("") ||
    `<li class="text-xs text-slate-500">No data yet</li>`;
}

async function loadUsers() {
  const data = await fetchJSON("/api/auth/users");
  state.users = data.users ?? [];
  renderList(selectors.userList, state.users, (user) => {
    return `<strong>${user.display_name}</strong><br/><span class="text-xs text-slate-500">${user.email} · ${user.id}</span>`;
  });
}

async function loadSessions() {
  const data = await fetchJSON("/api/auth/sessions");
  state.sessions = data.sessions ?? [];
  renderList(selectors.sessionList, state.sessions, (session) => {
    return `<span>Session ${session.id}</span><br/><span class="text-xs text-slate-500">User ${session.user_id}</span>`;
  });
}

async function loadDocuments() {
  const data = await fetchJSON("/api/documents/");
  state.documents = data.documents ?? [];
  renderList(selectors.documentList, state.documents, (doc) => {
    return `<strong>${doc.title}</strong><br/><span class="text-xs text-slate-500">${doc.doc_type.toUpperCase()} · ${doc.id}</span>`;
  });
}

async function loadRequests() {
  const data = await fetchJSON("/api/generation/requests");
  state.requests = data.requests ?? [];
  renderList(selectors.requestList, state.requests, (req) => {
    return `<strong>${req.prompt.slice(0, 40)}${req.prompt.length > 40 ? "…" : ""}</strong><br/><span class="text-xs text-slate-500">${req.status}</span>`;
  });
}

async function refreshAll() {
  await Promise.all([loadUsers(), loadSessions(), loadDocuments(), loadRequests()]);
}

function handleForm(form, handler) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      if (value !== "") {
        payload[key] = value;
      }
    });
    try {
      form.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
      await handler(payload);
      form.reset();
      await refreshAll();
    } catch (error) {
      alert(error.message);
    } finally {
      form.querySelectorAll("button").forEach((btn) => (btn.disabled = false));
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  handleForm(selectors.userForm, (payload) =>
    fetchJSON("/api/auth/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );

  handleForm(selectors.sessionForm, (payload) =>
    fetchJSON("/api/auth/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );

  handleForm(selectors.documentForm, (payload) =>
    fetchJSON("/api/documents/", {
      method: "POST",
      body: JSON.stringify({ ...payload, tags: [] }),
    }),
  );

  handleForm(selectors.generationForm, (payload) =>
    fetchJSON("/api/generation/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );

  selectors.refreshBtn.addEventListener("click", refreshAll);

  refreshAll();
});
