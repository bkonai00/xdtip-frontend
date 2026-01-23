// ✅ CORRECT URL (Only one 'h')
const API_URL = "https://xdtip-backend.onrender.com";

// Register Form Logic
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_URL}/register`, {  // <--- Line 16 is here
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            if (data.success) {
                alert("Registered! Please login.");
                window.location.href = "login.html";
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Server error. Check console.");
        }
    });
}

// Login Form Logic
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = "dashboard.html";
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Login failed.");
        }
    });
}
