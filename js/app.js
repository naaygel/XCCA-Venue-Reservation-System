let reservations = [];
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;
let authToken = sessionStorage.getItem("authToken") || null;

function saveCurrentUser() {
  if (currentUser && authToken) {
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    sessionStorage.setItem("authToken", authToken);
  } else {
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("authToken");
  }
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`
  };
}

function showTab(tabId) {
  const protectedTabs = ["homeTab", "reservationsTab"];

  if (protectedTabs.includes(tabId) && !currentUser) {
    alert("Please login first.");
    tabId = "loginTab";
  }

  if (tabId === "adminTab") {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Admin access only.");
      return;
    }
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
}

function updateNavigation() {
  const isLoggedIn = Boolean(currentUser);
  const isAdmin = currentUser && currentUser.role === "admin";

  document.getElementById("loginNav").classList.toggle("hidden", isLoggedIn);
  document.getElementById("signupNav").classList.toggle("hidden", isLoggedIn);
  document.getElementById("homeNav").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("reservationsNav").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("adminNav").classList.toggle("hidden", !isAdmin);
  document.getElementById("logoutNav").classList.toggle("hidden", !isLoggedIn);

  const welcomeText = document.getElementById("welcomeText");

  if (welcomeText) {
    welcomeText.innerText = currentUser
      ? `Welcome, ${currentUser.name}`
      : "Welcome Guest";
  }
}

async function register() {
  const name = document.getElementById("name").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const userId = document.getElementById("userId").value.trim();

  if (!name || !username || !password || !userId) {
    alert("Please fill all fields.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password, studentId: userId })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Registration failed.");
      return;
    }

    alert("Account created successfully! Please login.");

    document.getElementById("name").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("userId").value = "";

    showTab("loginTab");
  } catch (error) {
    console.error(error);
    alert("Unable to register. Please check your API connection.");
  }
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!username || !password) {
    alert("Please enter username and password.");
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Invalid username or password.");
      return;
    }

    currentUser = result.user;
    authToken = result.token;

    saveCurrentUser();
    updateNavigation();

    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";

    await loadReservations();

    alert(currentUser.role === "admin" ? "Admin login successful." : "User login successful.");
    showTab("homeTab");
  } catch (error) {
    console.error(error);
    alert("Unable to login. Please check your API connection.");
  }
}

function logout() {
  currentUser = null;
  authToken = null;
  reservations = [];

  saveCurrentUser();
  updateNavigation();
  renderReservations();
  clearReservationForm();

  alert("You have logged out.");
  showTab("loginTab");
}

async function addReservation() {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const venue = document.getElementById("venue").value;
  const eventName = document.getElementById("eventName").value.trim();
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const organizationName = document.getElementById("organizationName").value.trim();

  if (!venue || !eventName || !date || !startTime || !endTime || !organizationName) {
    alert("Please complete all reservation details.");
    return;
  }

  if (startTime >= endTime) {
    alert("End time must be later than start time.");
    return;
  }

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        eventName,
        venue,
        date,
        startTime,
        endTime,
        organizationName
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Reservation failed.");
      return;
    }

    await loadReservations();
    clearReservationForm();

    alert("Reservation submitted and is pending approval.");
    showTab("reservationsTab");
  } catch (error) {
    console.error(error);
    alert("Unable to add reservation. Please check your API connection.");
  }
}

async function loadReservations() {
  if (!currentUser || !authToken) {
    reservations = [];
    renderReservations();
    return;
  }

  try {
    const response = await fetch("/api/reservations", {
      method: "GET",
      headers: authHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Unable to load reservations.");
      return;
    }

    reservations = result.reservations || [];
    renderReservations();
  } catch (error) {
    console.error(error);
    alert("Unable to load reservations. Please check your API connection.");
  }
}

function renderReservations() {
  const myTable = document.getElementById("myReservations");
  const allTable = document.getElementById("allReservations");
  const adminTable = document.getElementById("adminReservations");

  if (!myTable || !allTable || !adminTable) return;

  myTable.innerHTML = "";
  allTable.innerHTML = "";
  adminTable.innerHTML = "";

  if (!currentUser) {
    return;
  }

  reservations.forEach((reservation) => {
    allTable.innerHTML += `
      <tr>
        <td>${reservation.name}</td>
        <td>${reservation.eventName}</td>
        <td>${reservation.venue}</td>
        <td>${reservation.date}</td>
        <td>${reservation.startTime}</td>
        <td>${reservation.endTime}</td>
        <td>${reservation.organizationName}</td>
        <td>${reservation.status}</td>
      </tr>
    `;

    if (reservation.userId === currentUser.id) {
      myTable.innerHTML += `
        <tr>
          <td>${reservation.eventName}</td>
          <td>${reservation.venue}</td>
          <td>${reservation.date}</td>
          <td>${reservation.startTime}</td>
          <td>${reservation.endTime}</td>
          <td>${reservation.organizationName}</td>
          <td>${reservation.status}</td>
          <td>
            <button onclick="editReservation(${reservation.id})">Edit</button>
            <button class="delete-btn" onclick="deleteReservation(${reservation.id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    }

    if (currentUser.role === "admin") {
      adminTable.innerHTML += `
        <tr>
          <td>${reservation.name}</td>
          <td>${reservation.eventName}</td>
          <td>${reservation.venue}</td>
          <td>${reservation.date}</td>
          <td>${reservation.startTime}</td>
          <td>${reservation.endTime}</td>
          <td>${reservation.organizationName}</td>
          <td>${reservation.status}</td>
          <td>
            <button class="approve-btn" onclick="approveReservation(${reservation.id})">
              Approve
            </button>
            <button class="delete-btn" onclick="deleteReservation(${reservation.id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    }
  });

  if (myTable.innerHTML === "") {
    myTable.innerHTML = `
      <tr>
        <td colspan="8">No reservations created yet.</td>
      </tr>
    `;
  }

  if (allTable.innerHTML === "") {
    allTable.innerHTML = `
      <tr>
        <td colspan="8">No reservations available yet.</td>
      </tr>
    `;
  }

  if (currentUser.role === "admin" && adminTable.innerHTML === "") {
    adminTable.innerHTML = `
      <tr>
        <td colspan="9">No reservations available yet.</td>
      </tr>
    `;
  }
}

async function deleteReservation(id) {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (!confirm("Are you sure you want to delete this reservation?")) {
    return;
  }

  try {
    const response = await fetch(`/api/reservations/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Delete failed.");
      return;
    }

    await loadReservations();
    alert("Reservation deleted.");
  } catch (error) {
    console.error(error);
    alert("Unable to delete reservation. Please check your API connection.");
  }
}

async function editReservation(id) {
  const reservation = reservations.find(item => item.id === id);

  if (!reservation) {
    alert("Reservation not found.");
    return;
  }

  if (!currentUser || reservation.userId !== currentUser.id) {
    alert("You can only edit your own reservation.");
    return;
  }

  const newEventName = prompt("Edit Event Name:", reservation.eventName);
  const newVenue = prompt("Edit Venue:", reservation.venue);
  const newDate = prompt("Edit Date YYYY-MM-DD:", reservation.date);
  const newStartTime = prompt("Edit Start Time HH:MM:", reservation.startTime);
  const newEndTime = prompt("Edit End Time HH:MM:", reservation.endTime);
  const newOrganizationName = prompt("Edit Organization Name:", reservation.organizationName);

  if (!newEventName || !newVenue || !newDate || !newStartTime || !newEndTime || !newOrganizationName) {
    alert("Edit cancelled or incomplete.");
    return;
  }

  if (newStartTime >= newEndTime) {
    alert("End time must be later than start time.");
    return;
  }

  try {
    const response = await fetch(`/api/reservations/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        eventName: newEventName,
        venue: newVenue,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        organizationName: newOrganizationName
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Update failed.");
      return;
    }

    await loadReservations();
    alert("Reservation updated and set back to Pending.");
  } catch (error) {
    console.error(error);
    alert("Unable to update reservation. Please check your API connection.");
  }
}

async function approveReservation(id) {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Admin access only.");
    return;
  }

  try {
    const response = await fetch(`/api/reservations/${id}/approve`, {
      method: "PUT",
      headers: authHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Approval failed.");
      return;
    }

    await loadReservations();
    alert("Reservation approved.");
  } catch (error) {
    console.error(error);
    alert("Unable to approve reservation. Please check your API connection.");
  }
}

function clearReservationForm() {
  document.getElementById("venue").value = "";
  document.getElementById("eventName").value = "";
  document.getElementById("date").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("organizationName").value = "";
}

updateNavigation();

if (currentUser) {
  loadReservations();
  showTab("homeTab");
} else {
  renderReservations();
  showTab("loginTab");
}
