// ----------------------------------------------------
// 🧹 URL CLEANER
// ----------------------------------------------------
if (window.location.pathname.endsWith('.html')) {
    const cleanUrl = window.location.pathname.replace('.html', '');
    window.history.replaceState(null, '', cleanUrl);
}

// ----------------------------------------------------
// ⚠️ CONFIGURATION
// ----------------------------------------------------
const API_URL = "https://app.xdfun.in"; 
// Connect Socket to the Overlay Server
const socket = io('https://app.xdfun.in'); 

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
            if(document.getElementById('user-name')) document.getElementById('user-name').innerText = user.username;
            if(document.getElementById('balance')) document.getElementById('balance').innerText = user.balance;
            if(document.getElementById('role-badge')) document.getElementById('role-badge').innerText = user.role.toUpperCase();

            // Logo
            const logoImg = document.getElementById('current-logo');
            if(logoImg) {
                logoImg.src = user.logo_url ? user.logo_url : `https://ui-avatars.com/api/?name=${user.username}&background=00ff88&color=000&size=128`;
            }

            // CREATOR LOGIC
            if (user.role === 'creator') {
                document.getElementById('creator-section').style.display = 'block';
                const withdrawBtn = document.getElementById('withdraw-btn');
                if(withdrawBtn) withdrawBtn.style.display = 'inline-block';

                if(document.getElementById('theme-selector')) {
                    document.getElementById('theme-selector').value = user.overlay_theme || 'classic';
                }

                // Links
                document.getElementById('overlay-url').value = `${API_URL}/overlay/${user.obs_token}`;
                if(document.getElementById('stats-link')) document.getElementById('stats-link').value = `${API_URL}/stats-overlay/${user.obs_token}`;
                if(document.getElementById('tip-page-url')) document.getElementById('tip-page-url').value = `https://tip.xdfun.in/u/${user.username}`;

                // Load Data
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

// History Loader
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
            container.innerHTML = '<p style="color: #444; text-align:center;">No tips received yet. Share your link!</p>';
        }
    } catch (err) { console.error("History Error", err); }
}

// Helper: Copy
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

// Save Theme
async function saveTheme() {
    const theme = document.getElementById('theme-selector').value;
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API_URL}/update-theme`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ theme })
        });
        const data = await res.json();
        if(data.success) alert("Theme updated!");
    } catch(err) { alert("Failed to save theme"); }
}

// Upload Logo
async function uploadLogo() {
    const fileInput = document.getElementById('logo-file');
    const file = fileInput.files[0];
    const status = document.getElementById('upload-status');
    const token = localStorage.getItem('token');

    if (!file) return;
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
            alert("Logo Updated!");
        } else {
            alert("Upload Failed: " + data.error);
        }
    } catch (err) { alert("Server Error"); }
}

// Withdraw
async function submitWithdraw() {
    const amount = document.getElementById('w-amount').value;
    const upiId = document.getElementById('w-upi').value;
    const token = localStorage.getItem('token');

    if(!amount || !upiId) return alert("Please fill all details");

    try {
        const res = await fetch(`${API_URL}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount, upiId })
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            document.getElementById('withdraw-modal').style.display = 'none';
        } else {
            alert(data.error);
        }
    } catch (err) { alert("Request Failed"); }
}

// Payout History
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
                html += `<tr><td>${w.date}</td><td style="font-weight:bold;">${w.amount}</td><td style="color:${color};">${w.status}</td><td>#${w.t_id}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; font-size:13px;">No withdrawal requests yet.</p>';
        }
    } catch (err) { console.error("Payout History Error", err); }
}

// ------------------------------------------------------------------
// 🔥 1. SEND TEST ALERT (Uses API - Keep as is)
// ------------------------------------------------------------------
async function sendTestAlert() {
    const btn = document.getElementById('test-btn');
    const token = localStorage.getItem('token');
    btn.innerText = "Sending..."; btn.disabled = true;

    try {
        const res = await fetch('https://xdtip-backend.onrender.com/test-alert', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) btn.innerText = "✅ Sent!";
        else alert("Failed: " + data.error);
    } catch (err) { alert("Server Error"); }
    
    setTimeout(() => { btn.innerText = "🔥 Send Test Alert"; btn.disabled = false; }, 2000);
}

// ------------------------------------------------------------------
// 🔄 2. REPLAY LATEST TIP (Uses Socket Direct)
// ------------------------------------------------------------------
function replayLastTip() {
    const btn = document.getElementById('replay-btn');
    btn.disabled = true; btn.innerText = "Scanning...";

    // A. Read the Table
    const container = document.getElementById('history-container');
    let lastTip = null;

    if (container) {
        // Find the first row in the table
        const firstRow = container.querySelector('tbody tr');
        if (firstRow) {
            const cells = firstRow.getElementsByTagName('td');
            if (cells.length >= 3) {
                // Extract Data (Name, Msg, Amount)
                const rawAmount = cells[2].innerText.replace(/[^0-9]/g, '');
                
                lastTip = {
                    tipper: cells[0].innerText.trim(),
                    amount: rawAmount || "0",
                    message: cells[1].innerText.replace(/["“”]/g, '').trim()
                };
            }
        }
    }

    // B. Send to Socket
    if (lastTip) {
        // Get Token from input field
        const urlInput = document.getElementById('overlay-url');
        if (urlInput && urlInput.value.includes('/overlay/')) {
            const obsToken = urlInput.value.split('/overlay/')[1];
            
            // Connect & Send
            socket.emit('join-overlay', obsToken);
            setTimeout(() => {
                socket.emit('new-tip', lastTip);
                alert(`Replaying: ${lastTip.tipper}`);
            }, 100);
            
        } else {
            alert("OBS Token not found. Wait for dashboard to load.");
        }
    } else {
        alert("No recent tips found.");
    }

    setTimeout(() => { btn.disabled = false; btn.innerText = "🔄 Latest Tip"; }, 1000);
}

loadDashboard();
