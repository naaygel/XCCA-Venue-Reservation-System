const DEFAULT_ADMIN = {
  name: "Administrator",
  username: "admin",
  password: "admin123",
  role: "admin"
};

let users = JSON.parse(localStorage.getItem("users"));

if (!Array.isArray(users)) {
  users = [DEFAULT_ADMIN];
} else {
  const adminExists = users.some(user => user.username === DEFAULT_ADMIN.username);

  if (!adminExists) {
    users.push(DEFAULT_ADMIN);
  }
}

localStorage.setItem("users", JSON.stringify(users));

let reservations = JSON.parse(localStorage.getItem("reservations"));

if (!Array.isArray(reservations)) {
  reservations = [];
}

let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function saveReservations() {
  localStorage.setItem("reservations", JSON.stringify(reservations));
}

function saveCurrentUser() {
  if (currentUser) {
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
  } else {
    sessionStorage.removeItem("currentUser");
  }
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

function register() {
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

  const usernameExists = users.some(user => user.username === username);

  if (usernameExists) {
    alert("Username already exists.");
    return;
  }

  users.push({
    name,
    username,
    password,
    userId,
    role: "user"
  });

  saveUsers();

  alert("Account created successfully! Please login.");

  document.getElementById("name").value = "";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("userId").value = "";

  showTab("loginTab");
}

function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const user = users.find(user =>
    user.username === username &&
    user.password === password
  );

  if (!user) {
    alert("Invalid username or password.");
    return;
  }

  currentUser = user;
  saveCurrentUser();
  updateNavigation();
  loadReservations();

  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";

  alert(currentUser.role === "admin" ? "Admin login successful." : "User login successful.");
  showTab("homeTab");
}

function logout() {
  window.location.href = "/.auth/logout";
}

function addReservation() {
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

  const conflict = reservations.find(reservation =>
    reservation.venue === venue &&
    reservation.date === date &&
    (
      reservation.status === "Pending" ||
      reservation.status === "Approved"
    ) &&
    startTime < reservation.endTime &&
    endTime > reservation.startTime
  );

  if (conflict) {
    alert("Conflict detected. This venue is already reserved during that time range.");
    return;
  }

  reservations.push({
    username: currentUser.username,
    name: currentUser.name,
    eventName,
    venue,
    date,
    startTime,
    endTime,
    organizationName,
    status: "Pending"
  });

  saveReservations();
  loadReservations();

  alert("Reservation submitted and is pending approval.");

  document.getElementById("venue").value = "";
  document.getElementById("eventName").value = "";
  document.getElementById("date").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("organizationName").value = "";
}

function loadReservations() {
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

  reservations.forEach((reservation, index) => {
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

    if (reservation.username === currentUser.username) {
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
            <button onclick="editReservation(${index})">Edit</button>
            <button class="delete-btn" onclick="deleteReservation(${index})">
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
            <button class="approve-btn" onclick="approveReservation(${index})">
              Approve
            </button>
            <button class="delete-btn" onclick="deleteReservation(${index})">
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
        <td colspan="7">No reservations created yet.</td>
      </tr>
    `;
  }

  if (allTable.innerHTML === "") {
    allTable.innerHTML = `
      <tr>
        <td colspan="7">No reservations available yet.</td>
      </tr>
    `;
  }

  if (currentUser.role === "admin" && adminTable.innerHTML === "") {
    adminTable.innerHTML = `
      <tr>
        <td colspan="8">No reservations available yet.</td>
      </tr>
    `;
  }
}

function deleteReservation(index) {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const reservation = reservations[index];

  if (
    currentUser.role !== "admin" &&
    reservation.username !== currentUser.username
  ) {
    alert("You can only delete your own reservation.");
    return;
  }

  if (!confirm("Are you sure you want to delete this reservation?")) {
    return;
  }

  reservations.splice(index, 1);
  saveReservations();
  loadReservations();

  alert("Reservation deleted.");
}

function editReservation(index) {
  const reservation = reservations[index];

  if (!currentUser || reservation.username !== currentUser.username) {
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

  const conflict = reservations.find((r, i) =>
    i !== index &&
    r.venue === newVenue &&
    r.date === newDate &&
    (
      r.status === "Pending" ||
      r.status === "Approved"
    ) &&
    newStartTime < r.endTime &&
    newEndTime > r.startTime
  );

  if (conflict) {
    alert("Conflict detected. This venue is already reserved during that time range.");
    return;
  }

  reservations[index].eventName = newEventName;
  reservations[index].venue = newVenue;
  reservations[index].date = newDate;
  reservations[index].startTime = newStartTime;
  reservations[index].endTime = newEndTime;
  reservations[index].organizationName = newOrganizationName;
  reservations[index].status = "Pending";

  saveReservations();
  loadReservations();

  alert("Reservation updated and set back to Pending.");
}

function approveReservation(index) {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Admin access only.");
    return;
  }

  reservations[index].status = "Approved";

  saveReservations();
  loadReservations();

  alert("Reservation approved.");
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
loadReservations();

if (currentUser) {
  showTab("homeTab");
} else {
  showTab("loginTab");
}
