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

// 1. CONNECT SOCKET DIRECTLY TO THE OVERLAY SERVER
// This allows us to bypass the API and send exact data
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
            document.getElementById('user-name').innerText = user.username;
            document.getElementById('balance').innerText = user.balance;
            document.getElementById('role-badge').innerText = user.role.toUpperCase();

            const logoImg = document.getElementById('current-logo');
            if (user.logo_url) logoImg.src = user.logo_url;
            else logoImg.src = `https://ui-avatars.com/api/?name=${user.username}&background=00ff88&color=000&size=128`;

            // Creator Tools
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
            container.innerHTML = '<p style="color: #444; text-align:center;">No tips received yet.</p>';
        }
    } catch (err) { console.error("History Error", err); }
}

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
            status.innerText = "Failed.";
            alert("Upload Failed: " + data.error);
        }
    } catch (err) { alert("Server Error"); }
}

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
            loadDashboard(); 
        } else {
            alert(data.error);
        }
    } catch (err) { alert("Request Failed"); }
}

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
                html += `<tr><td>${w.date}</td><td style="font-weight:bold;">${w.amount}</td><td style="color:${color}; font-weight:bold; text-transform:uppercase;">${w.status}</td><td style="font-weight:bold;">#${w.t_id}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; font-size:13px;">No withdrawal requests yet.</p>';
        }
    } catch (err) { console.error("Payout History Error", err); }
}

// ------------------------------------------------------------------
// 🔥 1. STANDARD TEST ALERT (Uses API)
// ------------------------------------------------------------------
async function sendTestAlert() {
    const btn = document.getElementById('test-btn');
    const token = localStorage.getItem('token');
    btn.innerText = "Sending..."; btn.disabled = true;

    try {
        // NOTE: This API endpoint FORCES the message "This is a test alert"
        // It ignores whatever body we send.
        const res = await fetch('https://xdtip-backend.onrender.com/test-alert', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) btn.innerText = "✅ Sent!";
        else alert("Failed: " + data.error);
    } catch (err) { alert("Server Error"); }
    
    setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
}

// ------------------------------------------------------------------
// 🔄 2. REPLAY LATEST TIP (Uses Socket Direct to Bypass API Limits)
// ------------------------------------------------------------------
function replayLastTip() {
    const btn = document.getElementById('replay-btn');
    btn.disabled = true; btn.innerText = "Scanning...";

    let lastTip = null;

    // 1. READ THE TABLE (Screen Scraping)
    const container = document.getElementById('history-container');
    if (container) {
        // Try to find the first data row
        const firstRow = container.querySelector('tbody tr');
        if (firstRow) {
            const cells = firstRow.getElementsByTagName('td');
            if (cells.length >= 3) {
                // Column 0: Sender, Column 1: Message, Column 2: Amount
                const rawSender = cells[0].innerText.trim();
                const rawMessage = cells[1].innerText.replace(/["“”]/g, '').trim(); 
                const rawAmount = cells[2].innerText.replace(/[^0-9]/g, '');

                lastTip = {
                    tipper: rawSender,
                    amount: rawAmount || "0",
                    message: rawMessage
                };
            }
        }
    }

    // 2. SEND VIA SOCKET
    if (lastTip) {
        // Get OBS Token from the input field
        const urlInput = document.getElementById('overlay-url');
        if (urlInput && urlInput.value.includes('/overlay/')) {
            const obsToken = urlInput.value.split('/overlay/')[1];
            
            // A. Join Room
            socket.emit('join-overlay', obsToken);
            
            // B. Send Alert (Bypassing Server API)
            setTimeout(() => {
                console.log("Replaying via Socket:", lastTip);
                socket.emit('new-tip', lastTip);
                alert(`Replaying tip from ${lastTip.tipper}!`);
            }, 100);
            
        } else {
            alert("Error: OBS Token not found. Please wait for dashboard to load.");
        }
    } else {
        alert("No recent tips found in the list.");
    }

    setTimeout(() => { btn.disabled = false; btn.innerText = "🔄 Latest Tip"; }, 1000);
}

loadDashboard();
