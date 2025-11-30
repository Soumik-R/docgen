// Login page JavaScript
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast hidden';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    // Simple validation (for demo purposes - in production, validate against backend)
    if (email && password) {
      // Store login state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);

      showToast('✓ Login successful! Redirecting...', 'success');

      // Redirect to main app after short delay
      setTimeout(() => {
        window.location.href = 'simple.html';
      }, 1000);
    } else {
      showToast('Please enter valid credentials', 'error');
    }
  });
});
