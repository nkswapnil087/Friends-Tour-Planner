// Global variables
let trips = [];
let currentTripId = null;
let currentStep = 1;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTrips();
    renderTripsList();

    document.getElementById('addTripBtn').addEventListener('click', () => {
        showScreen('newTripScreen');
        resetNewTripForm();
    });
});

// Local Storage functions
function loadTrips() {
    const stored = localStorage.getItem('trips');
    trips = stored ? JSON.parse(stored) : [];
}

function saveTrips() {
    localStorage.setItem('trips', JSON.stringify(trips));
}

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showHome() {
    showScreen('homeScreen');
    renderTripsList();
}

// Render trips list
function renderTripsList() {
    const container = document.getElementById('tripsList');

    if (trips.length === 0) {
        container.innerHTML = '<div class="empty-state">No trips yet! Click the + button to create your first adventure 🌟</div>';
        return;
    }

    container.innerHTML = trips.map(trip => `
        <div class="trip-card" onclick="openTrip('${trip.id}')">
            <button class="trip-delete-btn" onclick="deleteTripFromHome('${trip.id}', event)">✕</button>
            <h3>📍 ${trip.destination}</h3>
            <p>👥 ${trip.companions.length} friends</p>
            <p>💰 ${trip.expenses.length} expenses</p>
        </div>
    `).join('');
}

// Delete trip from home screen
function deleteTripFromHome(tripId, event) {
    event.stopPropagation(); // Prevent opening the trip

    if (confirm('Delete this trip? This cannot be undone!')) {
        trips = trips.filter(t => t.id !== tripId);
        saveTrips();
        renderTripsList();
    }
}

// New Trip Flow
function resetNewTripForm() {
    currentStep = 1;
    document.getElementById('destinationInput').value = '';
    document.getElementById('friendsCountInput').value = '';
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
}

function nextStep() {
    if (currentStep === 1) {
        const destination = document.getElementById('destinationInput').value.trim();
        if (!destination) {
            alert('Please enter a destination!');
            return;
        }
        currentStep = 2;
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
    } else if (currentStep === 2) {
        const count = parseInt(document.getElementById('friendsCountInput').value);
        if (!count || count < 2) {
            alert('Please enter at least 2 people!');
            return;
        }
        currentStep = 3;
        generateNameInputs(count);
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.add('active');
    }
}

function generateNameInputs(count) {
    const container = document.getElementById('namesInputContainer');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Friend ${i + 1} name`;
        input.id = `name${i}`;
        container.appendChild(input);
    }
}

function createTrip() {
    const destination = document.getElementById('destinationInput').value.trim();
    const count = parseInt(document.getElementById('friendsCountInput').value);
    const companions = [];

    for (let i = 0; i < count; i++) {
        const name = document.getElementById(`name${i}`).value.trim();
        if (!name) {
            alert(`Please enter name for Friend ${i + 1}!`);
            return;
        }
        companions.push(name);
    }

    const trip = {
        id: Date.now().toString(),
        destination,
        companions,
        seatAssignments: [],
        roomAssignments: [],
        expenses: []
    };

    trips.push(trip);
    saveTrips();
    showHome();
}

// Open Trip Detail
function openTrip(tripId) {
    currentTripId = tripId;
    const trip = trips.find(t => t.id === tripId);

    document.getElementById('tripTitle').textContent = trip.destination;

    // Populate expense member dropdown
    const memberSelect = document.getElementById('expenseMember');
    memberSelect.innerHTML = trip.companions.map(name =>
        `<option value="${name}">${name}</option>`
    ).join('');

    showScreen('tripDetailScreen');
    showTab('seats');
    renderSeats();
    renderExpenses();
}

function deleteCurrentTrip() {
    if (confirm('Are you sure you want to delete this trip?')) {
        trips = trips.filter(t => t.id !== currentTripId);
        saveTrips();
        showHome();
    }
}

// Tabs
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');

    if (tabName === 'seats') renderSeats();
    if (tabName === 'rooms') renderRooms();
    if (tabName === 'expenses') renderExpenses();
}

// Seat Randomization
function randomizeSeats() {
    const trip = trips.find(t => t.id === currentTripId);
    const shuffled = [...trip.companions].sort(() => Math.random() - 0.5);

    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        pairs.push(shuffled.slice(i, i + 2));
    }

    trip.seatAssignments = pairs;
    saveTrips();
    renderSeats();
}

function renderSeats() {
    const trip = trips.find(t => t.id === currentTripId);
    const container = document.getElementById('seatPairs');

    if (trip.seatAssignments.length === 0) {
        container.innerHTML = '<p style="color: #666;">Click "Randomize Pairs" to assign seat partners!</p>';
        return;
    }

    container.innerHTML = trip.seatAssignments.map((pair, idx) => `
        <div class="pair">
            <strong>Pair ${idx + 1}:</strong> ${pair.join(' & ')}
        </div>
    `).join('');
}

// Room Randomization
function randomizeRooms() {
    const trip = trips.find(t => t.id === currentTripId);
    const numRooms = parseInt(document.getElementById('numRooms').value);
    const maxPerRoom = parseInt(document.getElementById('maxPerRoom').value);

    if (!numRooms || !maxPerRoom) {
        alert('Please enter number of rooms and max people per room!');
        return;
    }

    const shuffled = [...trip.companions].sort(() => Math.random() - 0.5);
    const rooms = Array(numRooms).fill(null).map(() => []);

    shuffled.forEach((person, idx) => {
        const roomIdx = idx % numRooms;
        if (rooms[roomIdx].length < maxPerRoom) {
            rooms[roomIdx].push(person);
        }
    });

    trip.roomAssignments = rooms.filter(room => room.length > 0);
    saveTrips();
    renderRooms();
}

function renderRooms() {
    const trip = trips.find(t => t.id === currentTripId);
    const container = document.getElementById('roomGroups');

    if (trip.roomAssignments.length === 0) {
        container.innerHTML = '<p style="color: #666;">Enter room details and click "Randomize Rooms"!</p>';
        return;
    }

    container.innerHTML = trip.roomAssignments.map((room, idx) => `
        <div class="room">
            <strong>Room ${idx + 1} (${room.length} people):</strong> ${room.join(', ')}
        </div>
    `).join('');
}

// Expenses
function addExpense() {
    const trip = trips.find(t => t.id === currentTripId);
    const tag = document.getElementById('expenseTag').value;
    const member = document.getElementById('expenseMember').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount!');
        return;
    }

    trip.expenses.push({ tag, member, amount });
    saveTrips();

    document.getElementById('expenseAmount').value = '';
    renderExpenses();
}

function deleteExpense(index) {
    const trip = trips.find(t => t.id === currentTripId);
    trip.expenses.splice(index, 1);
    saveTrips();
    renderExpenses();
}

function renderExpenses() {
    const trip = trips.find(t => t.id === currentTripId);

    // Render expenses list
    const expensesList = document.getElementById('expensesList');
    if (trip.expenses.length === 0) {
        expensesList.innerHTML = '<p style="color: #666;">No expenses added yet!</p>';
    } else {
        expensesList.innerHTML = trip.expenses.map((exp, idx) => `
            <div class="expense-item">
                <div>
                    <span class="tag">${exp.tag}</span>
                    <strong>${exp.member}</strong> paid <strong>${exp.amount} BDT</strong>
                </div>
                <button class="delete-expense" onclick="deleteExpense(${idx})">✕</button>
            </div>
        `).join('');
    }

    // Calculate totals per person
    const totals = {};
    trip.companions.forEach(name => totals[name] = 0);
    trip.expenses.forEach(exp => totals[exp.member] += exp.amount);

    const totalExpenses = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgPerPerson = totalExpenses / trip.companions.length;

    const totalsContainer = document.getElementById('totalPerPerson');
    totalsContainer.innerHTML = trip.companions.map(name => {
        const balance = totals[name] - avgPerPerson;
        const balanceClass = balance > 0 ? 'positive' : balance < 0 ? 'negative' : '';
        const balanceText = balance > 0
            ? `Should receive ${balance.toFixed(0)} BDT`
            : balance < 0
                ? `Should pay ${Math.abs(balance).toFixed(0)} BDT`
                : `All settled!`;

        return `
            <div class="total-item ${balanceClass}">
                <span><strong>${name}</strong> - Paid: ${totals[name]} BDT</span>
                <span>${balanceText}</span>
            </div>
        `;
    }).join('');
}
