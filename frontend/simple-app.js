const API_BASE = "http://127.0.0.1:5000";

let currentUser = null;
let documents = [];
let requests = [];

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 3000);
}

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
    localStorage.removeItem('currentUserId');
    showToast('✓ Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Fetch helper
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

// Initialize or get current user
async function initializeUser() {
    const savedUserId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

    if (savedUserId) {
        try {
            const data = await fetchJSON("/api/auth/users");
            const user = data.users?.find(u => u.id === savedUserId);
            if (user) {
                currentUser = user;
                return;
            }
        } catch (e) {
            console.error('Error fetching users:', e);
        }
    }

    // Create a new user
    try {
        const userData = await fetchJSON("/api/auth/users", {
            method: "POST",
            body: JSON.stringify({
                email: userEmail,
                display_name: userEmail.split('@')[0],
                role: 'author'
            }),
        });
        currentUser = userData.user;
        localStorage.setItem('currentUserId', currentUser.id);
    } catch (error) {
        showToast('Failed to initialize user: ' + error.message, 'error');
    }
}

// Load documents
async function loadDocuments() {
    try {
        const data = await fetchJSON("/api/documents/");
        documents = data.documents ?? [];
        renderDocuments();
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Load generation requests
async function loadRequests() {
    try {
        const data = await fetchJSON("/api/generation/requests");
        requests = data.requests ?? [];
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

// Render documents list
function renderDocuments() {
    const docCount = document.getElementById('doc-count');
    const docsList = document.getElementById('documents-list');

    docCount.textContent = documents.length;

    if (documents.length === 0) {
        docsList.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
          </path>
        </svg>
        <p>No documents yet. Create your first one above!</p>
      </div>
    `;
        return;
    }

    docsList.innerHTML = documents.map(doc => {
        const typeIcon = doc.doc_type === 'docx' ? '📝' : '📊';
        const request = requests.find(r => r.document_id === doc.id);
        const statusBadge = request ? getStatusBadge(request.status) : '';

        return `
      <div class="doc-item">
        <div class="doc-header">
          <div style="flex: 1;">
            <div class="doc-title">
              <span class="doc-icon">${typeIcon}</span>
              <span>${doc.title}</span>
              ${statusBadge}
            </div>
            ${request ? `
              <p class="doc-prompt">${request.prompt.slice(0, 100)}${request.prompt.length > 100 ? '...' : ''}</p>
              ${request.tone ? `<p class="doc-meta">Tone: ${request.tone}</p>` : ''}
            ` : ''}
            <p class="doc-meta">Created: ${new Date(doc.created_at).toLocaleString()}</p>
          </div>
          <button onclick="downloadDocument('${doc.doc_type}')" class="copy-btn">
            📥 Download
          </button>
        </div>
      </div>
    `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge status-pending">⏳ Pending</span>',
        'completed': '<span class="status-badge status-completed">✓ Completed</span>',
        'failed': '<span class="status-badge status-failed">✗ Failed</span>'
    };
    return badges[status] || '';
}

// Download document
function downloadDocument(docType) {
    const filename = docType === 'docx' ? 'demo_document.docx' : 'demo_presentation.pptx';
    const downloadUrl = `http://127.0.0.1:5000/static/${filename}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📥 Downloading ${docType === 'docx' ? 'Word' : 'PowerPoint'} document...`, 'success');
}

// Handle form submission with DEMO download
async function handleGenerateForm(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('User not initialized. Please refresh the page.', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submit-text');
    const originalText = submitText.textContent;

    submitBtn.disabled = true;
    submitText.textContent = 'Generating...';

    try {
        const formData = new FormData(e.target);
        const title = formData.get('title');
        const docType = formData.get('doc_type');
        const prompt = formData.get('prompt');
        const tone = formData.get('tone');

        // Step 1: Create document
        showToast('Creating document...', 'success');
        const docData = await fetchJSON("/api/documents/", {
            method: "POST",
            body: JSON.stringify({
                owner_id: currentUser.id,
                title: title,
                doc_type: docType,
                tags: []
            }),
        });

        // Step 2: Create generation request
        showToast('Generating content with AI...', 'success');
        await fetchJSON("/api/generation/requests", {
            method: "POST",
            body: JSON.stringify({
                document_id: docData.document.id,
                user_id: currentUser.id,
                prompt: prompt,
                tone: tone || undefined
            }),
        });

        // Step 3: DEMO - Simulate file download
        showToast('✓ Document created! Downloading...', 'success');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Trigger demo download
        const filename = docType === 'docx' ? 'demo_document.docx' : 'demo_presentation.pptx';
        const downloadUrl = `http://127.0.0.1:5000/static/${filename}`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`📥 ${docType === 'docx' ? 'Word' : 'PowerPoint'} document downloaded!`, 'success');
        e.target.reset();

        await loadDocuments();
        await loadRequests();

    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.textContent = originalText;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    checkLogin();

    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('generate-form').addEventListener('submit', handleGenerateForm);

    try {
        await initializeUser();
        await loadDocuments();
        await loadRequests();
    } catch (error) {
        showToast('Failed to connect to backend', 'error');
    }
});

window.downloadDocument = downloadDocument;
