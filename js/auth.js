// ==========================================
// 🔐 AUTHENTICATION SYSTEM (auth.js)
// ==========================================

const API_URL = "https://app.xdfun.in"; // Your Backend URL

// 1. GLOBAL PAGE PROTECTION (Runs on every page load)
(function checkAuth() {
    const token = localStorage.getItem('token');
    const path = window.location.pathname;

    // List of public pages (No login required)
    const publicPages = ['/login', '/login.html', '/register', '/register.html', '/index.html', '/'];

    // A. If User is NOT logged in...
    if (!token) {
        // ...and tries to access a protected page (like dashboard)
        if (!publicPages.some(page => path.endsWith(page))) {
            window.location.href = '/login.html'; // Kick them to login
        }
    } 
    // B. If User IS logged in...
    else {
        // ...and tries to go to Login or Register page
        if (path.includes('login') || path.includes('register')) {
            window.location.href = '/dashboard.html'; // Send them to Dashboard
        }
    }
})();

// 2. LOGIN FORM LOGIC
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button');

        try {
            // Disable button to prevent double-clicks
            btn.disabled = true;
            btn.innerText = "Logging in...";

            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // ✅ SUCCESS: Save Token & Redirect
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user)); // Save user info
                window.location.href = '/dashboard.html';
            } else {
                // ❌ FAIL
                alert("Login Failed: " + (data.error || "Unknown error"));
                btn.disabled = false;
                btn.innerText = "Log In";
            }
        } catch (err) {
            console.error(err);
            alert("Network Error: Could not connect to server.");
            btn.disabled = false;
            btn.innerText = "Log In";
        }
    });
}

// 3. LOGOUT FUNCTION (Call this from your Dashboard button)
function logout() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}
