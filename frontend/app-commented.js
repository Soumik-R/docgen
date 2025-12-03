/**
 * AI Document Platform - Frontend Application
 * 
 * This is the main JavaScript file for the frontend single-page application.
 * It handles all client-side logic including:
 *   - User interface interactions
 *   - API communication with the Flask backend
 *   - State management
 *   - Dynamic rendering
 *   - Form handling
 * 
 * Architecture:
 *   - No frameworks used - pure vanilla JavaScript
 *   - Event-driven architecture
 *   - Centralized state management
 *   - Modular function design
 * 
 * Key Components:
 *   - State: Global object tracking all entities
 *   - API Layer: fetchJSON() for all backend communication
 *   - UI Layer: Rendering functions for dynamic HTML
 *   - Event Handlers: Form submissions, button clicks, tab switching
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Backend API base URL
 * 
 * Points to the Flask development server running locally.
 * In production, this would be replaced with the actual API domain.
 */
const API_BASE = "http://127.0.0.1:5000";

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Application state object
 * 
 * Stores all data fetched from the backend. This acts as a local cache
 * allowing the UI to update instantly without waiting for API calls.
 * 
 * The state is updated whenever:
 *   - Data is fetched from backend (load functions)
 *   - User performs an action (create, update, delete)
 *   - Refresh button is clicked
 * 
 * Structure mirrors backend data collections for consistency.
 */
const state = {
  users: [],       // Array of User objects
  sessions: [],    // Array of Session objects
  documents: [],   // Array of Document objects
  requests: [],    // Array of GenerationRequest objects
};

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================

/**
 * Selectors object
 * 
 * Caches references to frequently accessed DOM elements.
 * Benefits:
 *   - Performance: Avoids repeated querySelector calls
 *   - Readability: Named references instead of selector strings
 *   - Maintainability: Single place to update if HTML changes
 */
const selectors = {
  // Control elements
  refreshBtn: document.getElementById("refresh-btn"),
  
  // Form elements
  userForm: document.getElementById("user-form"),
  sessionForm: document.getElementById("session-form"),
  documentForm: document.getElementById("document-form"),
  generationForm: document.getElementById("generation-form"),
  
  // List display elements
  userList: document.getElementById("user-list"),
  sessionList: document.getElementById("session-list"),
  documentList: document.getElementById("document-list"),
  requestList: document.getElementById("request-list"),
  
  // Toast notification elements
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message"),
  
  // Counter elements
  userCount: document.getElementById("user-count"),
  sessionCount: document.getElementById("session-count"),
  documentCount: document.getElementById("document-count"),
  requestCount: document.getElementById("request-count"),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Display toast notification to user
 * 
 * Shows a temporary notification message with visual feedback.
 * Automatically disappears after 3 seconds.
 * 
 * @param {string} message - The message to display
 * @param {string} type - Notification type: 'success', 'error', 'info'
 * 
 * Usage:
 *   showToast('User created successfully!', 'success');
 *   showToast('Connection failed', 'error');
 * 
 * Visual Styling:
 *   - success: Green background
 *   - error: Red background
 *   - info: Blue background
 */
function showToast(message, type = 'success') {
  selectors.toastMessage.textContent = message;
  selectors.toast.className = `toast show ${type}`;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    selectors.toast.className = 'toast hidden';
  }, 3000);
}

/**
 * Copy text to clipboard
 * 
 * Uses the modern Clipboard API to copy text. Provides user feedback
 * via toast notification.
 * 
 * @param {string} text - Text to copy to clipboard
 * 
 * Usage:
 *   copyToClipboard('abc123xyz');  // Copy ID
 *   copyToClipboard(user.email);   // Copy email
 * 
 * Browser Compatibility:
 *   Requires HTTPS or localhost for security.
 *   Falls back gracefully if Clipboard API not available.
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// ============================================================================
// API COMMUNICATION LAYER
// ============================================================================

/**
 * Centralized HTTP request handler
 * 
 * Makes asynchronous requests to the backend API with proper error handling.
 * All API calls in the application go through this function.
 * 
 * Features:
 *   - Automatic JSON parsing
 *   - Consistent error handling
 *   - Connection error detection
 *   - Proper HTTP headers
 * 
 * @param {string} path - API endpoint path (e.g., '/api/auth/users')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} - Parsed JSON response
 * @throws {Error} - On network error or non-OK response
 * 
 * Usage Examples:
 *   // GET request
 *   const data = await fetchJSON('/api/documents/');
 *   
 *   // POST request
 *   const result = await fetchJSON('/api/auth/users', {
 *     method: 'POST',
 *     body: JSON.stringify({email: 'user@example.com'})
 *   });
 * 
 * Error Handling:
 *   - Network errors: "Cannot connect to backend"
 *   - HTTP errors: Extracted from response JSON or generic message
 */
async function fetchJSON(path, options = {}) {
  try {
    // Make HTTP request to backend
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    
    // Check if response is successful (status 200-299)
    if (!response.ok) {
      // Try to extract error message from response
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Request failed");
    }
    
    // Parse and return JSON response
    return response.json();
  } catch (error) {
    // Special handling for connection errors
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend. Make sure the server is running.');
    }
    throw error;
  }
}

// ============================================================================
// UI RENDERING FUNCTIONS
// ============================================================================

/**
 * Generic list rendering function
 * 
 * Renders an array of items as HTML list items using a custom formatter.
 * This reusable function handles all list displays in the application.
 * 
 * @param {HTMLElement} target - The UL element to render into
 * @param {Array} items - Array of items to render
 * @param {Function} formatter - Function that converts item to HTML string
 * 
 * The formatter function receives an item and returns an HTML string.
 * 
 * Example:
 *   renderList(userListElement, users, (user) => `
 *     <div>${user.display_name}</div>
 *     <div>${user.email}</div>
 *   `);
 */
function renderList(target, items, formatter) {
  if (items.length === 0) {
    target.innerHTML = '';
    return;
  }
  target.innerHTML = items.map((item) => `<li>${formatter(item)}</li>`).join("");
}

/**
 * Load and display users from backend
 * 
 * Workflow:
 *   1. Fetch users from /api/auth/users
 *   2. Update local state
 *   3. Update counter badge
 *   4. Render user list with rich formatting
 * 
 * Display includes:
 *   - Role icon (✍️ for author, 👁️ for reviewer)
 *   - Display name and role badge
 *   - Email address
 *   - User ID with copy button
 */
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

/**
 * Load and display sessions from backend
 * 
 * Fetches all active sessions and displays them with:
 *   - Session status badge
 *   - Associated user name
 *   - Session ID
 */
async function loadSessions() {
  const data = await fetchJSON("/api/auth/sessions");
  state.sessions = data.sessions ?? [];
  selectors.sessionCount.textContent = state.sessions.length;
  
  renderList(selectors.sessionList, state.sessions, (session) => {
    // Find the user associated with this session
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

/**
 * Load and display documents from backend
 * 
 * Shows all documents with:
 *   - Document type icon (📝 for docx, 📊 for pptx)
 *   - Title and type badge
 *   - Owner name
 *   - Document ID with copy functionality
 */
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

/**
 * Load and display generation requests from backend
 * 
 * Shows AI generation queue with:
 *   - Status indicator (✓ completed, ✗ failed, ⏳ pending)
 *   - Prompt preview (first 60 characters)
 *   - Associated document title
 *   - Tone setting (if specified)
 *   - Request ID
 */
async function loadRequests() {
  const data = await fetchJSON("/api/generation/requests");
  state.requests = data.requests ?? [];
  selectors.requestCount.textContent = state.requests.length;
  
  renderList(selectors.requestList, state.requests, (req) => {
    // Determine status styling
    const statusClass = req.status === 'completed' ? 'status-completed' : 
                       req.status === 'failed' ? 'status-failed' : 'status-pending';
    const statusIcon = req.status === 'completed' ? '✓' : 
                      req.status === 'failed' ? '✗' : '⏳';
    
    // Find associated document
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

/**
 * Refresh all data from backend
 * 
 * Loads users, sessions, documents, and requests in parallel for efficiency.
 * Called when:
 *   - Page first loads
 *   - User clicks refresh button
 *   - After any data modification
 */
async function refreshAll() {
  await Promise.all([loadUsers(), loadSessions(), loadDocuments(), loadRequests()]);
}

// ============================================================================
// FORM HANDLING
// ============================================================================

/**
 * Generic form submission handler
 * 
 * Attaches submit event listener to a form and handles the workflow:
 *   1. Prevent default form submission
 *   2. Extract form data
 *   3. Show loading state (disable button, show spinner)
 *   4. Call handler function with form data
 *   5. Reset form on success
 *   6. Refresh all data
 *   7. Show success toast
 *   8. Handle errors and show error toast
 *   9. Restore button state
 * 
 * @param {HTMLFormElement} form - The form element
 * @param {Function} handler - Async function to handle submission
 * @param {string} successMessage - Message to show on success
 * 
 * Example:
 *   handleForm(userForm, async (data) => {
 *     return await fetchJSON('/api/auth/users', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *   }, 'User created!');
 */
function handleForm(form, handler, successMessage) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();  // Prevent page reload
    
    // Extract form data into object
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      if (value !== "") {  // Only include non-empty fields
        payload[key] = value;
      }
    });
    
    try {
      // Show loading state on submit buttons
      const buttons = form.querySelectorAll("button[type='submit']");
      buttons.forEach((btn) => {
        btn.disabled = true;
        const originalText = btn.innerHTML;
        // Show spinning loader icon
        btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';
        btn.dataset.original = originalText;
      });
      
      // Call the handler function
      await handler(payload);
      
      // Reset form fields
      form.reset();
      
      // Refresh all data to show new entity
      await refreshAll();
      
      // Show success message
      showToast(successMessage, 'success');
    } catch (error) {
      // Show error message
      showToast(error.message, 'error');
    } finally {
      // Restore button state
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

// ============================================================================
// TAB NAVIGATION
// ============================================================================

/**
 * Switch between application tabs
 * 
 * Shows the selected tab content and hides others.
 * Updates active state on tab buttons.
 * 
 * @param {string} tabName - Name of tab to show ('users', 'documents', 'generate')
 * 
 * Tab Structure:
 *   - Users: User management and session creation
 *   - Documents: Document creation and listing
 *   - Generate: AI content generation interface
 */
function switchTab(tabName) {
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Hide all tab content areas
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Show selected tab
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`${tabName}-tab`);
  
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.remove('hidden');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * DOM Content Loaded Event Handler
 * 
 * Runs when HTML is fully loaded and parsed.
 * Sets up all event listeners and loads initial data.
 * 
 * Setup Order:
 *   1. Tab navigation
 *   2. Quick guide close button
 *   3. Form handlers for all forms
 *   4. Refresh button
 *   5. Initial data load
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- Tab Navigation Setup ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // --- Quick Guide Close Button ---
  const closeGuideBtn = document.getElementById('close-guide');
  if (closeGuideBtn) {
    closeGuideBtn.addEventListener('click', () => {
      document.getElementById('quick-guide').style.display = 'none';
    });
  }

  // --- Form Handlers ---
  // Each form gets a handler with success message
  
  // User creation form
  handleForm(
    selectors.userForm,
    (payload) => fetchJSON("/api/auth/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    '✓ User created successfully!'
  );

  // Session creation form
  handleForm(
    selectors.sessionForm,
    (payload) => fetchJSON("/api/auth/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    '✓ Session started successfully!'
  );

  // Document creation form
  handleForm(
    selectors.documentForm,
    (payload) => fetchJSON("/api/documents/", {
      method: "POST",
      body: JSON.stringify({ ...payload, tags: [] }),
    }),
    '✓ Document created successfully!'
  );

  // Generation request form
  handleForm(
    selectors.generationForm,
    (payload) => fetchJSON("/api/generation/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    '✓ Content generation request queued!'
  );

  // --- Refresh Button ---
  selectors.refreshBtn.addEventListener("click", () => {
    refreshAll();
    showToast('✓ Data refreshed!', 'success');
  });

  // --- Initial Data Load ---
  // Load all data when page first opens
  refreshAll().catch(err => {
    showToast('Failed to connect to backend', 'error');
  });
});

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

/**
 * Make copyToClipboard available globally
 * 
 * This allows the function to be called from onclick attributes in
 * dynamically generated HTML.
 */
window.copyToClipboard = copyToClipboard;
