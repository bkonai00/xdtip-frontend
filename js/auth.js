// ----------------------------------------------------
// 🧹 URL CLEANER: Hides ".html" from the browser bar
// ----------------------------------------------------
if (window.location.pathname.endsWith('.html')) {
    const cleanUrl = window.location.pathname.replace('.html', '');
    window.history.replaceState(null, '', cleanUrl);
}
// ----------------------------------------------------

// ... rest of your existing code (API_URL, etc.) ...

// ⚠️ REPLACE THIS WITH YOUR RENDER BACKEND URL
const API_URL = "https://app.xdfun.in"; 

// LOGIN LOGIC (No changes needed here, but keeping it for completeness)
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
                window.location.href = "/dashboard/";
            } else {
                alert(data.error || "Login Failed");
            }
        } catch (err) {
            alert("Cannot connect to server.");
        } finally {
            btn.innerText = "Log In";
        }
    });
}

// REGISTER LOGIC (Updated to include ROLE)
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Get Values
        const role = document.getElementById('role').value; // <--- NEW
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
                    role // <--- sending role to server
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("Account Created! Please Login.");
                window.location.href = "/login/";
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
