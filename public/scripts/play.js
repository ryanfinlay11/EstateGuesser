const chosenLocation = window.location.pathname.split('/').pop();
console.log('JS file loaded successfully! Location = ' + chosenLocation);
const locations = {'toronto': 'Toronto'};

if (!locations.hasOwnProperty(chosenLocation)) {
    console.log(chosenLocation);
    console.log('Not a valid location');
    window.location.href = '/';
}

const introModal = document.getElementById('introModal');
document.getElementById('locationInstruction').textContent += locations[chosenLocation];

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

let timeLeft = 5 * 60;
let interval;
let currentRound = 1;
let totalPointsNum = 0;

function start() {
    console.log('Starting');
    hide(introModal);
    startTimer();
}

function changeImage(direction) {
    propertyTitle.textContent = direction;
    console.log(direction);
}

function submitGuess() {
    console.log('Guess submitted');
    //Clear input box
    inputBox.value = '';
    submitGuessButton.setAttribute('disabled', 'disabled');
    window.scrollTo(0, 0);
    show(postRoundModal);
    if (currentRound === 5) {
        nextButton.innerHTML = 'See<br>Results';
        nextButton.style.backgroundColor = 'rgb(0, 0, 200)';
    }
    pauseTimer();
    animateScore(1000, pointsGained, 1000, 'round', 2000);
}

function next() {
    hide(postRoundModal);
    console.log('Next property');
    currentRound++;
    if (currentRound > 5 || timeLeft <= 0) {
        hide(timesUpModal);
        show(endGameModal);
        setText(totalPoints, 5000, getColorForScore(5000, 'total'));
    }
    else {
        startTimer();
        setText(propertyTitle, 'Property ' + currentRound + '/5');
    }
}

function timesUp() {
    console.log('Time\'s up!');
    nextButton.style.backgroundColor = 'rgb(0, 0, 200)';
    show(timesUpModal);
}

//Helper functions

function startTimer(){
    interval = setInterval(function() {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timer = document.getElementById('timer');
        document.getElementById('timer-text').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (timeLeft === 120) {
            timer.style.backgroundColor = 'rgba(255, 166, 0, 0.7)';
            timer.style.border = '5px solid orange';
        }
        else if (timeLeft === 30) {
            timer.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            timer.style.border = '5px solid red';
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

function setText(element, text, color) {
    element.textContent = text;
    if (color) element.style.color = color;
}

function animateScore(finalScore) {
    const startTimestamp = performance.now();
    const startScore = 0;
    const location = pointsGained;
    const duration = 2000;
    const maxScore = 1000;

    function easeOut(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function updateScore(currentTime) {
        const elapsed = currentTime - startTimestamp;
        if (elapsed < duration) {
            const progress = easeOut(elapsed / duration);
            const currentScore = Math.round(progress * (finalScore - startScore) + startScore);
            location.textContent = currentScore;
            location.style.color = getColorForScore(currentScore, 'round');
            requestAnimationFrame(updateScore);
        } else {
            location.textContent = finalScore;
            location.style.color = getColorForScore(finalScore, 'round');
            if (finalScore === maxScore) {
                location.classList.add('strobe-effect');
                setTimeout(() => {
                    location.classList.remove('strobe-effect');
                }, 1000);
            }
        }
    }

    requestAnimationFrame(updateScore);
}

function getColorForScore(score, type) {
    if (type === 'round') {
        if (score < 200) return 'red';
        if (score < 800) return 'lightblue';
        if (score < 1000) return 'green';
        return '#FFD700';
    } else {
        if (score < 1500) return 'red';
        if (score < 4000) return 'lightblue';
        if (score < 5000) return 'green';
        return '#FFD700';
    }
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
    .then(data => console.log('Here'))
    .catch(error => console.error('Error fetching data:', error));
*/
