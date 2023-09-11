const chosenLocation = window.location.pathname.split('/').pop();
console.log("JS file loaded successfully! Location = " + chosenLocation);
const locations = {"toronto": "Toronto"}

/*
if (!locations.includes(chosenLocation)) {
    console.log(chosenLocation);
    console.log("Not a valid location");
    //window.location.href = "/";
}
*/

const introModal = document.getElementById('introModal');
//document.getElementById("locationInstruction").textContent += locations[chosenLocation];
document.getElementById("locationInstruction").textContent += "Toronto";

const postRoundModal = document.getElementById('postRoundModal');
const pointsGained = document.getElementById('points-gained-num');
const userGuess = document.getElementById('your-guess');
const actualPrice = document.getElementById('actual-price');
const listingUrl = document.getElementById('listing-url');
const nextButton = document.getElementById('next-button');

const endGameModal = document.getElementById('endGameModal');
const totalPoints = document.getElementById('total-points-num');

const timesUpModal = document.getElementById('timesUpModal');

const propertyTitle = document.getElementById('property-title');
const inputBox = document.getElementById('price-guess');
const submitGuessButton = document.getElementById('submit-guess');

let timeLeft = 5 * 1;
let interval;
let currentRound = 1;
let totalPointsNum = 0;

function start() {
    console.log("Starting");
    hide(introModal);
    startTimer();
}

function changeImage(direction) {
    propertyTitle.textContent = direction;
    console.log(direction);
}

function submitGuess() {
    console.log("Guess submitted");
    //Clear input box
    inputBox.value = "";
    submitGuessButton.setAttribute('disabled', 'disabled');
    show(postRoundModal);
    if (currentRound === 5) {
        nextButton.innerHTML = "See<br>Results";
        nextButton.style.backgroundColor = "rgb(0, 0, 200)";
    }
    pauseTimer();
    animateScore(1999, 2000);
}

function next() {
    hide(postRoundModal);
    console.log("Next property");
    currentRound++;
    if (currentRound > 5 || timeLeft <= 0) {
        hide(timesUpModal);
        show(endGameModal);
    }
    else {
        startTimer()
    }
}

function timesUp() {
    console.log("Time's up!");
    nextButton.style.backgroundColor = "rgb(0, 0, 200)";
    show(timesUpModal);
}

//Helper functions

function startTimer(){
    interval = setInterval(function() {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timer = document.getElementById("timer");
        document.getElementById("timer-text").textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (timeLeft === 120) {
            timer.style.backgroundColor = "rgba(255, 166, 0, 0.7)";
            timer.style.border = "5px solid orange";
        }
        else if (timeLeft === 30) {
            timer.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
            timer.style.border = "5px solid red";
        }
        else if (timeLeft === 10) {
            timer.classList.add('strobe-effect');
        }
        else if (timeLeft <= 0) {
            timer.classList.remove('strobe-effect');
            pauseTimer();
            timesUp();
        }
    }, 1000);
}

function pauseTimer(){
    clearInterval(interval);
}

function show(modal){
    modal.style.display = 'block';
}

function hide(modal){
    modal.style.display = 'none';
}

function animateScore(finalScore, duration) {
    const startTimestamp = performance.now();
    const startScore = 0;

    function easeOut(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function updateScore(currentTime) {
        const elapsed = currentTime - startTimestamp;
        if (elapsed < duration) {
            const progress = easeOut(elapsed / duration);
            const currentScore = Math.round(progress * (finalScore - startScore) + startScore);
            pointsGained.textContent = currentScore;
            pointsGained.style.color = getColorForScore(currentScore);
            requestAnimationFrame(updateScore);
        } else {
            pointsGained.textContent = finalScore;
            pointsGained.style.color = getColorForScore(finalScore);
            if (finalScore === 1000) {
                pointsGained.classList.add('strobe-effect');
                setTimeout(() => {
                    pointsGained.classList.remove('strobe-effect');
                }, 1000);
            }
        }
    }

    requestAnimationFrame(updateScore);
}

function getColorForScore(score) {
    if (score < 200) return 'red';
    if (score < 800) return 'lightblue';
    if (score < 1000) return 'green';
    return '#FFD700';
}

inputBox.addEventListener('input', function() {
    let value = this.value.replace(/[^0-9]/g, '').substr(0, 9);
    if (value) {
        value = parseFloat(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
        submitGuessButton.removeAttribute('disabled');
    } else {
        submitGuessButton.setAttribute('disabled', 'disabled');
    }
    this.value = value;
});

//Test read from test db
/*
fetch(`/api/toronto`)
    .then(response => response.json())
    .then(data => console.log("Here"))
    .catch(error => console.error("Error fetching data:", error));
*/
