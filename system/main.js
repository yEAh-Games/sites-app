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

// Function to display the create sites form
function displayCreateForm() {
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = ''; // Clear the overlay

  const createForm = document.createElement('div');

  const siteInput = document.createElement('input');
  siteInput.type = 'text';
  siteInput.placeholder = 'Enter site name';
  siteInput.id = 'site-input';

  const createButton = document.createElement('button');
  createButton.textContent = 'Create';
  createButton.addEventListener('click', () => {
    const siteName = document.getElementById('site-input').value.trim();

    if (siteName === '') {
      alert('Please enter a site name');
      return;
    }

    createSite(siteName);
  });

  createForm.appendChild(siteInput);
  createForm.appendChild(createButton);

  overlay.appendChild(createForm);
}

// Function to create a site
function createSite(siteName) {
  const username = localStorage.getItem('username'); // Retrieve the username from localStorage

  // Check if the site name already exists
  fetch('https://yeah-games/sites/data/sites.json')
    .then(response => response.json())
    .then(data => {
      const siteExists = data.some(user => user.hasOwnProperty(username) && user[username].s.includes(siteName));

      if (siteExists) {
        alert('The site name already exists');
      } else {
        // Create the repository using the GitHub API
        const accessToken = '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'; // Replace with your GitHub access token
        const orgName = 'ysites';
        const repoName = siteName;
        const cnameValue = `${siteName}.ysites.net`;

        const createRepoUrl = `https://api.github.com/orgs/${orgName}/repos`;
        const createCnameUrl = `https://api.github.com/repos/${orgName}/${repoName}/contents/CNAME`;

        // Create the repository
        fetch(createRepoUrl, {
          method: 'POST',
          headers: {
            Authorization: `token ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName
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
              throw new Error('Error creating repository');
            }
          })
          .then(response => {
            if (response.ok) {
              // Update the sites database
              return fetch('https://yeah-games/sites/data/sites.json', {
                method: 'PATCH',
                headers: {
                  Authorization: `token ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  username,
                  s: siteName
                })
              });
            } else {
              throw new Error('Error creating CNAME file');
            }
          })
          .then(response => {
            if (response.ok) {
              // Redirect to the created site
              window.location.href = `?site=${siteName}`;
            } else {
              throw new Error('Error updating sites database');
            }
          })
          .catch(error => {
            console.error('Site creation error:', error);
          });
      }
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}

// Function to fetch the user's sites from the database
function fetchUserSites(username) {
  return fetch('https://yeah-games/sites/data/sites.json')
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
        displayCreateForm();
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

    // Save the username to localStorage for later use
    localStorage.setItem('username', username);

    // Fetch the user's sites and display the overlay or create form
    fetchUserSites(username);
  } else {
    console.log('User data validation failed. Redirecting to login...');
    redirectToLogin();
  }
});
