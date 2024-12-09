// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

// Check user authentication and role
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        userDoc.data().role === 'admin' ? await loadAdminDashboard() : await loadUserDashboard(user.uid);
      } else {
        logoutUser();
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      alert('An error occurred while fetching your role. Please try again.');
      logoutUser();
    }
  } else {
    window.location.href = 'login.html';
  }
});

// Load Admin Dashboard Data
async function loadAdminDashboard() {
  try {
    await Promise.all([
      fetchOverviewData(),
      renderBloodStockChart(),
      loadRecentRequests(),
      renderBloodStockPieChart()
    ]);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
  }
}

// Fetch Overview Data for Admin Cards
async function fetchOverviewData() {
  try {
    const [totalDonorsSnapshot, bloodStockSnapshot, registeredUsersSnapshot, bloodRequestsSnapshot] = await Promise.all([
      db.collection('donors').get(),
      db.collection('blood_stock').get(),
      db.collection('users').get(),
      db.collection('blood_requests').get()
    ]);

    document.getElementById('total-donors').innerText = totalDonorsSnapshot.size;
    
    const totalStock = bloodStockSnapshot.docs.reduce((acc, doc) => acc + doc.data().units, 0);
    document.getElementById('blood-stock').innerText = totalStock;

    document.getElementById('registered-users').innerText = registeredUsersSnapshot.size;
    document.getElementById('blood-requests').innerText = bloodRequestsSnapshot.size;
  } catch (error) {
    console.error('Error fetching overview data:', error);
  }
}

// Render Blood Stock Chart for Admin
async function renderBloodStockChart() {
  try {
    const snapshot = await db.collection('blood_stock').get();
    const bloodGroups = snapshot.docs.map(doc => doc.id);
    const units = snapshot.docs.map(doc => doc.data().units);

    const ctx = document.getElementById('bloodStockChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bloodGroups,
        datasets: [{
          label: 'Units Available',
          data: units,
          backgroundColor: 'rgba(220,53,69,0.6)',
          borderColor: 'rgba(220,53,69,1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  } catch (error) {
    console.error('Error rendering blood stock chart:', error);
  }
}

// Load Recent Blood Requests for Admin
async function loadRecentRequests() {
  try {
    const snapshot = await db.collection('blood_requests').orderBy('timestamp', 'desc').limit(5).get();
    const tableBody = document.querySelector('#requests-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    for (const doc of snapshot.docs) {
      const request = doc.data();
      const userDoc = await db.collection('users').doc(request.user).get();
      const userEmail = userDoc.exists ? userDoc.data().email : 'Unknown';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${userEmail}</td>
        <td>${request.blood_group}</td>
        <td>${request.units}</td>
        <td>${request.status}</td>
        <td>
          ${request.status === 'Pending'
            ? `
            <button class="btn btn-sm btn-success me-2" onclick="updateRequestStatus('${doc.id}', 'Accepted')">Accept</button>
            <button class="btn btn-sm btn-danger" onclick="updateRequestStatus('${doc.id}', 'Rejected')">Reject</button>
          `
            : '—'}
        </td>
      `;
      tableBody.appendChild(row);
    }
  } catch (error) {
    console.error('Error loading recent requests:', error);
  }
}

// Update Request Status for Admin
async function updateRequestStatus(requestId, status) {
  try {
    await db.collection('blood_requests').doc(requestId).update({ status });
    alert(`Request ${status}`);
    await loadRecentRequests(); // Refresh the table
    await fetchOverviewData(); // Update overview cards
  } catch (error) {
    console.error('Error updating request:', error);
  }
}

// Load User Dashboard Data
async function loadUserDashboard(userId) {
  try {
    await Promise.all([
      fetchUserOverview(userId),
      renderUserRequestsChart(userId),
      loadAvailableDonors()
    ]);
  } catch (error) {
    console.error('Error loading user dashboard:', error);
  }
}

// Fetch Overview Data for User
async function fetchUserOverview(userId) {
  try {
    const [totalDonorsSnapshot, bloodStockSnapshot, userContributionsSnapshot, userRequestsSnapshot] = await Promise.all([
      db.collection('donors').get(),
      db.collection('blood_stock').get(),
      db.collection('donations').where('donor_id', '==', userId).get(),
      db.collection('blood_requests').where('user', '==', userId).get()
    ]);

    document.getElementById('total-donors').innerText = totalDonorsSnapshot.size;

    const totalStock = bloodStockSnapshot.docs.reduce((acc, doc) => acc + doc.data().units, 0);
    document.getElementById('blood-stock').innerText = totalStock;

    document.getElementById('your-contributions').innerText = userContributionsSnapshot.size;
    document.getElementById('user-requests').innerText = userRequestsSnapshot.size;
  } catch (error) {
    console.error('Error fetching user overview:', error);
  }
}

// Render User Requests Chart
async function renderUserRequestsChart(userId) {
  try {
    const snapshot = await db.collection('blood_requests').where('user', '==', userId).get();
    const requestStatuses = { Accepted: 0, Rejected: 0, Pending: 0 };

    snapshot.forEach((doc) => {
      const status = doc.data().status;
      if (requestStatuses[status] !== undefined) {
        requestStatuses[status]++;
      }
    });

    const ctx = document.getElementById('userRequestsChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Accepted', 'Rejected', 'Pending'],
        datasets: [{
          data: Object.values(requestStatuses),
          backgroundColor: [
            'rgba(40,167,69,0.6)',
            'rgba(220,53,69,0.6)',
            'rgba(255,193,7,0.6)',
          ],
          borderColor: [
            'rgba(40,167,69,1)',
            'rgba(220,53,69,1)',
            'rgba(255,193,7,1)',
          ],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
      },
    });
  } catch (error) {
    console.error('Error rendering user requests chart:', error);
  }
}

// Load Available Donors for User
async function loadAvailableDonors() {
  try {
    const snapshot = await db.collection('donors').get();
    const tableBody = document.querySelector('#donors-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    snapshot.forEach((doc) => {
      const donor = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${donor.name}</td>
        <td>${donor.blood_group}</td>
        <td>${donor.contact}</td>
        <td>${donor.available ? 'Yes' : 'No'}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading available donors:', error);
  }
}

// Logout Function
function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch((error) => {
      console.error('Logout error:', error);
      alert('An error occurred during logout. Please try again.');
    });
}
