const chosenLocation = window.location.pathname.split('/').pop();
const locations = {'toronto': 'Toronto', 'vaughan': 'Vaughan'};

const introModal = getElement('introModal');

const postRoundModal = getElement('postRoundModal');
const pointsGained = getElement('points-gained-num');
const userGuess = getElement('your-guess');
const actualPrice = getElement('actual-price');
const listingUrl = getElement('listing-url-href');
const nextButton = getElement('next-button');

const endGameModal = getElement('endGameModal');
const totalPoints = getElement('total-points-num');

const timesUpModal = getElement('timesUpModal');

const propertyTitle = getElement('property-title');
const propertyImage = getElement('property-image');
const bedroomNum = getElement('bedrooms-number-digit');
const bedroomText = getElement('bedrooms-number-text');
const bathroomNum = getElement('bathrooms-number-digit');
const bathroomText = getElement('bathrooms-number-text');
const inputBox = getElement('price-guess');
const submitGuessButton = getElement('submit-guess');

let timeLeft = 5 * 60;
let interval;
let currentRound = 1;
let totalPointsNum = 0;
let propertyImgArray = [];
let currentImageIndex = 0;
let properties;
let propertyIDs = [];
let timerGoing = false;
let isKeyPressed = false;
let tapInstructionsFaded = false;

window.onload = function() {
    initialize();
};

async function initialize() {
    const startButton = getElement('start-button');
    startButton.setAttribute('disabled', 'disabled');
    if (!locations.hasOwnProperty(chosenLocation)) {
        error('Invalid location');
        throw new Error('Invalid location');
    }
    addText(getElement('locationInstruction'), locations[chosenLocation]);
    await getProperties();
    fixImageWidth();
    setText(startButton, 'Start!');
    startButton.removeAttribute('disabled');
}

function start() {
    hide(introModal);
    propertyIDs = shuffleArray(Object.keys(properties));
    startRound();
    logData('start');
}

function changeImage(direction) {
    fadeTapInstructions();
    if (direction === 'left') {
        currentImageIndex--;
        if (currentImageIndex < 0) currentImageIndex = propertyImgArray.length - 1;
    } else {
        currentImageIndex++;
        if (currentImageIndex >= propertyImgArray.length) currentImageIndex = 0;
    }
    setImage(propertyImgArray[currentImageIndex]);
}

function submitGuess() {
    pauseTimer();
    submitGuessButton.setAttribute('disabled', 'disabled');
    window.scrollTo(0, 0);

    const currentProperty = properties[propertyIDs[currentRound - 1]];
    const roundScore = calculateScore(inputBox.value, currentProperty.listingPrice);

    show(postRoundModal);
    animateScore(roundScore);
    setText(actualPrice, currentProperty.listingPrice);
    setText(userGuess, "$" + inputBox.value);
    listingUrl.href = currentProperty.url;

    totalPointsNum += roundScore;
    inputBox.value = '';
    setText(bedroomText, 'Bedroom');
    setText(bathroomText, 'Bathroom');
    if (currentRound === 5) {
        nextButton.innerHTML = 'See<br>Results';
        nextButton.style.backgroundColor = 'rgb(0, 0, 200)';
    }
}

function next() {
    hide(postRoundModal);
    currentRound++;
    if (currentRound > 5 || timeLeft <= 0) {
        hide(timesUpModal);
        show(endGameModal);
        setText(totalPoints, totalPointsNum, getColorForScore(totalPointsNum, 'total'));
        logData('end');
    } else {
        startRound();
    }
}

//Helper functions

function startRound() {
    setText(propertyTitle, 'Property ' + currentRound + '/5');
    const currentProperty = properties[propertyIDs[currentRound - 1]];
    propertyImgArray = currentProperty.imageUrls;
    currentImageIndex = 0;
    setImage(propertyImgArray[currentImageIndex]);
    setText(bedroomNum, currentProperty.bedrooms.replace(/\s/g, ''));
    if (bedroomNum.textContent !== "1") addText(bedroomText, 's');
    setText(bathroomNum, currentProperty.bathrooms.replace(/\s/g, ''));
    if (bathroomNum.textContent !== "1") addText(bathroomText, 's');
    startTimer();
}

async function getProperties() {
    //If this map has never been played before, initialize occurance array
    let occuranceArray = JSON.parse(localStorage.getItem(chosenLocation));
    if (!occuranceArray) {
        occuranceArray = new Array(100 + 1).fill(0);
        localStorage.setItem(chosenLocation, JSON.stringify(occuranceArray));
    }
    //Get 2 sets of 5 properties from server
    let data1, data2;
    try {
        let response = await fetch(`/api/${chosenLocation}`);
        data1 = await response.json();
        response = await fetch(`/api/${chosenLocation}`);
        data2 = await response.json();
    } catch (err) {
        error('Error getting properties');
        throw new Error('Error getting properties');
    }
    //Compare occurance scores of each property and set properties to the one with the lower score
    const data1PropertyNums = Object.keys(data1);
    const data2PropertyNums = Object.keys(data2);
    let occuranceScore1 = 0;
    let occuranceScore2 = 0;
    for (let i = 0; i < 5; i++) occuranceScore1 += occuranceArray[data1PropertyNums[i]];
    for (let i = 0; i < 5; i++) occuranceScore2 += occuranceArray[data2PropertyNums[i]];
    if (occuranceScore1 <= occuranceScore2) {
        properties = data1;
        updateOccuranceArray(occuranceArray, data1PropertyNums);
    } else {
        properties = data2;
        updateOccuranceArray(occuranceArray, data2PropertyNums);
    }
}

function startTimer(){
    timerGoing = true;
    interval = setInterval(function() {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timer = document.getElementById('timer');
        document.getElementById('timer-text').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (timeLeft === 120) {
            timer.style.backgroundColor = 'rgba(255, 166, 0, 0.7)';
            timer.style.border = '5px solid orange';
        } else if (timeLeft === 30) {
            timer.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            timer.style.border = '5px solid red';
        } else if (timeLeft === 10) {
            timer.classList.add('strobe-effect');
        } else if (timeLeft <= 0) {
            timer.classList.remove('strobe-effect');
            pauseTimer();
            timesUp();
        }
    }, 1000);
}

function pauseTimer(){
    clearInterval(interval);
    timerGoing = false;
}

function timesUp() {
    nextButton.style.backgroundColor = 'rgb(0, 0, 200)';
    show(timesUpModal);
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

function addText(element, text){
    element.textContent += text;
}

function setImage(url) {
    propertyImage.src = "https://cdn.realtor.ca/listing/" + url;
}

function updateOccuranceArray(occuranceArray, propertyNums) {
    for (let i = 0; i < 5; i++) occuranceArray[propertyNums[i]]++;
    localStorage.setItem(chosenLocation, JSON.stringify(occuranceArray));
}

function getElement(id) {
    return document.getElementById(id);
}

function calculateScore(guess, actual) {
    guess = parseInt(guess.replace(/\D/g, ''));
    actual = parseInt(actual.replace(/\D/g, ''));
    const errorPercentage = ((guess - actual) / actual) * 100;
    let score;
    if (errorPercentage < -10) score = (100/9) * errorPercentage + 10000/9;
    else if (errorPercentage >= -10 && errorPercentage <= 10) score = 1000;
    else if (errorPercentage > 10 && errorPercentage <= 100) score = 1100 - 10 * errorPercentage;
    else if (errorPercentage > 100 && errorPercentage <= 200) score = 200 - errorPercentage;
    else score = 0;
    return Math.round(score);
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

function fadeTapInstructions() {
    if (tapInstructionsFaded) return;
    tapInstructionsFaded = true;
    const tapInstructions = document.querySelectorAll('.tap-instruction');
    tapInstructions.forEach(function(el) {
        el.style.opacity = 0;
        el.addEventListener('transitionend', function() {
            el.style.display = 'none';
        }, { once: true })
    });
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function logData(type) {
    const ip = await fetch('https://api.ipify.org?format=json').then(result => result.json()).then(data => data.ip);
    const agent = /\(([^)]+)\)/.exec(navigator.userAgent);
    let data = {
        type: type,
        ip: '**' + ip + '**',
        agent: '**' + agent[1] + '**',
        location: '**' + chosenLocation + '**',
        score: '0'
    };
    if (type === 'end') data.score = '**' + totalPointsNum + '**';
    try {
        await fetch('/api/log/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.log("Data could not be logged");
    }
}

function fixImageWidth() {
    propertyImage.style.width = '99%';
    setTimeout(() => {
        propertyImage.style.width = '100%';
    }, 100);
}

function error(message) {
    alert(message);
    window.location.href = '/select';
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

document.addEventListener('keydown', function(event) {
    if (isKeyPressed | !timerGoing) return;
    switch (event.key) {
        case 'ArrowLeft':
            changeImage('left');
            break;
        case 'ArrowRight':
            changeImage('right');
            break;
    }
    isKeyPressed = true;
});

document.addEventListener('keyup', function() {
    isKeyPressed = false;
});

document.querySelector('input').addEventListener('keydown', function(event) {
    var arrowKeys = [37, 39];  // Key codes for left and right arrow keys
    if (arrowKeys.includes(event.keyCode)) {
        event.preventDefault();
    }
});

propertyImage.addEventListener('click', function(event) {
    if (event.offsetX < this.offsetWidth / 2) changeImage('left');
    else changeImage('right');
});
