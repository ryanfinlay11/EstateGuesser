const path = window.location.pathname;
const segments = path.split('/');
const chosenLocation = segments[segments.length - 1];
console.log("JS file loaded successfully! Location = " + chosenLocation);
if (chosenLocation === "tor") window.location.href = "/";
document.getElementById("location-name").textContent = chosenLocation;

//Test read from test db
fetch(`/api/toronto`)
    .then(response => response.json())
    .then(data => {
        console.log("Here");
        console.log(data); // This will log the data returned from your cloud function
        // Handle the data as needed
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });
