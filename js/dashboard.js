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

        // SAFETY FIX: If API is broken (404), stop here to prevent crashing
        if (res.status === 404) {
            console.warn("API Not Found. Dashboard running in UI-Only mode.");
            // Force show sections so you can at least see the UI
            const creatorSec = document.getElementById('creator-section');
            if(creatorSec) creatorSec.style.display = 'block';
            return;
        }

        const data = await res.json();

        if (data.success) {
            const user = data.user;

            // 2. Fill Basic Info (Check if elements exist first)
            if(document.getElementById('user-name')) document.getElementById('user-name').innerText = user.username;
            if(document.getElementById('balance')) document.getElementById('balance').innerText = user.balance;
            if(document.getElementById('role-badge')) document.getElementById('role-badge').innerText = user.role.toUpperCase();

            const logoImg = document.getElementById('current-logo');
            if (logoImg) {
                if (user.logo_url) {
                    logoImg.src = user.logo_url;
                } else {
                    logoImg.src = `https://ui-avatars.com/api/?name=${user.username}&background=00ff88&color=000&size=128`;
                }
            }

            // 4. HANDLE ROLES
            if (user.role === 'creator') {
                // SHOW Creator Tools
                if(document.getElementById('creator-section')) document.getElementById('creator-section').style.display = 'block';
                
                // Show Withdraw Button
                const withdrawBtn = document.getElementById('withdraw-btn');
                if(withdrawBtn) withdrawBtn.style.display = 'inline-block';

                // Set Theme Dropdown
                if(document.getElementById('theme-selector')) {
                    if (user.overlay_theme) {
                        document.getElementById('theme-selector').value = user.overlay_theme;
                    } else {
                        document.getElementById('theme-selector').value = 'classic';
                    }
                }

                // Generate Links
                const overlayLink = `${API_URL}/overlay/${user.obs_token}`;
                if(document.getElementById('overlay-url')) document.getElementById('overlay-url').value = overlayLink;

                const statsLink = `${API_URL}/stats-overlay/${user.obs_token}`;
                const statsInput = document.getElementById('stats-link');
                if (statsInput) statsInput.value = statsLink;

                const tipLink = `https://tip.xdfun.in/u/${user.username}`;
                if(document.getElementById('tip-page-url')) document.getElementById('tip-page-url').value = tipLink;

                // Load History
                loadHistory(token);
                loadWithdrawals(token);

            } else {
                // SHOW Viewer Section
                if(document.getElementById('viewer-section')) document.getElementById('viewer-section').style.display = 'block';
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
        
        // SAFETY FIX: If history API is 404, stop here
        if(res.status === 404) return;

        const data = await res.json();
        const container = document.getElementById('history-container');
        
        // SAFETY FIX: Only run if the container exists in HTML
        if (container) {
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
        }
    } catch (err) { console.error("History Error", err); }
}

// Fetch Withdrawal History
async function loadWithdrawals(token) {
    try {
        const res = await fetch(`${API_URL}/withdrawals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // SAFETY FIX: If API is 404, stop here
        if(res.status === 404) return;

        const data = await res.json();
        const container = document.getElementById('payout-container');
        
        // SAFETY FIX: Only set innerHTML if the container actually exists!
        if (container) {
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
        }
    } catch (err) {
        console.error("Payout History Error", err);
    }
}

// Helper: Copy to Clipboard
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    if(copyText) {
        copyText.select();
        navigator.clipboard.writeText(copyText.value);
        alert("Copied link: " + copyText.value);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = "/login/";
}

// Save Theme Function
async function saveTheme() {
    const themeSelector = document.getElementById('theme-selector');
    if(!themeSelector) return;
    
    const theme = themeSelector.value;
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
    if(!fileInput) return;
    
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
        if(status) status.innerText = "Uploading...";
        const res = await fetch(`${API_URL}/upload-logo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            if(status) status.innerText = "Done!";
            if(document.getElementById('current-logo')) document.getElementById('current-logo').src = data.url;
            alert("Logo Updated Successfully!");
        } else {
            if(status) status.innerText = "Failed.";
            alert("Upload Failed: " + data.error);
        }
    } catch (err) {
        console.error(err);
        if(status) status.innerText = "Error.";
        alert("Server Error");
    }
}

// Submit Withdrawal Function
async function submitWithdraw() {
    const amountInput = document.getElementById('w-amount');
    const upiInput = document.getElementById('w-upi');
    
    if(!amountInput || !upiInput) return;

    const amount = amountInput.value;
    const upiId = upiInput.value;
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
            const modal = document.getElementById('withdraw-modal');
            if(modal) modal.style.display = 'none';
            loadDashboard(); 
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Request Failed");
    }
}

// Standard Test Alert
async function sendTestAlert() {
    const btn = document.getElementById('test-btn');
    const token = localStorage.getItem('token');

    if (!token) return alert("Please login first");

    if(btn) {
        btn.innerText = "Sending...";
        btn.disabled = true;
    }

    try {
        const res = await fetch(`${API_URL}/overlay/test-alert`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tipper: "Test User", amount: 500, message: "Test Alert" })
        });
        
        const data = await res.json();
        
        if (data.success) {
            if(btn) btn.innerText = "✅ Sent!";
        } else {
            // Fallback: Use Socket if available
            if(typeof window.socket !== 'undefined') {
                window.socket.emit('new-tip', { tipper: "Test User", amount: 500, message: "Test Alert" });
                if(btn) btn.innerText = "✅ Sent (Socket)";
            } else {
                alert("Failed: " + data.error);
                if(btn) btn.innerText = "❌ Error";
            }
        }
    } catch (err) {
        // Fallback on error
        if(typeof window.socket !== 'undefined') {
             window.socket.emit('new-tip', { tipper: "Test User", amount: 500, message: "Test Alert" });
             if(btn) btn.innerText = "✅ Sent (Socket)";
        } else {
            console.error(err);
            if(btn) btn.innerText = "❌ Error";
        }
    }
    
    if(btn) {
        setTimeout(() => { btn.innerText = "🔥 Test Alert"; btn.disabled = false; }, 2000);
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
        // Try multiple selectors to find a row
        const firstRow = container.querySelector('tbody tr') || container.querySelector('table tr:nth-child(2)');
        
        if (firstRow) {
            const cells = firstRow.getElementsByTagName('td');
            // Ensure we have enough data (Name, Message, Amount)
            if (cells.length >= 3) {
                // Parse the data carefully
                const rawSender = cells[0].innerText.trim();
                const rawMessage = cells[1].innerText.replace(/["“”]/g, '').trim(); 
                const rawAmount = cells[2].innerText.replace(/[^0-9.]/g, ''); 

                lastTip = {
                    tipper: rawSender,
                    amount: rawAmount || "0", // Default to 0 if parsing fails
                    message: rawMessage
                };
            }
        }
    }

    // 2. SEND TO OVERLAY VIA SOCKET
    if (lastTip) {
        if (typeof window.socket !== 'undefined') {
            console.log("Replaying via Socket:", lastTip);
            
            // Get OBS Token from the input box
            const urlInput = document.getElementById('overlay-url');
            let tokenToUse = null;
            if (urlInput && urlInput.value.includes('/overlay/')) {
                tokenToUse = urlInput.value.split('/overlay/')[1];
            }

            if (tokenToUse) {
                window.socket.emit('join-overlay', tokenToUse);
                
                setTimeout(() => {
                    window.socket.emit('new-tip', lastTip);
                    alert(`Replaying tip from ${lastTip.tipper}!`);
                }, 100);
            } else {
                alert("Could not find OBS Token. Please wait for dashboard to load.");
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

// Don't run loadDashboard() here automatically because it might conflict 
// with the HTML script. Only define the functions.
// If you want it to run automatically, uncomment the line below:
loadDashboard();
