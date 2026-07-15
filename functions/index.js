const functions = require('firebase-functions');
const express = require('express');
const path = require('path');
const axios = require('axios');

// Property metadata is bundled with the function: small, static, and only
// changes when you re-scrape and redeploy. Loaded into memory at cold start.
const propertyData = require('./EstateGuesserDB.json');

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

// Changes play location parameter from ?=... into /...
app.get('/play/:location', (req, res) => {
    res.sendFile(path.join(__dirname, 'play.html'));
});

// Returns 5 random properties from (location)
app.get('/api/:location', (req, res) => {
    try {
        const location = req.params.location;
        const cityData = propertyData[location];
        if (!cityData) return res.status(404).send('Location not found');

        const numOfProperties = cityData.numOfProperties;
        if (!numOfProperties || numOfProperties < 5) return res.status(500).send('Not enough properties');

        // Images are self-hosted (Firebase Storage), so properties never go stale.
        // Just pick 5 unique random property numbers and return them.
        const randomNums = new Set();
        while (randomNums.size < 5) {
            randomNums.add(Math.floor(Math.random() * numOfProperties) + 1);
        }

        const properties = {};
        for (const num of randomNums) {
            properties[num] = cityData.properties[`property${num}`];
        }
        res.send(properties);
    } catch (err) {
        console.log('Error getting 5 properties: ' + err);
        res.status(500).send('Error getting properties');
    }
});

// Log info to discord
app.post('/api/log/', async (req, res) => {
    try {
        const webhook = functions.config().discord.webhook;
        let message;
        if (req.body.type === 'start') message = `Game started by IP: ${req.body.ip} Agent: ${req.body.agent} in ${req.body.location} `;
        else message = `Game finished by IP: ${req.body.ip} Agent: ${req.body.agent} in ${req.body.location} with score: ${req.body.score}\n-`;
        try {
            await axios.post(webhook, {
                headers: {
                    'Content-Type': 'application/json'
                },
                content: message
            });
        } catch (err) {
            console.error('Error logging to discord: ' + err);
        }
        res.status(200).send('Logged');
    } catch (err) {
        console.error('Error logging to discord: ' + err);
        res.status(500).send(err);
    }
});

// Checks for wrong api call
app.get('/api/:location/*', (req, res) => {
    res.redirect('/');
});

// If no file was found, then redirect to the home page
app.use((req, res) => {
    res.redirect('/');
});

exports.app = functions.https.onRequest(app);
