 // DOM elements
let welcomeBox = document.getElementById("welcomeBox");
let loginBox = document.getElementById("loginBox");
let menuBox = document.getElementById("menuBox");
let appBox = document.getElementById("appBox");
let userInput = document.getElementById("user");
let questionEl = document.getElementById("question");
let img = document.getElementById("image");
let canvas = document.getElementById("canvas");
let buttonsDiv = document.getElementById("buttons");

let user_id, image_id, mode;
let userType = null;
let leaderboardBox = document.getElementById("leaderboardBox");
let lastPage = "welcome";

const SUPABASE_URL = "https://gyeyhyecebrjcfkmdhsv.supabase.com";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXloeWVjZWJyamNma21kaHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTgxMTEsImV4cCI6MjA4ODAzNDExMX0.1LNZC7NcF7HMkMglKpmaSR9h9PaibovglvwwIxGx4WQ";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 



function selectUserType(type) {
    userType = type;
    welcomeBox.style.display = "none";
    loginBox.style.display = "block";
}


// --- Login ---
async function login() {
    if (!userInput.value) {
        alert("Please enter a username");
        return;
    }

    if (!userType) {
        alert("Please choose new or returning user first.");
        return;
    }

    const username = userInput.value.trim();

    const { data, error } = await db
        .from('users')
        .upsert({ username }, { onConflict: 'username' })
        .select()
        .single();
    

    if (error) {
        alert("Login failed: " + error.message);
        return;
    }
    
    user_id = user.id;

    loginBox.style.display = "none";
    menuBox.style.display = "block";
}
 

// --- Load mode ---
async function loadMode() {
    menuBox.style.display = "none";
    appBox.style.display = "block";

    const { data: images, error } = await db
        .rpc('get_unlabelled_image', { p_user_id: user_id });

    if (error) {
        console.error('Error loading image:', error);
        questionEl.innerText = "Something went wrong loading an image. Please try again.";
        return;
    }

    if (!images || images.length === 0) {
        questionEl.innerText = "You've labelled all available images — great work!";
        img.style.display = "none";
        buttonsDiv.style.display = "none";
        return;
    }

    const image = images[0];
    image_id = image.id;
    img.src = image.url;
    img.style.display = "block";

    questionEl.innerText = "Estimate the percentage of eelgrass cover in this image";
    buttonsDiv.style.display = "block";
}


// --- Answer label ---
async function answer(percentCover) {

    const { error } = await db
        .from('labels')
        .insert({ user_id: user_id, image_id: image_id, percent_cover: percentCover });

    if (error) {
        alert("Failed to save label: " + error.message);
        return;
    }

    loadMode(); // load next image
}

// --- Back button ---
function goBack() {
    appBox.style.display = "none";
    menuBox.style.display = "block";
}

function goBackToMenu() {
    loginBox.style.display = "none";
    welcomeBox.style.display = "block";
}

// --- Leaderboard ---

async function loadLeaderboard() {
    const { data, error } = await db
        .from('labels')
        .select('user_id, users(username)')
        .order('user_id');

    if (error) {
        console.error('Error loading leaderboard:', error);
        return;
    }

    // Count labels per user
    const counts = {};
    for (const row of data) {
        const username = row.users.username;
        counts[username] = (counts[username] || 0) + 1;
    }

    // Sort by count descending
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);

    // Render
    leaderboardBox.innerHTML = sorted
        .map(([username, count], i) => 
            `<tr>
                <td>${i + 1}</td>
                <td>${username}</td>
                <td>${count}</td>
            </tr>`)
        .join('');
}


function openLeaderboard() {
    if (welcomeBox.style.display === "block") lastPage = "welcome";
    else if (menuBox.style.display === "block") lastPage = "menu";

    welcomeBox.style.display = "none";
    menuBox.style.display = "none";
    loginBox.style.display = "none";
    appBox.style.display = "none";

    leaderboardBox.style.display = "block";
    loadLeaderboard();
}

function goBackFromLeaderboard() {
    leaderboardBox.style.display = "none";

    if (lastPage === "welcome") {
        welcomeBox.style.display = "block";
    } else {
        menuBox.style.display = "block";
    }
}


// --- Initial UI state ---
welcomeBox.style.display = "block";
loginBox.style.display = "none";
menuBox.style.display = "none";
leaderboardBox.style.display = "none"
appBox.style.display = "none";

