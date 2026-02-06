// ----------------------------------------------------
// 🧹 URL CLEANER: Hides ".html" from the browser bar
// ----------------------------------------------------
if (window.location.pathname.endsWith('.html')) {
    const cleanUrl = window.location.pathname.replace('.html', '');
    window.history.replaceState(null, '', cleanUrl);
}
// ----------------------------------------------------

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
            if (user.role === 'creator') {
                // SHOW Creator Tools
                document.getElementById('creator-section').style.display = 'block';
                
                // Show Withdraw Button
                const withdrawBtn = document.getElementById('withdraw-btn');
                if(withdrawBtn) withdrawBtn.style.display = 'inline-block';

                // Set Theme Dropdown
                if (user.overlay_theme) {
                    document.getElementById('theme-selector').value = user.overlay_theme;
                } else {
                    document.getElementById('theme-selector').value = 'classic';
                }

                // Generate Links
                const overlayLink = `${API_URL}/overlay/${user.obs_token}`;
                document.getElementById('overlay-url').value = overlayLink;

                // Stats Widget Link
                const statsLink = `${API_URL}/stats-overlay/${user.obs_token}`;
                const statsInput = document.getElementById('stats-link');
                if (statsInput) {
                    statsInput.value = statsLink;
                }

                const tipLink = `https://tip.xdfun.in/u/${user.username}`;
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
            // NOTE: We structure this specifically so replayLastTip can read it later
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
        
        // Fix: Ensure the table structure exists before filling logic
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

// Standard Test Alert
async function sendTestAlert() {
    const btn = document.getElementById('test-btn');
    const token = localStorage.getItem('token');

    if (!token) return alert("Please login first");

    btn.innerText = "Sending...";
    btn.disabled = true;

    try {
        // Use the global API_URL
        const res = await fetch(`${API_URL}/overlay/test-alert`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Sending a body so backend can use it if configured
            body: JSON.stringify({ tipper: "Test User", amount: 500, message: "Test Alert" })
        });
        
        const data = await res.json();
        
        if (data.success) {
            btn.innerText = "✅ Sent!";
            setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
        } else {
            // Fallback: If API fails, try Direct Socket if available
            if(typeof window.socket !== 'undefined') {
                window.socket.emit('new-tip', { tipper: "Test User", amount: 500, message: "Test Alert" });
                btn.innerText = "✅ Sent (Socket)";
                setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
            } else {
                alert("Failed: " + data.error);
                btn.innerText = "❌ Error";
            }
        }
    } catch (err) {
        console.error(err);
        // Fallback on error
        if(typeof window.socket !== 'undefined') {
             window.socket.emit('new-tip', { tipper: "Test User", amount: 500, message: "Test Alert" });
             btn.innerText = "✅ Sent (Socket)";
             setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
        } else {
            alert("Server Error");
            btn.innerText = "🔥 Test Alert";
            btn.disabled = false;
        }
    }
}

// ----------------------------------------------------
// 🆕 NEW FEATURE: REPLAY LATEST TIP
// ----------------------------------------------------
async function replayLastTip() {
    const btn = document.getElementById('replay-btn');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "Scanning...";
    }

    let lastTip = null;

    // 1. SCRAPE DATA FROM THE TABLE ON SCREEN
    const container = document.getElementById('history-container');
    if (container) {
        // Find the first row in the table body
        const firstRow = container.querySelector('tbody tr');
        if (firstRow) {
            const cells = firstRow.getElementsByTagName('td');
            // Check if we have enough columns (Sender, Message, Amount)
            if (cells.length >= 3) {
                // Col 0: Sender, Col 1: Message, Col 2: Amount
                const rawSender = cells[0].innerText.trim();
                const rawMessage = cells[1].innerText.replace(/["“”]/g, '').trim(); // Remove quotes
                const rawAmount = cells[2].innerText.replace(/[^0-9.]/g, ''); // Keep only numbers

                lastTip = {
                    tipper: rawSender,
                    amount: rawAmount || "0",
                    message: rawMessage
                };
            }
        }
    }

    // 2. SEND TO OVERLAY VIA SOCKET
    if (lastTip) {
        // Check if Socket.IO is loaded (from HTML)
        if (typeof window.socket !== 'undefined') {
            console.log("Replaying via Socket:", lastTip);
            
            // Get OBS Token from the input box
            const urlInput = document.getElementById('overlay-url');
            let tokenToUse = null;
            if (urlInput && urlInput.value.includes('/overlay/')) {
                tokenToUse = urlInput.value.split('/overlay/')[1];
            }

            if (tokenToUse) {
                // Ensure we are in the room
                window.socket.emit('join-overlay', tokenToUse);
                
                // Send the alert
                setTimeout(() => {
                    window.socket.emit('new-tip', lastTip);
                    alert(`Replaying tip from ${lastTip.tipper}!`);
                }, 100);
            } else {
                alert("Could not find OBS Token. Wait for dashboard to load completely.");
            }
        } else {
            alert("Socket connection missing. Please refresh the page.");
        }
    } else {
        alert("No recent tips found in the history table.");
    }

    if(btn) {
        setTimeout(() => {
            btn.disabled = false;
            btn.innerText = "🔄 Latest Tip";
        }, 1000);
    }
}

// Run on load
loadDashboard();
