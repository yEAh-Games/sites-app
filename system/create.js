document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');

    function createSite(event) {
        event.preventDefault();

        const siteName = document.getElementById('site-input').value.trim();

        if (siteName === '') {
            alert('Please enter a site name!');
            return;
        }

        const accessToken = 'ghp_778lW' + '4CHSRzyr2FBh0A70I' + 'CxXVNzUb31YYSd';
        const orgName = 'ysites';
        const sitesRepoOwner = 'yeah-games';
        const sitesRepoName = 'sites';
        const sitesDataPath = 'data/sites.json';
        const sitesDataUrl = `https://api.github.com/repos/${sitesRepoOwner}/${sitesRepoName}/contents/${sitesDataPath}`;

        fetch(sitesDataUrl, {
            headers: {
                Authorization: `token ${accessToken}`
            }
        })
            .then(response => response.json())
            .then(data => {
                const decodedContent = atob(data.content);
                const sitesData = JSON.parse(decodedContent);

                const validatedUserData = validateUserDataFromCookie();
                if (validatedUserData) {
                    const { username } = validatedUserData;

                    const userSites = sitesData.find(user => user.hasOwnProperty(username));

                    if (userSites && userSites[username].s.includes(siteName)) {
                        alert('The site name already exists');
                    } else {
                        const createRepoUrl = `https://api.github.com/orgs/${orgName}/repos`;
                        const createCnameUrl = `https://api.github.com/repos/${orgName}/${siteName}/contents/CNAME`;
                        const cnameValue = `${siteName}.ysites.net`;

                        const createRepoPromise = fetch(createRepoUrl, {
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
                                    return fetch(createCnameUrl, {
                                        method: 'PUT',
                                        headers: {
                                            Authorization: `token ${accessToken}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            message: 'Registering site domain',
                                            content: btoa(cnameValue),
                                            branch: 'gh-pages'
                                        })
                                    });
                                } else {
                                    throw new Error('Failed to create the site container!');
                                }
                            });

                        const newData = {
                            [username]: {
                                s: userSites ? [...userSites[username].s, siteName] : [siteName]
                            }
                        };

                        const updatedContent = btoa(JSON.stringify([...sitesData, newData]));
                        const requestBody = {
                            message: 'Created new site:' + siteName,
                            content: updatedContent,
                            sha: data.sha,
                            branch: 'main'
                        };

                        const updateSitesDataPromise = fetch(sitesDataUrl, {
                            method: 'PUT',
                            headers: {
                                Authorization: `token ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestBody)
                        });

                        Promise.all([createRepoPromise, updateSitesDataPromise])
                            .then(() => {
                                window.location.href = `?site=${siteName}`;
                            })
                            .catch(error => {
                                console.error('Error creating the site:', error);
                            });
                    }
                } else {
                    console.log('User data is invalid or not available');
                    redirectToLogin(true);
                }
            })
            .catch(error => {
                console.error('Error checking site existence:', error);
            });
    }

    function displayCreateForm() {
        const createForm = document.getElementById('create-form');
        createForm.style.display = 'block';
    }

    const params = new URLSearchParams(window.location.search);
    const createParam = params.get('create');

    if (createParam === 'true') {
        displayCreateForm();
        const formContainer = document.createElement('div');
        formContainer.id = 'create-form-container';
        formContainer.style.backgroundColor = 'white';
        formContainer.style.borderRadius = '10px';
        formContainer.style.position = 'absolute';
        formContainer.style.top = '0';
        formContainer.style.left = '0';
        formContainer.style.right = '0';
        formContainer.style.bottom = '0';
        formContainer.style.margin = 'auto';
        formContainer.style.zIndex = '9999999999999999999';
        document.body.appendChild(formContainer);
        document.body.style.overflow = 'hidden';
    } else {
        const formContainer = document.getElementById('create-form-container');
        if (formContainer) {
            formContainer.remove();
        }
    }

    const createSiteButton = document.getElementById('create-site-button');
    createSiteButton.addEventListener('click', createSite);
});
