 // DOM elements
let loginBox = document.getElementById("loginBox");
let menuBox = document.getElementById("menu");
let appBox = document.getElementById("app");
let userInput = document.getElementById("user");
let questionEl = document.getElementById("question");
let img = document.getElementById("image");
let canvas = document.getElementById("canvas");
let buttonsDiv = document.getElementById("buttons");
let submitMaskBtn = document.getElementById("submitMask");
let brushControls = document.getElementById("brushControls");
let brushSlider = document.getElementById("brushSize");
let brushSizeDisplay = document.getElementById("brushSizeDisplay");
let eraserBtn = document.getElementById("eraserBtn");
const BACKEND_URL = "https://eelgrass-labelling-backend.onrender.com";

let user_id, image_id, mode;
let ctx = canvas.getContext("2d");
let drawing = false;
let brushSize = 10;
let eraserOn = false;

// --- Login ---
async function login() {
    if (!userInput.value) { alert("Please enter a username."); return; }
    let r = await fetch(BACKEND_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ user: userInput.value })
    });
    if (!r.ok) { alert("Login failed"); return; }
    let j = await r.json();
    user_id = j.user_id;

    loginBox.style.display = "none";
    menuBox.style.display = "block";
}

// --- Apply mode UI ---
function applyModeUI() {
    if (mode === 'label') {
        questionEl.innerText = "Does this image contain eelgrass?";
        buttonsDiv.style.display = "block";
        submitMaskBtn.style.display = "none";
        brushControls.style.display = "none";
    } else {
        questionEl.innerText = "Colour over all eelgrass in this image";
        buttonsDiv.style.display = "none";
        submitMaskBtn.style.display = "inline-block";
        brushControls.style.display = "block";
    }
}
 

// --- Load mode ---
async function loadMode() {
    menuBox.style.display = "none";
    appBox.style.display = "block";

    let r = await fetch(BACKEND_URL + "/image");
    let j = await r.json();
    console.log(r);
    console.log(j);
    image_id = j.id;

    img.src = BACKEND_URL + j.url;
    img.onload = () => { if (mode === 'color') initCanvas(); };

    applyModeUI();
}

// --- Clear canvas ---
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//--- Load Image ---

let currentImageId = null;

async function loadImage() {
    console.log("Loading new image…");

    const r = await fetch(BACKEND_URL + "/next-image");
    if (!r.ok) {
        alert("Failed to load image");
        return;
    }

    const data = await r.json();

    currentImageId = data.image_id;

    // Set image source
    const img = document.getElementById("image");
    img.src = BACKEND_URL + data.url;
    // Clear canvas (for colour mode)
    clearCanvas();

    // Ensure UI matches mode
    applyModeUI();
}



// --- Answer label ---
async function answer(ans) {
    await fetch(BACKEND_URL + "/label", {
        method: "POST",
        body: new URLSearchParams({ user_id, image_id, answer: ans })
    });
    loadMode();
}

// --- Canvas for coloring ---
function initCanvas() {
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.left = img.offsetLeft + "px";
    canvas.style.top = img.offsetTop + "px";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.onmousedown = () => drawing = true;
    canvas.onmouseup = () => drawing = false;
    canvas.onmouseleave = () => drawing = false;
    canvas.onmousemove = draw;
}

// --- Drawing function ---
function draw(e) {
    if (!drawing) return;
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    ctx.fillStyle = eraserOn ? "rgba(0,0,0,1)" : "rgba(255, 0, 0, 0.4)";
    ctx.globalCompositeOperation = eraserOn ? "destination-out" : "source-over";

    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
}

// --- Brush controls ---
brushSlider.oninput = () => {
    brushSize = parseInt(brushSlider.value);
    brushSizeDisplay.innerText = brushSize;
};

function toggleEraser() {
    eraserOn = !eraserOn;
    eraserBtn.innerText = `Eraser: ${eraserOn ? "On" : "Off"}`;
}

// --- Submit mask ---
async function submitMask() {
    let blob = await new Promise(r => canvas.toBlob(r));
    let fd = new FormData();
    fd.append("user_id", user_id);
    fd.append("image_id", image_id);
    fd.append("file", blob, "mask.png");

    await fetch(BACKEND_URL + "/mask", { method: "POST", body: fd });
    loadMode();
}

// --- Back button ---
function goBack() {
    appBox.style.display = "none";
    menuBox.style.display = "block";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    eraserOn = false;
    eraserBtn.innerText = "Eraser: Off";
    brushSize = 10;
    brushSlider.value = 10;
    brushSizeDisplay.innerText = "10";
}
