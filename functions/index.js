const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const path = require('path');
const axios = require('axios');

//If db is in emulation mode, initialize emulation db
if (process.env.FUNCTIONS_EMULATOR) {
    const databaseURL = `http://localhost:9000?ns=${process.env.GCLOUD_PROJECT}`;
    admin.initializeApp({
        databaseURL: databaseURL
    });
} else {
    admin.initializeApp();
}

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

// Changes play location parameter from ?=... into /...
app.get('/play/:location', (req, res) => {
    res.sendFile(path.join(__dirname,'play.html'));
});

// Returns 5 random properties from (location)
app.get('/api/:location', async (req, res) => {
    try {
        const location = req.params.location;
        const locations = ['toronto', 'vaughan', 'richmondhill', 'oakville'];
        if (!locations.includes(location)) return res.status(404).send('Location not found');

        const db = admin.database();
        const numOfProperties = (await db.ref(`/${location}/numOfProperties`).once('value')).val();
        let randomNums = [];
        let properties = {};
        /* Here, 5 properties are randomly selected from the database. If the property is not valid (images are deleted from realtor.ca),
        *  then the property is not added to the list of properties.
        *  If realtor.ca deletes a large number of properties, or if they change the image url format, then the function would loop forever.
        *  This maxLoopCount variable limits the number of iterations */
        const loopCountWarning = 10;
        const maxLoopCount = 20;
        for (let i = 0; i < 5; i++) {
            let loopCount = 0;
            while (true) {
                let randomNum = Math.floor(Math.random() * numOfProperties) + 1;
                if (!randomNums.includes(randomNum) && await checkIfValidProperty(randomNum)) {
                    randomNums.push(randomNum);
                    break;
                }
                loopCount++;
                if (loopCount > loopCountWarning && loopCount < maxLoopCount) {
                    logToDiscord(`Get properties looped > ${loopCountWarning} times on the ${i}'th iteration`);
                }
                else if (loopCount >= maxLoopCount) {
                    console.log(`Error getting 5 properties (get properties looped > ${maxLoopCount} times):`);
                    logToDiscord(`GET PROPERTIES LOOPED > ${maxLoopCount} TIMES ON THE ${i}'TH ITERATION!!!`);
                    res.status(500).send("Error getting properties");
                    throw new Error('Error getting properties');
                }
            }
            properties[`${randomNums[i]}`] = (await db.ref(`/${location}/properties/property${randomNums[i]}`).once('value')).val();
        }
        res.send(properties);

        async function checkIfValidProperty(propertyNum) {
            /* Some time after properties get deleted from realtor.ca, their images get deleted
            *  This function checks if the property still has images */
        
            const firstPropertyImageSuffix = (await db.ref(`/${location}/properties/property${propertyNum}/imageUrls`).once('value')).val()[0];
            const firstPropertyImageUrl = "https://cdn.realtor.ca/listing/" + firstPropertyImageSuffix;
        
            try {
                const response = await axios.get(firstPropertyImageUrl);

                if (response.headers['content-type'].startsWith('image/')) return true;
                else return false;
            } 
            catch (err) {
                return false;
            }
        } 

        async function logToDiscord(message) {
            const webhook = functions.config().discord.webhook;
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
        }
        
    } catch (err) {
        console.log('Error getting 5 properties: ' + err);
        res.status(500).send(err);
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
