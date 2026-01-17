// ⚠️ REPLACE WITH YOUR RENDER URL
const API_URL = "https://xdtip-backend.onrender.com"; 

// ⚠️ REPLACE WITH YOUR GITHUB PAGES URL (Where your frontend lives)
// Example: "https://yourname.github.io/xdtip-frontend"
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

        // ... inside loadDashboard() ...
if (data.success) {
    const user = data.user;
    // ... existing lines ...
    document.getElementById('role-badge').innerText = user.role.toUpperCase();

    // ✅ ADD THIS: Show Current Logo
    if (user.logo_url) {
        document.getElementById('current-logo').src = user.logo_url;
    }
    // ...

            // 2. Fill Basic Info
            document.getElementById('user-name').innerText = user.username;
            document.getElementById('balance').innerText = user.balance;
            document.getElementById('role-badge').innerText = user.role.toUpperCase();

            // 3. HANDLE ROLES
            if (user.role === 'creator') {
                // SHOW Creator Tools
                document.getElementById('creator-section').style.display = 'block';
                document.getElementById('withdraw-btn').style.display = 'inline-block'; // Show withdraw

                // Generate Links
                // A. Alert Box (Points to Backend)
                const overlayLink = `${API_URL}/overlay/${user.obs_token}`;
                document.getElementById('overlay-url').value = overlayLink;

                // B. Tipping Page (Points to Frontend with ?u=username)
                const tipLink = `${FRONTEND_URL}/tip.html?u=${user.username}`;
                document.getElementById('tip-page-url').value = tipLink;

                // Load History
                loadHistory(token);

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

// Run on load
loadDashboard();




