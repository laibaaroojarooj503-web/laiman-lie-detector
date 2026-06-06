// Laiba's Verified Real Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCSGc-eCwnghv06dcofWeprRjVc9FevX6E",
    authDomain: "laiman-lie-detector.firebaseapp.com",
    databaseURL: "https://laiman-lie-detector-default-rtdb.firebaseio.com",
    projectId: "laiman-lie-detector",
    storageBucket: "laiman-lie-detector.firebasestorage.app",
    messagingSenderId: "367202167732",
    appId: "1:367202167732:web:65f7c32bfda6892fb862eb"
};

// Properly Initialize Firebase for Version 8
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// DOM Elements
const bgMusic = document.getElementById("bgMusic");
const lobbyScreen = document.getElementById("lobbyScreen");
const gameScreen = document.getElementById("gameScreen");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const roomLinkSection = document.getElementById("roomLinkSection");
const joinSection = document.getElementById("joinSection");
const linkInput = document.getElementById("linkInput");
const roomCodeInput = document.getElementById("roomCodeInput");
const connectBtn = document.getElementById("connectBtn");
const copyBtn = document.getElementById("copyBtn");

const p1Display = document.getElementById("p1Display");
const p2Display = document.getElementById("p2Display");
const statusMessage = document.getElementById("statusMessage");
const questionArea = document.getElementById("questionArea");
const answerArea = document.getElementById("answerArea");
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");
const sendQuestionBtn = document.getElementById("sendQuestionBtn");
const sendAnswerBtn = document.getElementById("sendAnswerBtn");
const displayQuestion = document.getElementById("displayQuestion");
const askerName = document.getElementById("askerName");
const askerRelation = document.getElementById("askerRelation");
const waitingState = document.getElementById("waitingState");
const waitingStateText = document.getElementById("waitingStateText");
const scanningOverlay = document.getElementById("scanningOverlay");
const resultArea = document.getElementById("resultArea");
const resultBox = document.getElementById("resultBox");
const nextRoundBtn = document.getElementById("nextRoundBtn");

let roomId = "";
let myPlayerKey = ""; 
let myName = "";
let myRelation = "";
let currentTurn = "player1";

// Option B: Typing Behavior Radar Variables
let backspaceCount = 0;
let typingStartTime = 0;
let keyStrokes = 0;

function playMusic() {
    if(bgMusic) {
        bgMusic.volume = 0.2;
        bgMusic.play().catch(e => console.log("Music waiting for tap/click"));
    }
}

createBtn.addEventListener("click", () => {
    playMusic();
    myName = document.getElementById("playerName").value.trim();
    myRelation = document.getElementById("playerRelation").value.trim() || "Partner";

    if (!myName) return alert("Please enter your name first!");

    roomId = "ROOM-" + Math.floor(1000 + Math.random() * 9000);
    myPlayerKey = "player1";

    database.ref('rooms/' + roomId).set({
        player1: { name: myName, relation: myRelation },
        player2: null,
        gameState: "waiting",
        question: "",
        answer: "",
        turn: "player1",
        detectorResult: ""
    }).then(() => {
        linkInput.value = roomId;
        roomLinkSection.classList.remove("hidden");
        joinSection.classList.add("hidden");
        listenToRoom();
    }).catch(err => {
        alert("Database connection failed. Check your network!");
        console.error(err);
    });
});

joinBtn.addEventListener("click", () => {
    playMusic();
    myName = document.getElementById("playerName").value.trim();
    myRelation = document.getElementById("playerRelation").value.trim() || "Partner";
    if (!myName) return alert("Please enter your name first!");
    joinSection.classList.remove("hidden");
    roomLinkSection.classList.add("hidden");
});

connectBtn.addEventListener("click", () => {
    roomId = roomCodeInput.value.trim().toUpperCase();
    if (!roomId) return alert("Enter valid Room ID");
    myPlayerKey = "player2";

    database.ref('rooms/' + roomId).once('value', (snapshot) => {
        if (!snapshot.exists()) {
            alert("Room not found!");
        } else {
            database.ref('rooms/' + roomId + '/player2').set({ name: myName, relation: myRelation });
            database.ref('rooms/' + roomId + '/gameState').set("questioning");
            listenToRoom();
        }
    });
});

copyBtn.addEventListener("click", () => {
    linkInput.select();
    document.execCommand("copy");
    alert("Room ID Copied! Send this to Numan.");
});

function listenToRoom() {
    database.ref('rooms/' + roomId).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        lobbyScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        p1Display.innerText = data.player1 ? `${data.player1.name} (${data.player1.relation})` : "Waiting...";
        p2Display.innerText = data.player2 ? `${data.player2.name} (${data.player2.relation})` : "Waiting...";
        currentTurn = data.turn;

        if (data.gameState === "waiting") {
            statusMessage.innerText = "Waiting for partner...";
            showSubScreen(waitingState);
            waitingStateText.innerText = "Waiting for Player 2 to enter the Room ID...";
        } 
        else if (data.gameState === "questioning") {
            resultArea.classList.add("hidden");
            scanningOverlay.classList.add("hidden");
            if (currentTurn === myPlayerKey) {
                statusMessage.innerText = "Your turn to ask a question!";
                showSubScreen(questionArea);
            } else {
                statusMessage.innerText = "Waiting for partner's question...";
                showSubScreen(waitingState);
                waitingStateText.innerText = `${currentTurn === 'player1' ? data.player1.name : data.player2.name} is typing a question...`;
            }
        } 
        else if (data.gameState === "answering") {
            displayQuestion.innerText = data.question;
            let askerObj = currentTurn === "player1" ? data.player1 : data.player2;
            askerName.innerText = askerObj.name;
            askerRelation.innerText = askerObj.relation;

            if (currentTurn !== myPlayerKey) {
                statusMessage.innerText = "🚨 Answer honestly! Typing behavior radar is active.";
                showSubScreen(answerArea);
                if(keyStrokes === 0) resetTypingTracker();
            } else {
                statusMessage.innerText = "Partner is answering...";
                showSubScreen(waitingState);
                waitingStateText.innerText = "Lie detector is running analytics on their typing behavior...";
            }
        } 
        else if (data.gameState === "scanning") {
            showSubScreen(scanningOverlay);
            statusMessage.innerText = "🕵️‍♂️ SCANNING STRESS AND HESITATION LEVELS...";
        } 
        else if (data.gameState === "finished") {
            scanningOverlay.classList.add("hidden");
            showSubScreen(resultArea);
            resultBox.innerText = data.detectorResult;
            resultBox.className = data.detectorResult.includes("Truth") ? "result-box truth-style" : "result-box lie-style";
        }
    });
}

function showSubScreen(screen) {
    questionArea.classList.add("hidden");
    answerArea.classList.add("hidden");
    waitingState.classList.add("hidden");
    screen.classList.remove("hidden");
}

sendQuestionBtn.addEventListener("click", () => {
    let qText = questionInput.value.trim();
    if (!qText) return alert("Type a question!");
    database.ref('rooms/' + roomId).update({ question: qText, gameState: "answering" });
    questionInput.value = "";
});

function resetTypingTracker() {
    backspaceCount = 0;
    keyStrokes = 0;
    typingStartTime = Date.now();
}

answerInput.addEventListener("keydown", (e) => {
    if (keyStrokes === 0) typingStartTime = Date.now();
    keyStrokes++;
    if (e.key === "Backspace") backspaceCount++;
});

sendAnswerBtn.addEventListener("click", () => {
    let ansText = answerInput.value.trim();
    if (!ansText) return alert("Type your answer!");

    let totalTimeTaken = (Date.now() - typingStartTime) / 1000;
    let isLie = false;

    // Option B Algorithmic Check (Erase count & Time vs Word length)
    if (backspaceCount >= 4) isLie = true; 
    else if (totalTimeTaken > 12 && ansText.length < 15) isLie = true;

    let finalResult = isLie ? "❌ LIE DETECTED! (High Hesitation Index)" : "✅ TRUTH DETECTED! (Confident Profile)";

    database.ref('rooms/' + roomId).update({ answer: ansText, gameState: "scanning" });

    setTimeout(() => {
        database.ref('rooms/' + roomId).update({ gameState: "finished", detectorResult: finalResult });
    }, 3000);

    answerInput.value = "";
    keyStrokes = 0;
});

nextRoundBtn.addEventListener("click", () => {
    let nextTurn = currentTurn === "player1" ? "player2" : "player1";
    database.ref('rooms/' + roomId).update({
        gameState: "questioning", question: "", answer: "", turn: nextTurn, detectorResult: ""
    });
});
