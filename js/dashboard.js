// URL Cleaner
if (window.location.pathname.endsWith('.html')) {
    window.history.replaceState(null, '', window.location.pathname.replace('.html', ''));
}

const API_URL = "https://app.xdfun.in"; 

// ✅ CONNECT SOCKET (Required for 'Latest Tip' logic)
// 'io' will now work because we added the script tag in HTML
const socket = io('https://app.xdfun.in', { transports: ['websocket', 'polling'] });

async function loadDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = "/login/";

    try {
        const res = await fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success) {
            const user = data.user;
            
            // Fill Info
            document.getElementById('user-name').innerText = user.username;
            document.getElementById('balance').innerText = user.balance;
            
            // ✅ FIX ROLE DISPLAY
            const roleBadge = document.getElementById('role-badge');
            roleBadge.innerText = user.role.toUpperCase();
            if(user.role === 'creator') roleBadge.classList.add('creator');

            const logoImg = document.getElementById('current-logo');
            logoImg.src = user.logo_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`;

            if (user.role === 'creator') {
                document.getElementById('creator-section').style.display = 'block';
                document.getElementById('withdraw-btn').style.display = 'inline-block';
                if(document.getElementById('theme-selector')) document.getElementById('theme-selector').value = user.overlay_theme || 'classic';

                document.getElementById('overlay-url').value = `${API_URL}/overlay/${user.obs_token}`;
                if(document.getElementById('stats-link')) document.getElementById('stats-link').value = `${API_URL}/stats-overlay/${user.obs_token}`;
                if(document.getElementById('tip-page-url')) document.getElementById('tip-page-url').value = `https://tip.xdfun.in/u/${user.username}`;

                loadHistory(token);
                loadWithdrawals(token);
            } else {
                document.getElementById('viewer-section').style.display = 'block';
            }
        } else {
            logout();
        }
    } catch (err) { console.error("Error", err); }
}

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
    
    setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
}

// ✅ NEW FUNCTION: REPLAY LATEST TIP
// Reads the table and sends data directly via Socket (Bypasses Server API)
function replayLastTip() {
    const btn = document.getElementById('replay-btn');
    btn.disabled = true; btn.innerText = "Scanning...";

    // 1. Get Data from Table
    const container = document.getElementById('history-container');
    let lastTip = null;

    if (container) {
        const firstRow = container.querySelector('tbody tr');
        if (firstRow) {
            const cells = firstRow.getElementsByTagName('td');
            if (cells.length >= 3) {
                lastTip = {
                    tipper: cells[0].innerText.trim(),
                    amount: cells[2].innerText.replace(/[^0-9]/g, ''), // Clean amount
                    message: cells[1].innerText.replace(/["“”]/g, '').trim()
                };
            }
        }
    }

    // 2. Send via Socket
    if (lastTip) {
        const urlInput = document.getElementById('overlay-url');
        if (urlInput && urlInput.value.includes('/overlay/')) {
            const obsToken = urlInput.value.split('/overlay/')[1];
            
            // Join Room & Emit
            socket.emit('join-overlay', obsToken);
            setTimeout(() => {
                socket.emit('new-tip', lastTip);
                alert(`Replaying tip from ${lastTip.tipper}!`);
            }, 100);
        } else {
            alert("Wait for dashboard to load...");
        }
    } else {
        alert("No recent tips found in table.");
    }

    setTimeout(() => { btn.disabled = false; btn.innerText = "🔄 Latest Tip"; }, 1000);
}

// Helpers
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select(); navigator.clipboard.writeText(copyText.value); alert("Copied!");
}
function logout() { localStorage.removeItem('token'); window.location.href = "/login/"; }
async function saveTheme() { /* Your existing saveTheme code */ }
async function uploadLogo() { /* Your existing uploadLogo code */ }
async function submitWithdraw() { /* Your existing submitWithdraw code */ }
async function loadWithdrawals(token) { /* Your existing loadWithdrawals code */ }

loadDashboard();
