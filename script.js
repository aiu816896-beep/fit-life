// State Management
let appState = {
    waterIntake: 0,
    steps: 0,
    streak: 0,
    lastWorkoutDate: null,
    measurements: [],
    challenges: {
        abs: 0,
        steps: 0,
        fatloss: 0
    },
    badges: [],
    timerInterval: null,
    timerState: null
};

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('fitnessAppData');
    if (saved) {
        appState = { ...appState, ...JSON.parse(saved) };
        updateUI();
    }
    checkStreak();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('fitnessAppData', JSON.stringify(appState));
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeNavigation();
    initializeBadges();
    getNewQuote();
    updateStreakDisplay();
});

// Navigation
function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageName}-page`).classList.add('active');
}

// Water Tracker
function addWater(amount) {
    appState.waterIntake += amount;
    if (appState.waterIntake > 2000) appState.waterIntake = 2000;
    
    updateWaterDisplay();
    saveData();
    checkBadges();
}

function resetWater() {
    appState.waterIntake = 0;
    updateWaterDisplay();
    saveData();
}

function updateWaterDisplay() {
    const percentage = (appState.waterIntake / 2000) * 100;
    document.getElementById('water-level').style.height = percentage + '%';
    document.getElementById('water-text').textContent = `${appState.waterIntake}ml / 2000ml`;
}

// Steps Counter
function addSteps() {
    const input = document.getElementById('steps-input');
    const steps = parseInt(input.value) || 0;
    
    appState.steps += steps;
    if (appState.steps > 10000) appState.steps = 10000;
    
    updateStepsDisplay();
    input.value = '';
    saveData();
    checkBadges();
}

function updateStepsDisplay() {
    document.getElementById('steps-count').textContent = appState.steps.toLocaleString();
    
    const percentage = (appState.steps / 10000);
    const circumference = 2 * Math.PI * 65;
    const offset = circumference - (percentage * circumference);
    
    document.getElementById('steps-circle').style.strokeDashoffset = offset;
}

// Calorie Calculator
const calorieRates = {
    running: 11,
    cycling: 8,
    swimming: 10,
    walking: 4,
    yoga: 3,
    hiit: 12,
    strength: 6
};

function calculateCalories() {
    const workoutType = document.getElementById('workout-type').value;
    const duration = parseInt(document.getElementById('duration').value) || 0;
    
    if (!workoutType || !duration) {
        alert('Please select workout and duration');
        return;
    }
    
    const calories = calorieRates[workoutType] * duration;
    const resultDiv = document.getElementById('calorie-result');
    resultDiv.textContent = `🔥 You burned ${calories} calories!`;
    resultDiv.classList.add('show');
    
    setTimeout(() => resultDiv.classList.remove('show'), 5000);
}

// HIIT Timer
function startTimer() {
    const workTime = parseInt(document.getElementById('work-time').value) || 20;
    const restTime = parseInt(document.getElementById('rest-time').value) || 10;
    const rounds = parseInt(document.getElementById('rounds').value) || 8;
    
    if (appState.timerInterval) {
        stopTimer();
    }
    
    appState.timerState = {
        workTime,
        restTime,
        rounds,
        currentRound: 1,
        isWork: true,
        timeLeft: workTime
    };
    
    runTimer();
}

function runTimer() {
    appState.timerInterval = setInterval(() => {
        const state = appState.timerState;
        
        if (state.timeLeft > 0) {
            state.timeLeft--;
            updateTimerDisplay();
        } else {
            // Switch between work and rest
            if (state.isWork) {
                state.isWork = false;
                state.timeLeft = state.restTime;
                playSound();
            } else {
                state.isWork = true;
                state.currentRound++;
                
                if (state.currentRound > state.rounds) {
                    stopTimer();
                    alert('🎉 Workout Complete!');
                    updateStreak();
                    return;
                }
                
                state.timeLeft = state.workTime;
                playSound();
            }
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
        appState.timerInterval = null;
        appState.timerState = null;
        document.getElementById('timer-text').textContent = '00:00';
        document.getElementById('timer-status').textContent = 'Ready';
    }
}

function updateTimerDisplay() {
    const state = appState.timerState;
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    
    document.getElementById('timer-text').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('timer-status').textContent = 
        state.isWork ? `Work - Round ${state.currentRound}/${state.rounds}` : 'Rest';
}

function playSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Badges System
const badgeDefinitions = [
    { id: 'first-workout', icon: '🎯', name: 'First Step', desc: 'Complete your first workout', condition: () => appState.streak >= 1 },
    { id: 'week-warrior', icon: '🏆', name: 'Week Warrior', desc: '7 days streak', condition: () => appState.streak >= 7 },
    { id: 'consistency-master', icon: '🔥', name: 'Consistency Master', desc: '30 days streak', condition: () => appState.streak >= 30 },
    { id: 'hydration-hero', icon: '💧', name: 'Hydration Hero', desc: 'Drink 2L water', condition: () => appState.waterIntake >= 2000 },
    { id: 'step-champion', icon: '👟', name: 'Step Champion', desc: '10K steps in a day', condition: () => appState.steps >= 10000 },
    { id: 'workout-king', icon: '👑', name: 'Workout King', desc: 'Complete 50 workouts', condition: () => appState.streak >= 50 }
];

function initializeBadges() {
    const badgesGrid = document.getElementById('badges-grid');
    badgesGrid.innerHTML = '';
    
    badgeDefinitions.forEach(badge => {
        const isUnlocked = badge.condition();
        const badgeEl = document.createElement('div');
        badgeEl.className = `badge ${isUnlocked ? 'unlocked' : ''}`;
        badgeEl.innerHTML = `
            <i>${badge.icon}</i>
            <h4>${badge.name}</h4>
            <p>${badge.desc}</p>
        `;
        badgesGrid.appendChild(badgeEl);
    });
}

function checkBadges() {
    initializeBadges();
}

// Streak System
function updateStreak() {
    const today = new Date().toDateString();
    const lastDate = appState.lastWorkoutDate;
    
    if (lastDate !== today) {
        appState.streak++;
        appState.lastWorkoutDate = today;
        updateStreakDisplay();
        saveData();
        checkBadges();
    }
}

function checkStreak() {
    const today = new Date();
    const lastDate = appState.lastWorkoutDate ? new Date(appState.lastWorkoutDate) : null;
    
    if (lastDate) {
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            appState.streak = 0;
            saveData();
        }
    }
}

function updateStreakDisplay() {
    document.getElementById('streak-count').textContent = appState.streak;
}

// Motivation Quotes
const quotes = [
    "The only bad workout is the one that didn't happen.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Success starts with self-discipline.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Don't wish for it, work for it.",
    "Strive for progress, not perfection.",
    "Wake up with determination. Go to bed with satisfaction.",
    "You don't have to be extreme, just consistent."
];

function getNewQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('motivation-quote').textContent = randomQuote;
}

// Workout Categories
const workoutData = {
    cardio: [
        { name: 'Running', duration: '30 min', desc: 'Improves cardiovascular health' },
        { name: 'Cycling', duration: '45 min', desc: 'Low impact cardio workout' },
        { name: 'Jump Rope', duration: '15 min', desc: 'High intensity cardio' },
        { name: 'Swimming', duration: '30 min', desc: 'Full body cardio workout' }
    ],
    strength: [
        { name: 'Push-ups', duration: '3 sets of 15', desc: 'Upper body strength' },
        { name: 'Squats', duration: '3 sets of 20', desc: 'Lower body strength' },
        { name: 'Deadlifts', duration: '3 sets of 10', desc: 'Full body strength' },
        { name: 'Bench Press', duration: '3 sets of 12', desc: 'Chest and arms' }
    ],
    yoga: [
        { name: 'Surya Namaskar', duration: '10 rounds', desc: 'Sun salutation sequence' },
        { name: 'Hatha Yoga', duration: '45 min', desc: 'Basic yoga postures' },
        { name: 'Vinyasa Flow', duration: '30 min', desc: 'Dynamic yoga practice' },
        { name: 'Restorative Yoga', duration: '60 min', desc: 'Relaxation and recovery' }
    ],
    hiit: [
        { name: 'Burpees', duration: '4 rounds of 30s', desc: 'Full body explosive movement' },
        { name: 'Mountain Climbers', duration: '4 rounds of 30s', desc: 'Core and cardio' },
        { name: 'Tabata Training', duration: '20 min', desc: '20s work, 10s rest' },
        { name: 'Sprint Intervals', duration: '15 min', desc: 'High intensity sprints' }
    ],
    stretching: [
        { name: 'Hamstring Stretch', duration: '2 min each leg', desc: 'Improves flexibility' },
        { name: 'Quad Stretch', duration: '2 min each leg', desc: 'Stretches front thigh' },
        { name: 'Shoulder Stretch', duration: '3 min', desc: 'Releases shoulder tension' },
        { name: 'Full Body Stretch', duration: '15 min', desc: 'Complete stretching routine' }
    ],
    home: [
        { name: 'Bodyweight Circuit', duration: '30 min', desc: 'No equipment needed' },
        { name: 'Core Workout', duration: '20 min', desc: 'Abs and core exercises' },
        { name: 'Leg Workout', duration: '25 min', desc: 'Lower body exercises' },
        { name: 'Upper Body', duration: '25 min', desc: 'Arms, chest, back' }
    ]
};

function showWorkouts(category) {
    const modal = document.getElementById('workout-modal');
    const title = document.getElementById('modal-title');
    const list = document.getElementById('workout-list');
    
    title.textContent = category.charAt(0).toUpperCase() + category.slice(1) + ' Workouts';
    
    list.innerHTML = '';
    workoutData[category].forEach(workout => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.innerHTML = `
            <h4>${workout.name}</h4>
            <p><strong>Duration:</strong> ${workout.duration}</p>
            <p>${workout.desc}</p>
        `;
        list.appendChild(item);
    });
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('workout-modal').style.display = 'none';
}

// Workout Plan Generator
const workoutPlans = {
    'weight-loss': {
        beginner: [
            { day: 'Monday', workout: ['20 min walk', '10 min stretching'] },
            { day: 'Tuesday', workout: ['Light cardio', '15 min yoga'] },
            { day: 'Wednesday', workout: ['Rest or light walk'] },
            { day: 'Thursday', workout: ['20 min cardio', 'Core exercises'] },
            { day: 'Friday', workout: ['Full body workout', '10 min stretching'] },
            { day: 'Saturday', workout: ['30 min walk', 'Light yoga'] },
            { day: 'Sunday', workout: ['Active rest'] }
        ],
        intermediate: [
            { day: 'Monday', workout: ['30 min running', 'Core workout'] },
            { day: 'Tuesday', workout: ['HIIT - 20 min', 'Stretching'] },
            { day: 'Wednesday', workout: ['Strength training', 'Cardio - 15 min'] },
            { day: 'Thursday', workout: ['40 min cycling', 'Abs workout'] },
            { day: 'Friday', workout: ['Full body HIIT', 'Yoga'] },
            { day: 'Saturday', workout: ['Long run - 45 min', 'Stretching'] },
            { day: 'Sunday', workout: ['Active recovery - yoga'] }
        ],
        advanced: [
            { day: 'Monday', workout: ['Interval running - 45 min', 'Core circuit'] },
            { day: 'Tuesday', workout: ['HIIT - 30 min', 'Strength training'] },
            { day: 'Wednesday', workout: ['Full body workout', 'Cardio finisher'] },
            { day: 'Thursday', workout: ['Sprint intervals', 'Abs & core'] },
            { day: 'Friday', workout: ['Strength & conditioning', 'HIIT'] },
            { day: 'Saturday', workout: ['Long cardio session - 60 min'] },
            { day: 'Sunday', workout: ['Active recovery & mobility'] }
        ]
    },
    'muscle-gain': {
        beginner: [
            { day: 'Monday', workout: ['Upper body basics', 'Light cardio'] },
            { day: 'Tuesday', workout: ['Lower body basics', 'Stretching'] },
            { day: 'Wednesday', workout: ['Rest'] },
            { day: 'Thursday', workout: ['Full body workout', 'Core'] },
            { day: 'Friday', workout: ['Upper body', 'Yoga'] },
            { day: 'Saturday', workout: ['Lower body', 'Light cardio'] },
            { day: 'Sunday', workout: ['Rest'] }
        ],
        intermediate: [
            { day: 'Monday', workout: ['Chest & Triceps', 'Abs'] },
            { day: 'Tuesday', workout: ['Back & Biceps', 'Cardio - 15 min'] },
            { day: 'Wednesday', workout: ['Legs & Shoulders', 'Core'] },
            { day: 'Thursday', workout: ['Upper body hypertrophy'] },
            { day: 'Friday', workout: ['Lower body strength', 'Abs'] },
            { day: 'Saturday', workout: ['Full body workout', 'Cardio'] },
            { day: 'Sunday', workout: ['Rest & recovery'] }
        ],
        advanced: [
            { day: 'Monday', workout: ['Chest & Triceps heavy', 'Cable work'] },
            { day: 'Tuesday', workout: ['Back & Biceps volume', 'Core circuit'] },
            { day: 'Wednesday', workout: ['Legs - squats & deadlifts', 'Abs'] },
            { day: 'Thursday', workout: ['Shoulders & arms', 'Light cardio'] },
            { day: 'Friday', workout: ['Power training - full body'] },
            { day: 'Saturday', workout: ['Hypertrophy - weak points', 'Cardio'] },
            { day: 'Sunday', workout: ['Active recovery'] }
        ]
    },
    'general-fitness': {
        beginner: [
            { day: 'Monday', workout: ['Full body workout - 20 min'] },
            { day: 'Tuesday', workout: ['Cardio - 20 min', 'Stretching'] },
            { day: 'Wednesday', workout: ['Yoga - 30 min'] },
            { day: 'Thursday', workout: ['Light strength training'] },
            { day: 'Friday', workout: ['Cardio & core - 30 min'] },
            { day: 'Saturday', workout: ['Active fun activity'] },
            { day: 'Sunday', workout: ['Rest'] }
        ],
        intermediate: [
            { day: 'Monday', workout: ['Full body strength', 'Cardio - 15 min'] },
            { day: 'Tuesday', workout: ['HIIT - 25 min', 'Yoga'] },
            { day: 'Wednesday', workout: ['Upper body & core'] },
            { day: 'Thursday', workout: ['Cardio - 30 min', 'Stretching'] },
            { day: 'Friday', workout: ['Lower body & abs'] },
            { day: 'Saturday', workout: ['Mixed workout - 45 min'] },
            { day: 'Sunday', workout: ['Active recovery'] }
        ],
        advanced: [
            { day: 'Monday', workout: ['Strength training - full body'] },
            { day: 'Tuesday', workout: ['HIIT & conditioning - 40 min'] },
            { day: 'Wednesday', workout: ['Sport specific training'] },
            { day: 'Thursday', workout: ['Cardio intervals - 35 min'] },
            { day: 'Friday', workout: ['Functional fitness workout'] },
            { day: 'Saturday', workout: ['Endurance training - 60 min'] },
            { day: 'Sunday', workout: ['Yoga & mobility'] }
        ]
    }
};

function generatePlan() {
    const goal = document.getElementById('fitness-goal').value;
    const level = document.getElementById('fitness-level').value;
    
    if (!goal || !level) {
        alert('Please select both goal and level');
        return;
    }
    
    const plan = workoutPlans[goal][level];
    const planDiv = document.getElementById('generated-plan');
    
    planDiv.innerHTML = '<h3>Your 7-Day Workout Plan</h3>';
    plan.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'plan-day';
        dayDiv.innerHTML = `
            <h4>${day.day}</h4>
            <ul>
                ${day.workout.map(w => `<li>${w}</li>`).join('')}
            </ul>
        `;
        planDiv.appendChild(dayDiv);
    });
    
    planDiv.classList.add('show');
}

// Body Measurements
function saveMeasurements() {
    const weight = document.getElementById('weight').value;
    const chest = document.getElementById('chest').value;
    const waist = document.getElementById('waist').value;
    const arms = document.getElementById('arms').value;
    const bodyfat = document.getElementById('bodyfat').value;
    
    if (!weight) {
        alert('Please enter at least weight');
        return;
    }
    
    const measurement = {
        date: new Date().toLocaleDateString(),
        weight: parseFloat(weight) || 0,
        chest: parseFloat(chest) || 0,
        waist: parseFloat(waist) || 0,
        arms: parseFloat(arms) || 0,
        bodyfat: parseFloat(bodyfat) || 0
    };
    
    appState.measurements.push(measurement);
    saveData();
    displayMeasurements();
    
    // Clear inputs
    document.getElementById('weight').value = '';
    document.getElementById('chest').value = '';
    document.getElementById('waist').value = '';
    document.getElementById('arms').value = '';
    document.getElementById('bodyfat').value = '';
}

function displayMeasurements() {
    const historyDiv = document.getElementById('measurements-history');
    historyDiv.innerHTML = '<h3>Recent Measurements</h3>';
    
    appState.measurements.slice(-5).reverse().forEach(m => {
        const entry = document.createElement('div');
        entry.className = 'measurement-entry';
        entry.innerHTML = `
            <strong>${m.date}</strong><br>
            Weight: ${m.weight}kg | Chest: ${m.chest}cm | Waist: ${m.waist}cm | 
            Arms: ${m.arms}cm | Body Fat: ${m.bodyfat}%
        `;
        historyDiv.appendChild(entry);
    });
}

// Chart (Simple implementation)
function showChart(period) {
    const canvas = document.getElementById('progress-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple bar chart
    ctx.fillStyle = '#6366f1';
    ctx.font = '14px Arial';
    ctx.fillText(`${period.toUpperCase()} Progress Chart`, 20, 30);
    ctx.fillText('(Sample visualization - tracking steps)', 20, 50);
    
    // Draw bars
    const data = [2000, 4500, 7800, 6200, 8900, 9500, appState.steps];
    const barWidth = 40;
    const maxHeight = 200;
    
    data.forEach((value, index) => {
        const height = (value / 10000) * maxHeight;
        const x = 50 + (index * 60);
        const y = 280 - height;
        
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x, y, barWidth, height);
        
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(value, x, y - 5);
    });
}

// AI Personal Trainer
function askAI() {
    const input = document.getElementById('ai-input');
    const query = input.value.trim().toLowerCase();
    
    if (!query) return;
    
    const messagesDiv = document.getElementById('chat-messages');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
    userMsg.textContent = input.value;
    messagesDiv.appendChild(userMsg);
    
    // Generate AI response
    let response = '';
    
    if (query.includes('weight loss') || query.includes('fat loss')) {
        response = `Here's your 7-day weight loss plan:\n\n` +
            `DIET:
- Breakfast: Oats with fruits
- Lunch: Grilled chicken with veggies
- Dinner: Fish with salad
- Snacks: Nuts, fruits

` +
            `WORKOUT:
- Monday: 30min cardio + core
- Tuesday: HIIT 20min
- Wednesday: Strength training
- Thursday: 40min walk
- Friday: Full body workout
- Saturday: Long run
- Sunday: Yoga & rest

` +
            `Tips: Drink 2L water daily, sleep 7-8 hours, avoid junk food!`;
    } else if (query.includes('muscle') || query.includes('gain')) {
        response = `Here's your muscle gain plan:\n\n` +
            `DIET:
- High protein meals (chicken, eggs, fish)
- Complex carbs (rice, sweet potato)
- Healthy fats (nuts, avocado)
- 5-6 meals per day

` +
            `WORKOUT:
- Push day (chest, shoulders, triceps)
- Pull day (back, biceps)
- Leg day (squats, deadlifts)
- Rest & repeat

` +
            `Supplements: Protein powder, creatine (optional)`;
    } else {
        response = `I can help you with:
- Weight loss plans
- Muscle gain programs
- General fitness advice
- Workout routines
- Diet suggestions

Just ask me anything!`;
    }
    
    // Add AI message
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'message ai-message';
        aiMsg.style.whiteSpace = 'pre-line';
        aiMsg.textContent = response;
        messagesDiv.appendChild(aiMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 500);
    
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Listen for Enter key in AI input
document.addEventListener('DOMContentLoaded', () => {
    const aiInput = document.getElementById('ai-input');
    if (aiInput) {
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') askAI();
        });
    }
});

// Diet Plans
const dietPlans = {
    'high-protein': {
        name: 'High Protein Diet',
        meals: [
            { meal: 'Breakfast', items: ['3 egg whites omelet', 'Oats with protein powder', 'Banana'] },
            { meal: 'Mid-Morning', items: ['Greek yogurt', 'Almonds'] },
            { meal: 'Lunch', items: ['Grilled chicken breast', 'Brown rice', 'Broccoli'] },
            { meal: 'Evening Snack', items: ['Protein shake', 'Apple'] },
            { meal: 'Dinner', items: ['Grilled fish', 'Quinoa', 'Mixed vegetables'] },
            { meal: 'Before Bed', items: ['Cottage cheese', 'Walnuts'] }
        ]
    },
    'weight-loss': {
        name: 'Weight Loss Diet',
        meals: [
            { meal: 'Breakfast', items: ['Oats with berries', 'Green tea'] },
            { meal: 'Mid-Morning', items: ['Apple', 'Handful of nuts'] },
            { meal: 'Lunch', items: ['Grilled chicken salad', 'Olive oil dressing'] },
            { meal: 'Evening Snack', items: ['Carrot sticks', 'Hummus'] },
            { meal: 'Dinner', items: ['Grilled fish', 'Steamed vegetables'] },
            { meal: 'Before Bed', items: ['Herbal tea'] }
        ]
    },
    'vegetarian': {
        name: 'Vegetarian Diet',
        meals: [
            { meal: 'Breakfast', items: ['Vegetable poha', 'Fresh juice'] },
            { meal: 'Mid-Morning', items: ['Fruit bowl', 'Nuts'] },
            { meal: 'Lunch', items: ['Dal', 'Brown rice', 'Mixed vegetable curry', 'Salad'] },
            { meal: 'Evening Snack', items: ['Sprouts salad', 'Green tea'] },
            { meal: 'Dinner', items: ['Paneer curry', 'Roti', 'Cucumber raita'] },
            { meal: 'Before Bed', items: ['Warm milk with turmeric'] }
        ]
    },
    'budget': {
        name: 'Budget-Friendly Diet',
        meals: [
            { meal: 'Breakfast', items: ['Boiled eggs', 'Bread', 'Banana'] },
            { meal: 'Mid-Morning', items: ['Seasonal fruit'] },
            { meal: 'Lunch', items: ['Dal', 'Rice', 'Vegetable curry'] },
            { meal: 'Evening Snack', items: ['Tea', 'Biscuits'] },
            { meal: 'Dinner', items: ['Egg curry', 'Roti', 'Salad'] },
            { meal: 'Before Bed', items: ['Milk'] }
        ]
    }
};

function showDietPlan(planType) {
    const plan = dietPlans[planType];
    const displayDiv = document.getElementById('diet-plan-display');
    
    displayDiv.innerHTML = `<h2>${plan.name}</h2>`;
    
    plan.meals.forEach(mealPlan => {
        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal-plan';
        mealDiv.innerHTML = `
            <h4>${mealPlan.meal}</h4>
            <ul>
                ${mealPlan.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
        displayDiv.appendChild(mealDiv);
    });
    
    displayDiv.classList.add('show');
}

// Challenges
function markChallengeDay(challenge) {
    appState.challenges[challenge]++;
    if (appState.challenges[challenge] > 30) {
        appState.challenges[challenge] = 30;
        alert(`🎉 Congratulations! You completed the ${challenge} challenge!`);
    }
    
    updateChallengeDisplay(challenge);
    updateStreak();
    saveData();
}

function updateChallengeDisplay(challenge) {
    const progress = (appState.challenges[challenge] / 30) * 100;
    document.getElementById(`${challenge}-progress`).style.width = progress + '%';
    document.getElementById(`${challenge}-days`).textContent = 
        `${appState.challenges[challenge]} / 30 days`;
}

// Update UI on load
function updateUI() {
    updateWaterDisplay();
    updateStepsDisplay();
    updateStreakDisplay();
    displayMeasurements();
    
    // Update challenges
    Object.keys(appState.challenges).forEach(challenge => {
        updateChallengeDisplay(challenge);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('workout-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
