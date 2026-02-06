// ----------------------------------------------------
// 🧹 URL CLEANER: Hides ".html" from the browser bar
// ----------------------------------------------------
if (window.location.pathname.endsWith('.html')) {
    const cleanUrl = window.location.pathname.replace('.html', '');
    window.history.replaceState(null, '', cleanUrl);
}
// ----------------------------------------------------

// ... rest of your existing code ...
// ⚠️ REPLACE WITH YOUR RENDER URL
const API_URL = "https://app.xdfun.in"; 

// ⚠️ REPLACE WITH YOUR GITHUB PAGES URL
const FRONTEND_URL = "https://tip.xdfun.in/xdtip-frontend/"; 

async function loadDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = "/login/";

    try {
        // 1. Fetch User Data
        const res = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            const user = data.user;

            // 2. Fill Basic Info
            document.getElementById('user-name').innerText = user.username;
            document.getElementById('balance').innerText = user.balance;
            document.getElementById('role-badge').innerText = user.role.toUpperCase();

            const logoImg = document.getElementById('current-logo');

if (user.logo_url) {
    logoImg.src = user.logo_url;
} else {
    // Generates a nice avatar with their initials
    logoImg.src = `https://ui-avatars.com/api/?name=${user.username}&background=00ff88&color=000&size=128`;
}
            // 4. HANDLE ROLES
            // ✅ FIXED SYNTAX ERROR HERE (It was missing 'user.role')
            if (user.role === 'creator') {
                // SHOW Creator Tools
                document.getElementById('creator-section').style.display = 'block';
                
                // Show Withdraw Button
                const withdrawBtn = document.getElementById('withdraw-btn');
                if(withdrawBtn) withdrawBtn.style.display = 'inline-block';

                // ---------------------------------------------------------
                // ✅ ADDED: SET THEME DROPDOWN TO SAVED CHOICE
                // ---------------------------------------------------------
                if (user.overlay_theme) {
                    document.getElementById('theme-selector').value = user.overlay_theme;
                } else {
                    document.getElementById('theme-selector').value = 'classic';
                }

                // Generate Links
                const overlayLink = `${API_URL}/overlay/${user.obs_token}`;
                document.getElementById('overlay-url').value = overlayLink;

                // --- 👇 NEW CODE (For Stats Widget) - PASTE THIS BELOW 👇 ---
                const statsLink = `${API_URL}/stats-overlay/${user.obs_token}`;
                
                // We check if the element exists first to prevent errors
                const statsInput = document.getElementById('stats-link');
                if (statsInput) {
                    statsInput.value = statsLink;
                }

                const tipLink = `https://tip.xdfun.in/${user.username}`;
                document.getElementById('tip-page-url').value = tipLink;

                // Load History
                loadHistory(token);
                loadWithdrawals(token);

            } else {
                // SHOW Viewer Section
                document.getElementById('viewer-section').style.display = 'block';
            }

        } else {
            logout();
        }
    } catch (err) {
        console.error("Failed to load dashboard", err);
    }
}

// Fetch and Render History (Creators Only)
async function loadHistory(token) {
    try {
        const res = await fetch(`${API_URL}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const container = document.getElementById('history-container');
        
        if (data.success && data.history.length > 0) {
            let html = '<table class="history-table"><thead><tr><th>SENDER</th><th>MESSAGE</th><th>AMOUNT</th><th>DATE</th></tr></thead><tbody>';
            data.history.forEach(tip => {
                html += `<tr><td style="font-weight:bold;">${tip.sender}</td><td style="color:#aaa;">"${tip.message}"</td><td class="history-amount">+${tip.amount}</td><td>${tip.date}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; text-align:center;">No tips received yet. Share your link!</p>';
        }
    } catch (err) { console.error("History Error", err); }
}

// Helper: Copy to Clipboard
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert("Copied link: " + copyText.value);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = "/login/";
}

// Save Theme Function
async function saveTheme() {
    const theme = document.getElementById('theme-selector').value;
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API_URL}/update-theme`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ theme })
        });
        const data = await res.json();
        if(data.success) {
            alert("Theme updated! Refresh your OBS to see changes.");
        }
    } catch(err) {
        alert("Failed to save theme");
    }
}

// Upload Logo Function
async function uploadLogo() {
    const fileInput = document.getElementById('logo-file');
    const file = fileInput.files[0];
    const status = document.getElementById('upload-status');
    const token = localStorage.getItem('token');

    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert("File too big! Max size is 2MB.");
        return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
        status.innerText = "Uploading...";
        const res = await fetch(`${API_URL}/upload-logo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            status.innerText = "Done!";
            document.getElementById('current-logo').src = data.url;
            alert("Logo Updated Successfully!");
        } else {
            status.innerText = "Failed.";
            alert("Upload Failed: " + data.error);
        }
    } catch (err) {
        console.error(err);
        status.innerText = "Error.";
        alert("Server Error");
    }
}

// Submit Withdrawal Function
async function submitWithdraw() {
    const amount = document.getElementById('w-amount').value;
    const upiId = document.getElementById('w-upi').value;
    const token = localStorage.getItem('token');

    if(!amount || !upiId) return alert("Please fill all details");

    try {
        const res = await fetch(`${API_URL}/withdraw`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ amount, upiId })
        });

        const data = await res.json();
        if (data.success) {
            alert(data.message);
            document.getElementById('withdraw-modal').style.display = 'none';
            loadDashboard(); 
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Request Failed");
    }
}

// Fetch Withdrawal History
async function loadWithdrawals(token) {
    try {
        const res = await fetch(`${API_URL}/withdrawals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const container = document.getElementById('payout-container');
        
        if (data.success && data.history.length > 0) {
            let html = '<table class="history-table"><thead><tr><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th>T_ID</th></tr></thead><tbody>';
            data.history.forEach(w => {
                let color = w.status === 'paid' ? '#4caf50' : '#ff9800';
                html += `
                    <tr>
                        <td>${w.date}</td>
                        <td style="font-weight:bold;">${w.amount}</td>
                        <td style="color:${color}; text-transform:uppercase; font-size:12px; font-weight:bold;">${w.status}</td>
                        <td style="font-weight:bold;">#${w.t_id}</td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; font-size:13px;">No withdrawal requests yet.</p>';
        }
    } catch (err) {
        console.error("Payout History Error", err);
    }
}
async function sendTestAlert() {
    const btn = document.getElementById('test-btn');
    const token = localStorage.getItem('token');

    if (!token) return alert("Please login first");

    btn.innerText = "Sending...";
    btn.disabled = true;

    try {
        const res = await fetch('https://xdtip-backend.onrender.com/test-alert', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await res.json();
        
        if (data.success) {
            btn.innerText = "✅ Sent!";
            setTimeout(() => { btn.innerText = "🔥 Send Test Alert"; btn.disabled = false; }, 2000);
        } else {
            alert("Failed: " + data.error);
            btn.innerText = "❌ Error";
        }
    } catch (err) {
        console.error(err);
        alert("Server Error");
        btn.innerText = "🔥 Send Test Alert";
        btn.disabled = false;
    }
}
// ----------------------------------------------------
// ↺ REPLAY RECENT TIP FUNCTION
// ----------------------------------------------------
async function replayRecentTip() {
    const btn = document.getElementById('replay-btn');
    const token = localStorage.getItem('token');

    if (!token) return alert("Please login first");

    // 1. UI Feedback (Loading State)
    const originalText = btn.innerText;
    btn.innerText = "Sending...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        // 2. Send Request to Backend
        // We are calling a new endpoint: /replay-alert
        const res = await fetch(`${API_URL}/replay-alert`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await res.json();
        
        if (data.success) {
            btn.innerText = "✅ Replayed!";
            // Reset button after 2 seconds
            setTimeout(() => { 
                btn.innerText = originalText; 
                btn.disabled = false; 
                btn.style.opacity = "1";
            }, 2000);
        } else {
            alert("Failed: " + (data.message || data.error));
            btn.innerText = "❌ Error";
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    } catch (err) {
        console.error(err);
        alert("Server Error: Could not connect.");
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

// Run on load
loadDashboard();










