// Function to create a bubble element with site name and username
function createBubble(siteName, username) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const siteNameElement = document.createElement('span');
  siteNameElement.textContent = siteName;

  const usernameElement = document.createElement('span');
  usernameElement.textContent = username;

  bubble.appendChild(siteNameElement);
  bubble.appendChild(usernameElement);

  return bubble;
}

// Function to display the create sites button
function displayCreateButton() {
  const createButton = document.getElementById('create-button');
  createButton.style.display = 'block';
}

// Function to check if the site query string is empty
function isSiteQueryStringEmpty() {
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site');

  return !site || site.trim() === '';
}

// Function to fetch the user's sites from sites.yeahgames.net/data/sites.json
function fetchUserSites(username) {
  return fetch('https://sites.yeahgames.net/data/sites.json')
    .then(response => response.json())
    .then(data => {
      const userSites = data.find(user => user.hasOwnProperty(username));

      if (userSites && isSiteQueryStringEmpty()) {
        const siteNames = userSites[username].s;

        const overlay = document.getElementById('overlay');

        // Create a bubble for each site
        siteNames.forEach(siteName => {
          const bubble = createBubble(siteName, username);
          overlay.appendChild(bubble);
        });
      } else if (userSites) {
        // User has sites but the site query string is not empty
        console.error('Site query string is not empty');
      } else {
        // User is logged in but doesn't have any sites
        displayCreateButton();
      }
    })
    .catch(error => {
      console.error('Error fetching user sites:', error);
    });
}

// Function to redirect to the login page
function redirectToLogin() {
  window.location.href = 'https://accounts.yeahgames.net/login?continue=' + window.location.href;
}

// Call the necessary functions after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Fetch validated user data from your validation script
  const validatedUserData = validateUserDataFromCookie();

  if (validatedUserData) {
    const { username } = validatedUserData;

    // Fetch the user's sites and display the overlay or create button
    fetchUserSites(username);
  } else {
    console.log('User data validation failed. Redirecting to login...');
    redirectToLogin();
  }
});
