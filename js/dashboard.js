// ----------------------------------------------------
// 🧹 URL CLEANER
// ----------------------------------------------------
if (window.location.pathname.endsWith('.html')) {
    window.history.replaceState(null, '', window.location.pathname.replace('.html', ''));
}

// ----------------------------------------------------
// ⚠️ CONFIGURATION
// ----------------------------------------------------
const API_URL = "https://xdtip-backend.onrender.com"; // Your Backend URL

async function loadDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = "/login/";

    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            const user = data.user;
            
            // Fill Info
            document.getElementById('user-name').innerText = user.username;
            document.getElementById('balance').innerText = user.balance;
            
            // Role Badge Logic
            const roleBadge = document.getElementById('role-badge');
            if (roleBadge) {
                roleBadge.innerText = user.role.toUpperCase();
                if(user.role === 'creator') roleBadge.classList.add('creator');
            }

            // Logo Logic
            const logoImg = document.getElementById('current-logo');
            if (logoImg) {
                logoImg.src = user.logo_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`;
            }

            // Creator Tools
            if (user.role === 'creator') {
                document.getElementById('creator-section').style.display = 'block';
                const withdrawBtn = document.getElementById('withdraw-btn');
                if(withdrawBtn) withdrawBtn.style.display = 'inline-block';

                if(document.getElementById('theme-selector')) {
                    document.getElementById('theme-selector').value = user.overlay_theme || 'classic';
                }

                // Links
                document.getElementById('overlay-url').value = `https://app.xdfun.in/overlay/${user.obs_token}`;
                if(document.getElementById('stats-link')) document.getElementById('stats-link').value = `https://app.xdfun.in/stats-overlay/${user.obs_token}`;
                if(document.getElementById('tip-page-url')) document.getElementById('tip-page-url').value = `https://tip.xdfun.in/u/${user.username}`;

                loadHistory(token);
                loadWithdrawals(token);
            } else {
                document.getElementById('viewer-section').style.display = 'block';
            }
        } else {
            logout();
        }
    } catch (err) {
        console.error("Failed to load dashboard", err);
    }
}

// ----------------------------------------------------
// 🔄 REPLAY LATEST TIP (Calls the new Backend Endpoint)
// ----------------------------------------------------
async function replayLastTip() {
    const btn = document.getElementById('replay-btn');
    const token = localStorage.getItem('token');
    btn.disabled = true; btn.innerText = "Scanning...";

    let lastTip = null;

    // 1. Get Data from the Table on Screen
    const container = document.getElementById('history-container');
    if (container) {
        const firstRow = container.querySelector('tbody tr');
        if (firstRow) {
            const cells = firstRow.getElementsByTagName('td');
            if (cells.length >= 3) {
                // Parse the visible table data
                lastTip = {
                    tipper: cells[0].innerText.trim(),
                    // Clean amount (remove ₹, $, commas, etc)
                    amount: cells[2].innerText.replace(/[^0-9.]/g, ''), 
                    // Clean message (remove quotes)
                    message: cells[1].innerText.replace(/["“”]/g, '').trim()
                };
            }
        }
    }

    // 2. Send to Backend
    if (lastTip) {
        try {
            console.log("Sending Replay:", lastTip);
            const res = await fetch(`${API_URL}/replay-alert`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(lastTip)
            });
            
            const data = await res.json();
            if (data.success) {
                alert(`Replaying tip from ${lastTip.tipper}!`);
            } else {
                alert("Server Error: Did you add the /replay-alert code to your backend?");
            }
        } catch(e) {
            console.error(e);
            alert("Connection Failed");
        }
    } else {
        alert("No recent tips found in the table.");
    }

    setTimeout(() => { btn.disabled = false; btn.innerText = "🔄 Latest Tip"; }, 1000);
}

// Standard Test Alert
async function sendTestAlert() {
    const btn = document.getElementById('test-btn');
    const token = localStorage.getItem('token');
    btn.innerText = "Sending..."; btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/test-alert`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) btn.innerText = "✅ Sent!";
        else alert("Failed: " + data.error);
    } catch (err) { alert("Server Error"); }
    
    setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
}

// Other Helper Functions...
async function loadHistory(token) {
    try {
        const res = await fetch(`${API_URL}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const container = document.getElementById('history-container');
        
        if (data.success && data.history.length > 0) {
            let html = '<table class="history-table"><thead><tr><th>SENDER</th><th>MESSAGE</th><th>AMOUNT</th><th>DATE</th></tr></thead><tbody>';
            data.history.forEach(tip => {
                html += `<tr>
                    <td style="font-weight:bold;">${tip.sender}</td>
                    <td style="color:#aaa;">"${tip.message}"</td>
                    <td class="history-amount">+${tip.amount}</td>
                    <td>${tip.date}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; text-align:center;">No tips yet.</p>';
        }
    } catch (err) { console.error(err); }
}

async function loadWithdrawals(token) {
    try {
        const res = await fetch(`${API_URL}/withdrawals`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const container = document.getElementById('payout-container');
        
        if (data.success && data.history.length > 0) {
            let html = '<table class="history-table"><thead><tr><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th>T_ID</th></tr></thead><tbody>';
            data.history.forEach(w => {
                let color = w.status === 'paid' ? '#4caf50' : '#ff9800';
                html += `<tr><td>${w.date}</td><td style="font-weight:bold;">${w.amount}</td><td style="color:${color};">${w.status}</td><td>#${w.t_id}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; font-size:13px;">No payouts yet.</p>';
        }
    } catch (err) { console.error(err); }
}

function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select(); navigator.clipboard.writeText(copyText.value); alert("Copied!");
}
function logout() { localStorage.removeItem('token'); window.location.href = "/login/"; }
async function saveTheme() { /* Your existing saveTheme code */ }
async function uploadLogo() { /* Your existing uploadLogo code */ }
async function submitWithdraw() { /* Your existing submitWithdraw code */ }

loadDashboard();
