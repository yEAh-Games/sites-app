function createBubble(siteName, username) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const siteNameElement = document.createElement('span');
  siteNameElement.textContent = siteName;

  const usernameElement = document.createElement('span');
  usernameElement.textContent = "";

  const siteLink = document.createElement('a');
  siteLink.href = `?site=${siteName}`;
  siteLink.appendChild(siteNameElement);

  bubble.appendChild(siteLink);
  bubble.appendChild(usernameElement);

  bubble.addEventListener('click', () => {
    window.location.href = siteLink.href;
    setTimeout(() => {
      window.location.reload(); 
    }, 500); 
  });

  return bubble;
}

function displayCreateButton() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'flex';

  const createButton = document.getElementById('create-button');
  createButton.style.display = 'block';
}


function isSiteQueryStringEmpty() {
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site');

  return !site || site.trim() === '';
}

function fetchUserSites(username) {
  return fetch('https://sites.yeahgames.net/data/sites.json')
    .then(response => response.json())
    .then(data => {
      const userSites = data.find(user => user.hasOwnProperty(username));

      if (userSites) {
        if (isSiteQueryStringEmpty()) {
          const siteNames = userSites[username].s;

          const overlay = document.getElementById('overlay');
          overlay.innerHTML = '';

          siteNames.forEach(siteName => {
            const bubble = createBubble(siteName, username);
            overlay.appendChild(bubble);
          });
        } else {
          const overlay = document.getElementById('overlay');
          overlay.style.display = 'none';
        }
      } else {
        displayCreateButton();
      }
    })
    .catch(error => {
      console.error('Error fetching user sites:', error);
    });
}


function redirectToLogin() {
  window.location.href = 'https://accounts.yeahgames.net/login?continue=' + window.location.href;
}

document.addEventListener('DOMContentLoaded', () => {
  const validatedUserData = validateUserDataFromCookie();

  if (validatedUserData) {
    const { username } = validatedUserData;

    fetchUserSites(username);
  } else {
    console.log('User data validation failed. Redirecting to login...');
    redirectToLogin();
  }
});

