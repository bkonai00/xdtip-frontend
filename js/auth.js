// ⚠️ REPLACE THIS WITH YOUR RENDER BACKEND URL
// DO NOT add a slash '/' at the end.
const API_URL = "https://xdtip-backend.onrender.com"; 

// LOGIN LOGIC
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
                window.location.href = "dashboard.html";
            } else {
                alert(data.error || "Login Failed");
            }
        } catch (err) {
            alert("Cannot connect to server. Is backend running?");
        } finally {
            btn.innerText = "Login";
        }
    });
}

// REGISTER LOGIC
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. GET THE VALUES
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value; // <--- NEW LINE ADDED HERE
        
        const btn = e.target.querySelector('button');

        try {
            btn.innerText = "Creating...";
            
            // 2. SEND TO SERVER
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 3. INCLUDE ROLE IN THE DATA
                body: JSON.stringify({ username, email, password, role }) // <--- UPDATED HERE
            });

            const data = await res.json();
            if (data.success) {
                alert("Account Created! Please Login.");
                window.location.href = "login.html";
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Error connecting to server.");
            console.error(err);
        } finally {
            btn.innerText = "Create Account";
        }
    });
}
