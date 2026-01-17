// ⚠️ REPLACE WITH YOUR RENDER URL
const API_URL = "https://xdtip-backend.onrender.com"; 

// ⚠️ REPLACE WITH YOUR GITHUB PAGES URL
const FRONTEND_URL = "https://bkonai00.github.io/xdtip-frontend/"; 

async function loadDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = "login.html";

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

            // 3. Show Current Logo (If it exists)
            if (user.logo_url) {
                document.getElementById('current-logo').src = user.logo_url;
            }

            // 4. HANDLE ROLES
            if (user.role === 'creator') {
                // SHOW Creator Tools
                document.getElementById('creator-section').style.display = 'block';
                
                // Show Withdraw Button (This was hidden by default)
                const withdrawBtn = document.getElementById('withdraw-btn');
                if(withdrawBtn) withdrawBtn.style.display = 'inline-block';

                // Generate Links
                // A. Alert Box (Points to Backend)
                const overlayLink = `${API_URL}/overlay/${user.obs_token}`;
                document.getElementById('overlay-url').value = overlayLink;

                // B. Tipping Page (Points to Frontend with ?u=username)
                const tipLink = `${FRONTEND_URL}/tip.html?u=${user.username}`;
                document.getElementById('tip-page-url').value = tipLink;

                // Load History
                // Load Tips History
                loadHistory(token);
                
                // ✅ Load Withdrawal History
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
                html += `
                    <tr>
                        <td style="font-weight:bold;">${tip.sender}</td>
                        <td style="color:#aaa;">"${tip.message}"</td>
                        <td class="history-amount">+${tip.amount}</td>
                        <td>${tip.date}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #444; text-align:center;">No tips received yet. Share your link!</p>';
        }
    } catch (err) {
        console.error("History Error", err);
    }
}

// Helper: Copy to Clipboard
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    alert("Copied link: " + copyText.value);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = "login.html";
}

// UPLOAD LOGO FUNCTION
async function uploadLogo() {
    const fileInput = document.getElementById('logo-file');
    const file = fileInput.files[0];
    const status = document.getElementById('upload-status');
    const token = localStorage.getItem('token');

    if (!file) return;

    // specific check for file size (max 2MB)
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
            headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type needed for FormData
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            status.innerText = "Done!";
            // Update the image immediately
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

// ✅ NEW: SUBMIT WITHDRAWAL FUNCTION
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
            loadDashboard(); // Refresh balance
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Request Failed");
    }
}

// Fetch and Render Withdrawals
async function loadWithdrawals(token) {
    try {
        const res = await fetch(`${API_URL}/withdrawals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        const container = document.getElementById('payout-container');
        
        if (data.success && data.history.length > 0) {
            let html = '<table class="history-table"><thead><tr><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>';
            
            data.history.forEach(w => {
                // Color code status
                let color = w.status === 'paid' ? '#4caf50' : '#ff9800'; // Green if paid, Orange if pending

                html += `
                    <tr>
                        <td>${w.date}</td>
                        <td style="font-weight:bold;">${w.amount}</td>
                        <td style="color:${color}; text-transform:uppercase; font-size:12px; font-weight:bold;">${w.status}</td>
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

// Run on load
loadDashboard();

