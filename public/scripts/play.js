const chosenLocation = window.location.pathname.split('/').pop();
const locations = {'toronto': 'Toronto'};

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

initialize();

async function initialize() {
    const startButton = getElement('start-button');
    startButton.setAttribute('disabled', 'disabled');
    if (!locations.hasOwnProperty(chosenLocation)) {
        error('Invalid location');
        throw new Error('Invalid location');
    }
    addText(getElement('locationInstruction'), locations[chosenLocation]);
    await getProperties();
    startButton.removeAttribute('disabled');
    setText(startButton, 'Start!');
}

function start() {
    hide(introModal);
    propertyIDs = shuffleArray(Object.keys(properties));
    startRound();
}

function changeImage(direction) {
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
    if (currentRound === 5) {
        nextButton.innerHTML = 'See<br>Results';
        nextButton.style.backgroundColor = 'rgb(0, 0, 200)';
    }
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

function startRound() {
    setText(propertyTitle, 'Property ' + currentRound + '/5');
    const currentProperty = properties[propertyIDs[currentRound - 1]];
    propertyImgArray = currentProperty.imageUrls;
    currentImageIndex = 0;
    setImage(propertyImgArray[currentImageIndex]);
    setText(bedroomNum, currentProperty.bedrooms.charAt(0));
    if (bedroomNum.textContent !== "1") addText(bedroomText, 's');
    setText(bathroomNum, currentProperty.bathrooms.charAt(0));
    if (bedroomNum.textContent !== "1") addText(bathroomText, 's');
    startTimer();
    console.log(currentProperty.listingPrice);
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
    let errorPercentage = Math.abs((guess - actual) / actual) * 100;
    if (guess > actual) errorPercentage = errorPercentage / 1.5;
    errorPercentage = Math.min(errorPercentage, 100);
    if (errorPercentage < 5) return 1000;
    return Math.round(Math.min(0.0642188 * errorPercentage * errorPercentage - 17.4424 * errorPercentage + 1102.27, 1000));
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
