const API_BASE = "http://127.0.0.1:5000";

const state = {
    users: [],
    sessions: [],
    documents: [],
    requests: [],
};

const selectors = {
    refreshBtn: document.getElementById("refresh-btn"),
    logoutBtn: document.getElementById("logout-btn"),
    userForm: document.getElementById("user-form"),
    sessionForm: document.getElementById("session-form"),
    documentForm: document.getElementById("document-form"),
    generationForm: document.getElementById("generation-form"),
    userList: document.getElementById("user-list"),
    sessionList: document.getElementById("session-list"),
    documentList: document.getElementById("document-list"),
    requestList: document.getElementById("request-list"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toast-message"),
    userCount: document.getElementById("user-count"),
    sessionCount: document.getElementById("session-count"),
    documentCount: document.getElementById("document-count"),
    requestCount: document.getElementById("request-count"),
};

// Check login status
function checkLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    showToast('✓ Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Toast notification system
function showToast(message, type = 'success') {
    selectors.toastMessage.textContent = message;
    selectors.toast.className = `toast show ${type}`;
    setTimeout(() => {
        selectors.toast.className = 'toast hidden';
    }, 3000);
}

// Copy to clipboard helper
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

async function fetchJSON(path, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Request failed");
        }
        return response.json();
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to backend. Make sure the server is running.');
        }
        throw error;
    }
}

function renderList(target, items, formatter) {
    if (items.length === 0) {
        target.innerHTML = '';
        return;
    }
    target.innerHTML = items.map((item) => `<li>${formatter(item)}</li>`).join("");
}

async function loadUsers() {
    const data = await fetchJSON("/api/auth/users");
    state.users = data.users ?? [];
    selectors.userCount.textContent = state.users.length;
    renderList(selectors.userList, state.users, (user) => {
        const roleIcon = user.role === 'author' ? '✍️' : '👁️';
        return `
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span>${roleIcon}</span>
            <strong class="text-slate-900">${user.display_name}</strong>
            <span class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">${user.role}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">${user.email}</p>
          <div class="flex items-center gap-2 mt-2">
            <code class="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">${user.id}</code>
            <button onclick="copyToClipboard('${user.id}')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">📋 Copy ID</button>
          </div>
        </div>
      </div>
    `;
    });
}

async function loadSessions() {
    const data = await fetchJSON("/api/auth/sessions");
    state.sessions = data.sessions ?? [];
    selectors.sessionCount.textContent = state.sessions.length;
    renderList(selectors.sessionList, state.sessions, (session) => {
        const user = state.users.find(u => u.id === session.user_id);
        const userName = user ? user.display_name : 'Unknown User';
        return `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-slate-900">🔑 Session</span>
          <span class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
        </div>
        <p class="text-xs text-slate-600">User: ${userName}</p>
        <code class="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded block mt-2">${session.id}</code>
      </div>
    `;
    });
}

async function loadDocuments() {
    const data = await fetchJSON("/api/documents/");
    state.documents = data.documents ?? [];
    selectors.documentCount.textContent = state.documents.length;
    renderList(selectors.documentList, state.documents, (doc) => {
        const typeIcon = doc.doc_type === 'docx' ? '📝' : '📊';
        const owner = state.users.find(u => u.id === doc.owner_id);
        const ownerName = owner ? owner.display_name : 'Unknown';
        return `
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">${typeIcon}</span>
          <strong class="text-slate-900 flex-1">${doc.title}</strong>
          <span class="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full uppercase">${doc.doc_type}</span>
        </div>
        <p class="text-xs text-slate-600">Owner: ${ownerName}</p>
        <div class="flex items-center gap-2 mt-2">
          <code class="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">${doc.id}</code>
          <button onclick="copyToClipboard('${doc.id}')" class="text-xs text-purple-600 hover:text-purple-700 font-medium">📋 Copy ID</button>
        </div>
      </div>
    `;
    });
}

async function loadRequests() {
    const data = await fetchJSON("/api/generation/requests");
    state.requests = data.requests ?? [];
    selectors.requestCount.textContent = state.requests.length;
    renderList(selectors.requestList, state.requests, (req) => {
        const statusClass = req.status === 'completed' ? 'status-completed' :
            req.status === 'failed' ? 'status-failed' : 'status-pending';
        const statusIcon = req.status === 'completed' ? '✓' :
            req.status === 'failed' ? '✗' : '⏳';
        const doc = state.documents.find(d => d.id === req.document_id);
        const docTitle = doc ? doc.title : 'Unknown Document';
        return `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg">✨</span>
          <span class="${statusClass}">${statusIcon} ${req.status}</span>
        </div>
        <p class="text-sm text-slate-900 font-medium mb-1">${req.prompt.slice(0, 60)}${req.prompt.length > 60 ? "..." : ""}</p>
        <p class="text-xs text-slate-600 mb-2">Document: ${docTitle}</p>
        ${req.tone ? `<p class="text-xs text-slate-500">Tone: ${req.tone}</p>` : ''}
        <code class="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded block mt-2">${req.id}</code>
      </div>
    `;
    });
}

async function refreshAll() {
    await Promise.all([loadUsers(), loadSessions(), loadDocuments(), loadRequests()]);
}

function handleForm(form, handler, successMessage) {
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
            const buttons = form.querySelectorAll("button[type='submit']");
            buttons.forEach((btn) => {
                btn.disabled = true;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';
                btn.dataset.original = originalText;
            });
            await handler(payload);
            form.reset();
            await refreshAll();
            showToast(successMessage, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            const buttons = form.querySelectorAll("button[type='submit']");
            buttons.forEach((btn) => {
                btn.disabled = false;
                if (btn.dataset.original) {
                    btn.innerHTML = btn.dataset.original;
                }
            });
        }
    });
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.remove('hidden');
}

document.addEventListener("DOMContentLoaded", () => {
    // Check if user is logged in
    checkLogin();

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Close guide button
    const closeGuideBtn = document.getElementById('close-guide');
    if (closeGuideBtn) {
        closeGuideBtn.addEventListener('click', () => {
            document.getElementById('quick-guide').style.display = 'none';
        });
    }

    // Logout button
    if (selectors.logoutBtn) {
        selectors.logoutBtn.addEventListener('click', logout);
    }

    // Form handlers with success messages
    handleForm(
        selectors.userForm,
        (payload) => fetchJSON("/api/auth/users", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
        '✓ User created successfully!'
    );

    handleForm(
        selectors.sessionForm,
        (payload) => fetchJSON("/api/auth/sessions", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
        '✓ Session started successfully!'
    );

    handleForm(
        selectors.documentForm,
        (payload) => fetchJSON("/api/documents/", {
            method: "POST",
            body: JSON.stringify({ ...payload, tags: [] }),
        }),
        '✓ Document created successfully!'
    );

    handleForm(
        selectors.generationForm,
        (payload) => fetchJSON("/api/generation/requests", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
        '✓ Content generation request queued!'
    );

    selectors.refreshBtn.addEventListener("click", () => {
        refreshAll();
        showToast('✓ Data refreshed!', 'success');
    });

    // Initial load
    refreshAll().catch(err => {
        showToast('Failed to connect to backend', 'error');
    });
});

// Make copyToClipboard available globally
window.copyToClipboard = copyToClipboard;
