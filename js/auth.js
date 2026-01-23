// Initialize Supabase (Ensure your keys are correct here)
const supabaseUrl = 'https://abatvqodkwjdefhwwynj.supabase.co';
const supabaseKey = 'sb_publishable_TePONQyxqJL1A-zaO-iUeQ_h8lAllWV';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Toggle Password Function
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// Handle Form Submission
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const username = document.getElementById('username').value;
    const role = document.getElementById('role').value;
    const btn = document.querySelector('button[type="submit"]');

    // 1. Basic Validation
    if (password !== confirmPass) {
        alert("❌ Passwords do not match!");
        return;
    }
    if (password.length < 6) {
        alert("❌ Password must be at least 6 characters.");
        return;
    }

    btn.innerText = "Creating Account...";
    btn.disabled = true;

    try {
        // 2. Sign Up (We pass Username/Role in 'options' for the Trigger)
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username, // <--- The SQL Trigger grabs this
                    role: role          // <--- The SQL Trigger grabs this
                },
                // Where to send them after they click the email link
                emailRedirectTo: window.location.origin + 'https://tip.xdfun.in/login' 
            }
        });

        if (error) throw error;

        // 3. Success Feedback
        // If email verification is ON, session will be null here (Expected)
        if (data.user && !data.session) {
            alert("✅ Registration Successful! \n\nPLEASE CHECK YOUR EMAIL to confirm your account.");
            // Optional: Send them to login page
            window.location.href = 'https://tip.xdfun.in/login';
        } else {
            // If email verification is OFF, they are logged in immediately
            alert("✅ Account Created! Logging you in...");
            window.location.href = 'https://tip.xdfun.in/dashboard'; // or wherever you go
        }

    } catch (err) {
        console.error("Signup Error:", err);
        alert("❌ Error: " + err.message);
        btn.innerText = "Create Account";
        btn.disabled = false;
    }
});
