// Function to create a bubble element with site name and username
function createBubble(siteName, username) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const siteNameElement = document.createElement('span');
  siteNameElement.textContent = siteName;

  const usernameElement = document.createElement('span');
  usernameElement.textContent = username;

  const siteLink = document.createElement('a');
  siteLink.href = `?site=${siteName}`;
  siteLink.appendChild(siteNameElement);

  bubble.appendChild(siteLink);
  bubble.appendChild(usernameElement);

  bubble.addEventListener('click', () => {
    window.location.href = siteLink.href; // Redirect to the site URL
    setTimeout(() => {
      window.location.reload(); // Refresh the page to clear the overlay
    }, 500); // Adjust the delay as needed
  });

  return bubble;
}

// Function to display the create sites button
// Function to display the create sites button
function displayCreateButton() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'flex'; // Show the overlay

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

      if (userSites) {
        if (isSiteQueryStringEmpty()) {
          const siteNames = userSites[username].s;

          const overlay = document.getElementById('overlay');
          overlay.innerHTML = ''; // Clear the overlay

          // Create a bubble for each site
          siteNames.forEach(siteName => {
            const bubble = createBubble(siteName, username);
            overlay.appendChild(bubble);
          });
        } else {
          const overlay = document.getElementById('overlay');
          overlay.style.display = 'none'; // Hide the overlay
        }
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





// Function to create a site
function createSite() {
  const siteName = document.getElementById('site-input').value.trim();

  if (siteName === '') {
    alert('Please enter a site name');
    return;
  }

  const accessToken = '<YOUR_GITHUB_ACCESS_TOKEN>'; // Replace with your GitHub access token for creating site repositories
  const orgName = 'ysites';
  const sitesRepoOwner = 'yeah-games';
  const sitesRepoName = 'sites';
  const sitesDataPath = 'data/sites.json';
  const sitesDataUrl = `https://api.github.com/repos/${sitesRepoOwner}/${sitesRepoName}/contents/${sitesDataPath}`;

  // Check if the site name already exists in the sites database
  fetch(sitesDataUrl, {
    headers: {
      Authorization: `token ${accessToken}`
    }
  })
    .then(response => response.json())
    .then(data => {
      const decodedContent = atob(data.content);
      const sitesData = JSON.parse(decodedContent);

      const username = localStorage.getItem('username'); // Retrieve the username from localStorage

      const userSites = sitesData.find(user => user.hasOwnProperty(username));

      if (userSites && userSites[username].s.includes(siteName)) {
        alert('The site name already exists');
      } else {
        // Create the repository using the GitHub API
        const createRepoUrl = `https://api.github.com/orgs/${orgName}/repos`;
        const createCnameUrl = `https://api.github.com/repos/${orgName}/${siteName}/contents/CNAME`;
        const cnameValue = `${siteName}.ysites.net`;

        // Create the repository under the ysites organization
        fetch(createRepoUrl, {
          method: 'POST',
          headers: {
            Authorization: `token ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: siteName,
            org: orgName
          })
        })
          .then(response => {
            if (response.ok) {
              // Create the CNAME file in the gh-pages branch
              return fetch(createCnameUrl, {
                method: 'PUT',
                headers: {
                  Authorization: `token ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: 'Create CNAME',
                  content: btoa(cnameValue),
                  branch: 'gh-pages'
                })
              });
            } else {
              throw new Error('Failed to create the repository');
            }
          })
          .then(response => {
            if (response.ok) {
              // Update the sites data in the sites repository
              const newData = {
                [username]: {
                  s: userSites ? [...userSites[username].s, siteName] : [siteName]
                }
              };

              // Encode the updated data and prepare the request body
              const updatedContent = btoa(JSON.stringify([...sitesData, newData]));
              const requestBody = {
                message: 'Update sites data',
                content: updatedContent,
                sha: data.sha,
                branch: 'main'
              };

              // Write the updated sites data to the sites repository
              return fetch(sitesDataUrl, {
                method: 'PUT',
                headers: {
                  Authorization: `token ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
              });
            } else {
              throw new Error('Failed to create the CNAME file');
            }
          })
          .then(() => {
            // Redirect to the newly created site
            window.location.href = `?site=${siteName}`;
          })
          .catch(error => {
            console.error('Error creating the site:', error);
          });
      }
    })
    .catch(error => {
      console.error('Error checking site existence:', error);
    });
}

// Function to display the create form
function displayCreateForm() {
  const createForm = document.getElementById('create-form');
  createForm.style.display = 'block';
}

// Check if create=true is present in the URL param
const params = new URLSearchParams(window.location.search);
const createParam = params.get('create');

if (createParam === 'true') {
  displayCreateForm();
}

// Add event listener to the create button
const createSiteButton = document.getElementById('create-site-button');
createSiteButton.addEventListener('click', createSite);
