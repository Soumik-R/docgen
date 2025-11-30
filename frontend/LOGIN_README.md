# Login System for AI Document Platform

## Overview
I've added a separate login screen that appears before the main application.

## Files Created/Modified

### New Files:
1. **login.html** - Beautiful standalone login page with gradient design
2. **login.js** - Handles login authentication and redirects to main app
3. **main-app.js** - Updated version of app-new.js with login check and logout functionality

### Modified Files:
1. **index-new.html** - Added logout button in header, updated script reference to main-app.js

## How It Works

### Login Flow:
1. User opens `login.html`
2. Enters email and password (any credentials work for demo)
3. On successful login:
   - Credentials are stored in localStorage
   - User is redirected to `index-new.html`

### Main App:
1. When `index-new.html` loads, `main-app.js` checks if user is logged in
2. If not logged in → redirects to `login.html`
3. If logged in → shows the main application

### Logout:
1. Click the "Logout" button in the header
2. Session is cleared from localStorage
3. User is redirected back to `login.html`

## Usage Instructions

### To test the login system:

1. **Start with the login page:**
   ```
   Open: d:/Study/Projects/OCEAN-AI/Docgen/ai-doc-platform/frontend/login.html
   ```

2. **Enter any credentials** (for demo purposes):
   - Email: any@email.com
   - Password: any password

3. **After login**, you'll be redirected to the main application

4. **To logout**, click the "Logout" button in the top right corner

## File Locations

```
frontend/
├── login.html          (Login page - START HERE)
├── login.js           (Login authentication logic)
├── index-new.html     (Main app with logout button)
├── main-app.js        (Main app logic with login check)
├── style-new.css      (Shared styles)
└── ...
```

## Features

✅ Beautiful gradient login UI
✅ Email and password fields
✅ Remember me checkbox
✅ Forgot password link (placeholder)
✅ Sign up link (placeholder)
✅ Automatic redirect after login
✅ Session persistence with localStorage
✅ Logout functionality
✅ Protected main application (requires login)

## Notes

- This is a **demo implementation** using localStorage
- In production, you would validate credentials against a backend API
- Currently accepts any email/password combination
- Session persists until logout or localStorage is cleared
