const path = window.location.pathname;
const segments = path.split('/');
const chosenLocation = segments[segments.length - 1];
console.log("JS file loaded successfully! Location = " + chosenLocation);
if (chosenLocation === "tor") window.location.href = "/";
document.getElementById("location-name").textContent = chosenLocation;
