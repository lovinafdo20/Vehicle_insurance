const API_BASE = "https://drive-sure-5gwr.onrender.com";

// --- SESSION MANAGEMENT ---
function saveSession(user) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("loggedIn", "true");
}

function getSession() {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
}

function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
}

// --- FORMATTERS ---
function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateLabel(value) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "None";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// --- CORE REQUEST HANDLER (THE FIX) ---
async function sendRequest(path, options = {}) {
  // Ensure the path always starts with a slash for clean URL building
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${cleanPath}`;

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json", // Tells Render to send JSON, not HTML
        ...options.headers
      }
    });
  } catch (_error) {
    throw new Error(`Cannot reach the backend. If it's been a while, wait 30s for Render to wake up and try again.`);
  }

  const contentType = response.headers.get("content-type") || "";

  // If we get HTML, we hit a 404 or a landing page instead of the API
  if (contentType.includes("text/html")) {
    throw new Error("The backend returned a page instead of data. Check if the URL path is correct.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

// --- EVENT LISTENERS ---

// 1. Registration
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  try {
    const data = await sendRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    saveSession(data.user);
    alert(data.message);
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});

// 2. Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  };

  try {
    const data = await sendRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    saveSession(data.user);
    alert(data.message);
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});

// 3. Add Vehicle
document.getElementById("carForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getSession();
  if (!user?.customer_id) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const payload = {
    customer_id: user.customer_id,
    model_no: document.getElementById("model").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    color: document.getElementById("color").value.trim(),
    price: document.getElementById("price").value
  };

  try {
    const data = await sendRequest("/cars", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    alert(data.message);
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});

// --- DASHBOARD LOADING ---
async function loadDashboardVehicles() {
  const vehicleGrid = document.getElementById("vehicleGrid");
  const vehicleCount = document.getElementById("vehicleCount");
  const user = getSession();

  if (!vehicleGrid || !user) return;

  try {
    const data = await sendRequest(`/cars/${user.customer_id}`, { method: "GET" });
    const cars = data.cars || [];
    
    if (vehicleCount) vehicleCount.textContent = `${cars.length} vehicle${cars.length === 1 ? "" : "s"}`;
    vehicleGrid.innerHTML = "";

    cars.forEach(car => {
      const card = document.createElement("article");
      card.className = "vehicle-item";
      card.innerHTML = `
        <h3>${car.brand} ${car.model_no}</h3>
        <p>Color: ${car.color} | Value: ${formatCurrency(car.price)}</p>
      `;
      vehicleGrid.appendChild(card);
    });
  } catch (error) {
    console.error(error.message);
  }
}

// --- INITIALIZE ---
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboardVehicles();
}
