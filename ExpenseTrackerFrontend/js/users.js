const API_BASE = 'http://localhost:8080/api/users';

// --- HELPER FUNCTIONS ---
/**
 * Displays a message in a <pre> tag and adds a success/error class
 * @param {string} elementId - The ID of the <pre> element
 * @param {string} message - The text to display
 * @param {boolean} isError - True for error (red), false for success (green)
 */
function showResponse(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = isError ? 'error' : 'success';
}

/**
 * Displays JSON data in a <pre> tag
 * @param {string} elementId - The ID of the <pre> element
 * @param {object} data - The JSON object to stringify
 */
function showJsonResponse(elementId, data) {
    const element = document.getElementById(elementId);
    element.textContent = JSON.stringify(data, null, 2);
    element.className = 'success'; // Show JSON with success styling
}
// --- END HELPERS ---


async function fetchData(endpoint){
    const res = await fetch(API_BASE + endpoint);
    return res;
}

async function postData(endpoint, data, method) {
    // Handle DELETE requests which might not have a body
    const options = {
        method: method,
        headers: {'Content-Type': 'application/json'},
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const res = await fetch(API_BASE + endpoint, options);
    return res;
}

async function createUser() {
    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;
    let password = document.getElementById("userPassword").value;

    if (!password) {
        password = "pass@123";
    }
    
    if (!name || !email) {
        showResponse("CreateUser", "Name and Email are required.", true);
        return;
    }

    const user = {
        name: name,
        email: email,
        password: password
    };

    try {
        const res = await postData('', user, 'POST');
        if (!res.ok) {
            const errorMsg = await res.text();
            showResponse("CreateUser", `Failed To Create User: ${errorMsg}`, true);
            return;
        }
        const result = await res.json(); // Get the new user response
        showJsonResponse("CreateUser", result); // Show the new user
        document.getElementById("createUserForm").reset();
    } catch (error) {
        showResponse("CreateUser", "Error In Creating User", true);
        console.log(error);
    }
}

async function fetchAllUsers() {
    try{
        const res = await fetchData('');
        if(!res.ok) {
            showResponse("GetUser", "Failed To fetch users", true);
            return;
        }
        const result = await res.json();
        showJsonResponse("GetUser", result);
    }catch(error) {
        showResponse("GetUser", "Error Fetching Users", true);
        console.log(error);
    }
}

async function fetchUsersByID() {
    const id = document.getElementById("userId").value;
    if(!id){
        return alert("Enter A User Id");
    }
    try{
        // --- THIS IS THE FIX ---
        // Removed the extra text that was causing the syntax error
        const res = await fetchData('/' + id);
        // --- END OF FIX ---

        if(!res.ok) {
            showResponse("GetUserById", "Failed To fetch user", true);
            return;
        }
        const result = await res.json();
        showJsonResponse("GetUserById", result);
    }catch(error) {
        showResponse("GetUserById", "Error Fetching Users", true);
        console.log(error);
    }
}

/**
 * This is the new, smart update function
 */
async function updateUser(){
    const id = document.getElementById("updateUserId").value;
    if (!id) {
        showResponse("UpdateUser", "Please enter a User ID to update.", true);
        return;
    }

    // Read values from all fields
    const name = document.getElementById("updateUserName").value;
    const email = document.getElementById("updateUserEmail").value;
    const password = document.getElementById("updateUserPassword").value;
    const wallet = document.getElementById("updateUserWallet").value;

    // Build the request object ONLY with the fields the admin filled in
    const userRequest = {};

    if (name) {
        userRequest.name = name;
    }
    if (email) {
        userRequest.email = email;
    }
    if (password) {
        userRequest.password = password;
    }
    if (wallet) {
        userRequest.walletBalance = parseFloat(wallet);
    }

    // Check if at least one field is being updated
    if (Object.keys(userRequest).length === 0) {
        showResponse("UpdateUser", "Please fill in at least one field to update.", true);
        return;
    }
    
    try{
        // Send the PUT request with the dynamically built object
        const res = await postData('/' + id, userRequest, 'PUT');
        if(!res.ok) {
            const errorMsg = await res.text();
            showResponse("UpdateUser", `Failed To Update user: ${errorMsg}`, true);
            return;
        }
        const result = await res.json();
        showJsonResponse("UpdateUser", result); // Show the updated user
        document.getElementById("updateUserForm").reset();
    }catch(error) {
        showResponse("UpdateUser", "Error Updating User", true);
        console.log(error);
    }
}

async function deleteUser() {
    const id = document.getElementById("deleteUserId").value;
    if (!id) {
        return alert("Enter a User ID");
    }
    try {
        const res = await postData('/' + id, null, 'DELETE');
        if (!res.ok) {
            showResponse("DeleteUser", "Failed To Delete User", true);
            return;
        }
        showResponse("DeleteUser", "Deleted Successfully", false);
    } catch (error) {
        showResponse("DeleteUser", "Error Deleting User", true);
        console.log(error);
    }
}