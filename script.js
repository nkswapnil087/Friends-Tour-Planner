// Global variables
let trips = [];
let currentTripId = null;
let currentStep = 1;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTrips();
    renderTripsList();

    // Set today's date as default for expense date
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('expenseDate')) {
        document.getElementById('expenseDate').value = today;
    }

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
    event.stopPropagation();

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

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;

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

// Room Randomization - FIXED for all edge cases
function randomizeRooms() {
    const trip = trips.find(t => t.id === currentTripId);
    const numRooms = parseInt(document.getElementById('numRooms').value);
    const maxPerRoom = parseInt(document.getElementById('maxPerRoom').value);

    if (!numRooms || !maxPerRoom) {
        alert('Please enter number of rooms and max people per room!');
        return;
    }

    const totalCapacity = numRooms * maxPerRoom;
    const totalPeople = trip.companions.length;

    // Check if there's enough capacity
    if (totalCapacity < totalPeople) {
        alert(`Not enough capacity! You need at least ${Math.ceil(totalPeople / maxPerRoom)} rooms with ${maxPerRoom} people each to accommodate ${totalPeople} people.`);
        return;
    }

    const shuffled = [...trip.companions].sort(() => Math.random() - 0.5);
    const rooms = Array(numRooms).fill(null).map(() => []);

    // Distribute people round-robin to ensure all are assigned
    shuffled.forEach((person, idx) => {
        const roomIdx = idx % numRooms;
        rooms[roomIdx].push(person);
    });

    // Only keep non-empty rooms
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

    const totalAssigned = trip.roomAssignments.reduce((sum, room) => sum + room.length, 0);
    const totalPeople = trip.companions.length;

    let html = trip.roomAssignments.map((room, idx) => `
        <div class="room">
            <strong>Room ${idx + 1} (${room.length} people):</strong> ${room.join(', ')}
        </div>
    `).join('');

    // Show warning if someone is left out (shouldn't happen with fixed algorithm)
    if (totalAssigned < totalPeople) {
        html += `<div class="warning-message">⚠️ Warning: ${totalPeople - totalAssigned} people not assigned! Increase room capacity.</div>`;
    }

    container.innerHTML = html;
}

// Expenses - NEW SYSTEM: Individual tracking with dates
function addExpense() {
    const trip = trips.find(t => t.id === currentTripId);
    const date = document.getElementById('expenseDate').value;
    const tag = document.getElementById('expenseTag').value;
    const member = document.getElementById('expenseMember').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    if (!date) {
        alert('Please select a date!');
        return;
    }

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount!');
        return;
    }

    trip.expenses.push({ date, tag, member, amount });
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
    const container = document.getElementById('expensesByPerson');

    if (trip.expenses.length === 0) {
        container.innerHTML = '<p style="color: #666;">No expenses added yet!</p>';
        return;
    }

    // Group expenses by person
    const expensesByPerson = {};
    trip.companions.forEach(name => expensesByPerson[name] = []);

    trip.expenses.forEach((exp, idx) => {
        expensesByPerson[exp.member].push({ ...exp, index: idx });
    });

    // Render each person's expenses
    container.innerHTML = trip.companions.map(name => {
        const personExpenses = expensesByPerson[name];
        const total = personExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        if (personExpenses.length === 0) {
            return `
                <div class="person-expenses">
                    <h4>${name}</h4>
                    <p style="color: #666;">No expenses yet</p>
                </div>
            `;
        }

        // Sort by date (newest first)
        personExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="person-expenses">
                <h4>${name}</h4>
                ${personExpenses.map(exp => `
                    <div class="expense-record">
                        <span class="date">${exp.date}</span>
                        <span class="tag">${exp.tag}</span>
                        <span class="amount">${exp.amount} BDT</span>
                        <button class="delete-expense" onclick="deleteExpense(${exp.index})">✕</button>
                    </div>
                `).join('')}
                <div class="expense-total">Total: ${total} BDT</div>
            </div>
        `;
    }).join('');
}
