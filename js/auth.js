// ----------------------------------------------------
// 🧹 URL CLEANER: Hides ".html" from the browser bar
// ----------------------------------------------------
if (window.location.pathname.endsWith('.html')) {
    const cleanUrl = window.location.pathname.replace('.html', '');
    window.history.replaceState(null, '', cleanUrl);
}
// ----------------------------------------------------

// ⚠️ USE YOUR RENDER BACKEND URL TO BE SAFE
const API_URL = "https://xdtip-backend.onrender.com"; 

// ==========================================
// 1. LOGIN LOGIC
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = e.target.querySelector('button');

        try {
            btn.innerText = "Loading...";
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                // Redirect to dashboard.html (URL cleaner will hide the .html)
                window.location.href = "/dashboard.html";
            } else {
                alert(data.error || "Login Failed");
            }
        } catch (err) {
            alert("Cannot connect to server. Check your internet.");
        } finally {
            btn.innerText = "Log In";
        }
    });
}

// ==========================================
// 2. REGISTER LOGIC
// ==========================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Get Values
        const role = document.getElementById('role').value; 
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = e.target.querySelector('button');

        try {
            btn.innerText = "Creating...";
            
            // 2. Send to Backend
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password, 
                    role 
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Account Created! Please Login.");
                // Redirect to login.html (URL cleaner will hide the .html)
                window.location.href = "/login.html";
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server.");
        } finally {
            btn.innerText = "Create Account";
        }
    });
}
