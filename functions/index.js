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

// Returns 5 properties from (location)
app.get('/api/:location', (req, res) => {
    const location = req.params.location;
    const db = admin.database();
    const ref = db.ref("/toronto");
    ref.once("value").then(snapshot => {
        const data = snapshot.val();
        res.send(data);
    }).catch(error => {
        console.error("Error reading from database:", error);
        res.status(500).send(error);
  });
});

// If no file was found, then redirect to the home page
app.use((req, res) => {
    res.redirect('/');
});

exports.app = functions.https.onRequest(app);
