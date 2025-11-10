const BASE_URL = "http://localhost:8080/api/auth";
const OTP_URL = "http://localhost:8080/otp";
const adminEmail = "admin123@gmail.com";
const adminPassword = "Admin@123";

async function sendOtp() {
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    if (!name || !email || !password) {
        alert("All fields are required");
        return;
    }

    try {
        // Send OTP
        const res = await fetch(`${OTP_URL}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: email })
        });

        const msg = await res.text();
        alert(msg);

        if (res.ok) {
            // Show OTP input
            document.getElementById("otp").style.display = "block";
            document.getElementById("verifyBtn").style.display = "inline-block";

            // Store temp user info
            localStorage.setItem("tempName", name);
            localStorage.setItem("tempEmail", email);
            localStorage.setItem("tempPassword", password);
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong while sending OTP");
    }
}

async function verifyOtp() {
    const otp = document.getElementById("otp").value;
    const email = localStorage.getItem("tempEmail");
    const name = localStorage.getItem("tempName");
    const password = localStorage.getItem("tempPassword");

    if (!otp) {
        alert("Enter OTP");
        return;
    }

    try {
        const res = await fetch(`${OTP_URL}/verify?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, {
            method: "POST"
        });

        const result = await res.text();
        alert(result);

        if (result.trim().toLowerCase().includes("successfully")) {
            const registerRes = await fetch(`${BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            if (registerRes.ok) {
                alert("Successfully Registered");
                window.location.href = "../html/login.html";
                localStorage.clear();
            } else {
                const data = await registerRes.json();
                alert(data.message || "Registration Failed");
            }
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong during OTP verification");
    }
}

async function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("All fields are required");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const data = await res.json();

            // Store user details locally for session
            localStorage.setItem("loggedInUser", JSON.stringify(data));

            alert("Login successful! Redirecting...");
            window.location.href = "../html/user_options.html"; // ✅ redirect here
        } else {
            const data = await res.json();
            alert(data.message || "Login failed");
        }
    } catch (error) {
        console.error(error);
        alert("Something went wrong");
    }
}


async function loginAdmin(){
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    if (email===adminEmail&&password===adminPassword){
        alert("Login Successful Redirecting...");
        window.location.href = "../html/admindashboard.html";
    }else{
        alert("Login Failed Please Try Again");
    }
}