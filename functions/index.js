const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const path = require('path');

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
        const locations = ['toronto', 'vaughan'];
        if (!locations.includes(location)) return res.status(404).send('Location not found');
        const db = admin.database();
        const numOfProperties = (await db.ref(`/${location}/numOfProperties`).once('value')).val();
        let randomNums = [];
        let properties = {};
        for (let i = 0; i < 5; i++) {
            while (true) {
                let randomNum = Math.floor(Math.random() * numOfProperties) + 1;
                if (!randomNums.includes(randomNum)) {
                    randomNums.push(randomNum);
                    break;
                }
            }
            properties[`${randomNums[i]}`] = (await db.ref(`/${location}/properties/property${randomNums[i]}`).once('value')).val();
        }
        res.send(properties);
    } catch (err) {
        console.log(err);
        console.log("Error getting 5 properties");
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
