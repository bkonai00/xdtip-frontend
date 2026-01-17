const API_URL = "https://xdtip-backend.onrender.com"; 

async function loadDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = "login.html";

    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('user-name').innerText = data.user.username;
            document.getElementById('balance').innerText = data.user.balance;
        } else {
            localStorage.removeItem('token');
            window.location.href = "login.html";
        }
    } catch (err) {
        console.error("Failed to load dashboard");
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = "index.html";
}

// Run on load
loadDashboard();