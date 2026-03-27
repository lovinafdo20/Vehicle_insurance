// 1. UPDATE THIS URL to your actual Render service link
const API_BASE = "https://drive-sure-5gwr.onrender.com"; 

// --- AUTHENTICATION LOGIC ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Store user data in localStorage for the dashboard
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message || "Login failed");
            }
        } catch (err) {
            alert("Cannot reach the backend API. Is your Render server awake?");
        }
    });
}

// --- DASHBOARD & VEHICLE LOGIC ---
const carForm = document.getElementById('carForm');
if (carForm) {
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        
        const vehicleData = {
            customer_id: user.customer_id, // Matches your SQL column
            vehicle_type: document.getElementById('vehicleType').value,
            make: document.getElementById('make').value,
            model: document.getElementById('model').value,
            year: document.getElementById('year').value,
            plate_no: document.getElementById('plateNo').value
        };

        try {
            const response = await fetch(`${API_BASE}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehicleData)
            });

            if (response.ok) {
                alert("Vehicle registered successfully!");
                location.reload(); // Refresh to show new vehicle
            }
        } catch (err) {
            console.error("Error saving vehicle:", err);
        }
    });
}

// --- DATA LOADING ---
async function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Display user name
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) welcomeMsg.innerText = `Welcome, ${user.name}!`;

    try {
        // Fetch vehicles from MySQL via Render
        const res = await fetch(`${API_BASE}/vehicles/${user.customer_id}`);
        const data = await res.json();
        
        const vehicleList = document.getElementById('vehicleList');
        if (vehicleList && data.cars) {
            vehicleList.innerHTML = data.cars.map(car => `
                <div class="card">
                    <h4>${car.year} ${car.make} ${car.model}</h4>
                    <p>Plate: ${car.plate_no}</p>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error("Failed to load data from Render:", err);
    }
}

// Initialize if on dashboard
if (window.location.pathname.includes('dashboard')) {
    loadDashboardData();
}
