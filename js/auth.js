// ==========================================
// 🔐 UNIVERSAL AUTH SYSTEM (Supabase)
// ==========================================

// 1. INITIALIZE SUPABASE
// ⚠️ REPLACE THIS WITH YOUR "ANON" KEY, NOT SERVICE_ROLE!
const supabaseUrl = 'https://abatvqodkwjdefhwwynj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXR2cW9ka3dqZGVmaHd3eW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY0OTYwNSwiZXhwIjoyMDg0MjI1NjA1fQ.JAvWPoWjL7GWpewP2Bq2dakBGPs2l-lulIu7tiJYVz0'; // <--- PUT ANON KEY HERE
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 🛡️ PAGE PROTECTION ROUTER
// ==========================================
async function checkAuth() {
    const path = window.location.pathname;

    // 1. Get Current Session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // 2. Define Page Types
    // Pages that require Login
    const protectedPages = ['/dashboard', '/dashboard.html', '/buy', '/buy.html'];
    // Pages that require Admin Role
    const adminPages = ['/admin', '/admin.html'];
    // Pages ONLY for logged-out users
    const publicAuthPages = ['/login', '/login.html', '/register', '/register.html'];

    // 3. Logic: Protected Pages (Dashboard/Buy)
    if (protectedPages.some(p => path.endsWith(p))) {
        if (!user) {
            window.location.href = '/login.html'; // Kick to login
        }
    }

    // 4. Logic: Admin Pages
    if (adminPages.some(p => path.endsWith(p))) {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        // Check Role (Assuming role is stored in user_metadata)
        if (user.user_metadata.role !== 'admin') {
            alert("⛔ Access Denied: Admins Only");
            window.location.href = '/dashboard.html';
        }
    }

    // 5. Logic: Public Auth Pages (Login/Register)
    // If logged in, don't let them see Login page -> Send to Dashboard
    if (publicAuthPages.some(p => path.endsWith(p))) {
        if (user) {
            // If admin, go to admin panel, else dashboard
            if (user.user_metadata.role === 'admin') {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/dashboard.html';
            }
        }
    }
}

// Run the check immediately
checkAuth();

// ==========================================
// 👁️ UI HELPER: TOGGLE PASSWORD
// ==========================================
window.togglePassword = function(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};

// ==========================================
// 📝 REGISTER PAGE LOGIC
// ==========================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const username = document.getElementById('username').value;
        const role = document.getElementById('role').value;
        const btn = registerForm.querySelector('button[type="submit"]');

        // Validation
        if (password !== confirmPass) return alert("❌ Passwords do not match!");
        if (password.length < 6) return alert("❌ Password must be at least 6 characters.");

        btn.innerText = "Creating Account...";
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { username: username, role: role }, // Saves to user_metadata
                    emailRedirectTo: window.location.origin + '/login.html'
                }
            });

            if (error) throw error;

            alert("✅ Registration Successful! Please Login.");
            window.location.href = 'login.html';

        } catch (err) {
            alert("❌ Error: " + err.message);
            btn.innerText = "Create Account";
            btn.disabled = false;
        }
    });
}

// ==========================================
// 🔑 LOGIN PAGE LOGIC
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button[type="submit"]');

        btn.innerText = "Logging in...";
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Success! The 'checkAuth' function will handle redirect automatically
            // But we can force it here for speed:
            const role = data.user.user_metadata.role;
            if (role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'dashboard.html';

        } catch (err) {
            alert("❌ Login Failed: " + err.message);
            btn.innerText = "Log In";
            btn.disabled = false;
        }
    });
}

// ==========================================
// 🚪 LOGOUT LOGIC (Global)
// ==========================================
window.logout = async function() {
    if (confirm("Are you sure you want to logout?")) {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        } else {
            alert("Error signing out");
        }
    }
};
