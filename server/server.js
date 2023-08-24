const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

//Removes the need for .html in url
//(No longer needed because of cleanUrls with firebase)
app.use(async (req, res, next) => {
    const file = path.join(__dirname, '../public', req.path + '.html');
    try {
        await fs.access(file);
        res.sendFile(file);
    } catch (err) {
        next();
    }
});

//Changes play location parameter from ?=... into /...
app.get('/play/:location', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'play.html'));
});

//If no file was found, then redirect to the home page
//(No longer needed because of 404.html error page with firebase)
app.use((req, res) => {
    res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
