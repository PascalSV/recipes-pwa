export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/') {
            return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recipes PWA</title>
    <link rel="stylesheet" href="https://unpkg.com/onsenui/css/onsenui.css">
    <link rel="stylesheet" href="https://unpkg.com/onsenui/css/onsen-css-components.min.css">    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">    <script src="https://unpkg.com/onsenui/js/onsenui.min.js"></script>
    <link rel="manifest" href="/manifest.json">    <style>
        body { font-size: 18px; font-family: 'Inter', sans-serif; }
        .card__title, .toolbar__title { font-size: 20px; }
        .list-item__title { font-size: 18px; }
        .list { background-color: white; }
        .list-item { background-color: white; }
        #login { display: block; }
        #navigator { display: none; }
        .login-page { background-color: #efeff4; min-height: 100vh; }
        .login-content { max-width: 400px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        .login-icon { text-align: center; margin-bottom: 20px; }
        ::-webkit-scrollbar { display: none; }
        scrollbar-width: none;
    </style></head>
<body>
    <div id="login" class="login-page">
        <ons-toolbar>
            <div class="center">
                Pascals Rezepte
            </div>
        </ons-toolbar>
        </br></br>
        <div class="login-content">
            <ons-card>
                <div class="content">
                    <div class="login-icon">
                        <img src="icon-192.jpg" alt="App Icon" style="width: 64px; height: 64px;">
                    </div>
                    <p style="text-align: center; margin-bottom: 30px; color: #666;">Bitte anmelden, um auf die Rezepte zugreifen zu können</p>
                    <ons-input id="username" placeholder="Benutzername" modifier="underbar" style="width: 80%; margin: 0 auto 20px auto; display: block;"></ons-input>
                    <ons-input id="password" type="password" placeholder="Passwort" modifier="underbar" style="width: 80%; margin: 0 auto 10px auto; display: block;"></ons-input>
                    <p id="error-message" style="color: red; font-size: 14px; visibility: hidden; height: 20px; margin: 20px 0;"></p>
                    <ons-button onclick="login()" modifier="large" style="width: 100%;">Anmelden</ons-button>
                </div>
            </ons-card>
        </div>
    </div>

    <ons-navigator id="navigator">
        <ons-page id="home">
            <ons-toolbar>
                <div class="center">
                    Pascals Rezepte
                </div>
                <div class="right">
                    <ons-button onclick="addRecipe()" modifier="quiet">
                        <ons-icon icon="md-plus"></ons-icon>
                    </ons-button>
                </div>
            </ons-toolbar>
            <div style="position: relative; margin: 10px;">
                <ons-search-input id="recipe-search" placeholder="Nach Rezept suchen..." style="width: 100%; padding-right: 40px;"></ons-search-input>
                <ons-icon id="clear-search" icon="md-close" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none; font-size: 20px;"></ons-icon>
            </div>
            <div id="recipe-list" style="display: flex; flex-wrap: wrap; padding: 10px;">
                <!-- Recipes will be loaded here -->
            </div>
            <div style="padding: 10px; text-align: center;">
                <label style="font-size: 16px;">
                    <input type="checkbox" id="wake-lock-toggle" onchange="toggleWakeLock(this.checked)" style="margin-right: 8px;">
                    Keep screen on
                </label>
                <br>
                <ons-button onclick="logoff()" modifier="quiet" style="margin-top: 10px;">Abmelden</ons-button>
            </div>
        </ons-page>
    </ons-navigator>

    <template id="recipe-view">
        <ons-page>
            <ons-toolbar>
                <div class="left">
                    <ons-back-button>Zurück</ons-back-button>
                </div>
                <div class="center">
                    Pascals Rezepte
                </div>
                <div class="right">
                    <ons-button onclick="editRecipe()" modifier="quiet"><ons-icon icon="md-edit"></ons-icon></ons-button>
                    <ons-button onclick="copyRecipe()" modifier="quiet"><ons-icon icon="fa-clipboard"></ons-icon></ons-button>
                </div>
            </ons-toolbar>
            <ons-card>
                <div class="title" id="recipe-title"></div>
                <div class="content">
                    <ons-card>
                        <div class="title">Bemerkung:</div> 
                        <div class="content">
                            <span id="recipe-bemerkung"></span><br>
                        </div>
                    </ons-card>
                    <ons-card>
                        <div class="title">Zutaten:</div> 
                        <div class="content">
                            <div id="recipe-zutaten" style="white-space: pre-wrap;"></div>
                        </div>
                    </ons-card>
                    <ons-card>
                        <div class="title">Zubereitung:</div> 
                        <div class="content">
                            <div id="recipe-zubereitung" style="white-space: pre-wrap;"></div>
                        </div>
                    </ons-card>
                </div>
            </ons-card>
        </ons-page>
    </template>

    <template id="add-recipe">
        <ons-page>
            <ons-toolbar>
                <div class="left">
                    <ons-button onclick="cancelAddRecipe()" modifier="quiet">Abbrechen</ons-button>
                </div>
                <div class="center" id="add-recipe-title">
                    Neues Rezept
                </div>
                <div class="right">
                    <ons-button onclick="saveRecipe()" modifier="quiet">Speichern</ons-button>
                </div>
            </ons-toolbar>
            <ons-card>
                <div class="content" style="padding: 20px;">
                    <ons-input id="recipe-title-input" placeholder="Titel" modifier="underbar" style="margin-bottom: 20px;"></ons-input>
                    <textarea id="recipe-bemerkung-input" placeholder="Bemerkungen" class="textarea textarea--transparent" rows="3" style="width: 100%; margin-bottom: 20px; border: none; border-bottom: 1px solid #ccc; padding: 8px 0;"></textarea>
                    <textarea id="recipe-zutaten-input" placeholder="Zutaten" class="textarea textarea--transparent" rows="5" style="width: 100%; margin-bottom: 20px; border: none; border-bottom: 1px solid #ccc; padding: 8px 0;"></textarea>
                    <textarea id="recipe-zubereitung-input" placeholder="Zubereitung" class="textarea textarea--transparent" rows="8" style="width: 100%; margin-bottom: 20px; border: none; border-bottom: 1px solid #ccc; padding: 8px 0;"></textarea>
                </div>
            </ons-card>
        </ons-page>
    </template>

    <script src="/app.js"></script>
</body>
</html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        if (url.pathname === '/manifest.json') {
            return new Response(JSON.stringify({
                "name": "Recipes PWA",
                "short_name": "Pascals Rezepte",
                "start_url": "/",
                "display": "standalone",
                "background_color": "#ffffff",
                "theme_color": "#007bff",
                "icons": [
                    {
                        "src": "icon-192.png",
                        "sizes": "192x192",
                        "type": "image/png"
                    },
                    {
                        "src": "icon-512.png",
                        "sizes": "512x512",
                        "type": "image/png"
                    }
                ]
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname === '/app.js') {
            return new Response(`
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('loggedIn') === 'true') {
        document.getElementById('login').style.display = 'none';
        document.getElementById('navigator').style.display = 'block';
        loadRecipes();
    }
    // Check wake lock support and set initial state
    if ('wakeLock' in navigator) {
        const toggle = document.getElementById('wake-lock-toggle');
        if (toggle) {
            toggle.checked = localStorage.getItem('wakeLockEnabled') === 'true';
            if (toggle.checked) {
                requestWakeLock();
            }
        }
    } else {
        // Hide toggle if not supported
        const toggle = document.getElementById('wake-lock-toggle');
        if (toggle) {
            toggle.parentElement.style.display = 'none';
        }
    }
});

let wakeLock = null;

let editData = null;

let allRecipes = [];

function requestWakeLock() {
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(lock => {
            wakeLock = lock;
            console.log('Wake lock acquired');
        }).catch(err => {
            console.log('Wake lock request failed:', err);
        });
    }
}

function logoff() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('wakeLockEnabled');
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
    location.reload();
}

function login() {
    const password = document.getElementById('password').value;
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('loggedIn', 'true');
            document.getElementById('login').style.display = 'none';
            document.getElementById('navigator').style.display = 'block';
            loadRecipes();
        } else {
            document.getElementById('error-message').textContent = 'Ungültiges Passwort';
            document.getElementById('error-message').style.visibility = 'visible';
        }
    });
}

function loadRecipes() {
    fetch('/api/recipes')
        .then(response => response.json())
        .then(recipes => {
            allRecipes = recipes.sort((a, b) => a.name.localeCompare(b.name));
            displayRecipes(allRecipes);
            // Initialize search input
            const searchInput = document.getElementById('recipe-search');
            const clearIcon = document.getElementById('clear-search');
            if (searchInput && clearIcon) {
                searchInput.value = '';
                searchInput.addEventListener('input', performSearch);
                clearIcon.addEventListener('click', clearSearch);
            }
        });
}

function clearSearch() {
    const searchInput = document.getElementById('recipe-search');
    const clearIcon = document.getElementById('clear-search');
    if (searchInput) {
        searchInput.value = '';
        clearIcon.style.display = 'none';
        displayRecipes(allRecipes);
    }
}

function performSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();
    const clearIcon = document.getElementById('clear-search');
    
    // Show/hide clear icon based on input
    if (clearIcon) {
        clearIcon.style.display = searchTerm.length > 0 ? 'block' : 'none';
    }
    
    if (searchTerm.length < 3) {
        displayRecipes(allRecipes);
    } else {
        const filtered = allRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm)
        );
        displayRecipes(filtered);
    }
}

function displayRecipes(recipes) {
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';
    recipes.forEach((recipe, index) => {
        let borderRadius = '';
        if (recipes.length === 1) {
            borderRadius = 'border-radius: 8px;';
        } else if (index === 0) {
            borderRadius = 'border-top-left-radius: 8px; border-top-right-radius: 8px;';
        } else if (index === recipes.length - 1) {
            borderRadius = 'border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;';
        }
        const item = ons.createElement(\`
            <ons-list-item modifier="chevron" inset tappable onclick="viewRecipe('\${recipe.id}')" style="\${borderRadius} overflow: hidden;">
                \${recipe.name}
            </ons-list-item>
        \`);
        list.appendChild(item);
    });
}

function addRecipe() {
    document.getElementById('navigator').pushPage('add-recipe');
}

function cancelAddRecipe() {
    document.getElementById('navigator').popPage();
}

function saveRecipe() {
    const name = document.getElementById('recipe-title-input').value;
    const bemerkung = document.getElementById('recipe-bemerkung-input').value;
    const zutaten = document.getElementById('recipe-zutaten-input').value;
    const zubereitung = document.getElementById('recipe-zubereitung-input').value;
    if (name && zutaten && zubereitung) {
        const data = document.getElementById('navigator').topPage.data;
        const id = data && data.id ? data.id : Date.now().toString();
        const recipe = { id, name, title: name, bemerkung, zutaten, zubereitung };
        fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        }).then(() => {
            const navigator = document.getElementById('navigator');
            const data = navigator.topPage.data;
            const isEdit = data && data.id;
            const recipe = { id, name, title: name, bemerkung, zutaten, zubereitung };

            navigator.popPage().then(() => {
                const currentPage = navigator.topPage;
                if (isEdit) {
                    // Update the recipe view DOM with new data
                    currentPage.data = recipe;
                    const titleEl = currentPage.querySelector('#recipe-title');
                    const bemEl = currentPage.querySelector('#recipe-bemerkung');
                    const zutatenEl = currentPage.querySelector('#recipe-zutaten');
                    const zubereitungEl = currentPage.querySelector('#recipe-zubereitung');
                    if (titleEl) titleEl.textContent = recipe.name;
                    if (bemEl) bemEl.textContent = recipe.bemerkung;
                    if (zutatenEl) zutatenEl.textContent = recipe.zutaten;
                    if (zubereitungEl) zubereitungEl.textContent = recipe.zubereitung;
                } else if (currentPage.id === 'home') {
                    // New recipe: push the recipe view
                    navigator.pushPage('recipe-view', {
                        data: {
                            id: recipe.id,
                            title: recipe.name,
                            bemerkung: recipe.bemerkung,
                            zutaten: recipe.zutaten,
                            zubereitung: recipe.zubereitung
                        }
                    });
                }
                loadRecipes();
            });
        });
    } else {
        alert('Bitte füllen Sie alle erforderlichen Felder aus.');
    }
}

function viewRecipe(id) {
    fetch('/api/recipes/' + id)
        .then(response => response.json())
        .then(recipe => {
            document.getElementById('navigator').pushPage('recipe-view', {
                data: {
                    id: recipe.id,
                    title: recipe.name,
                    bemerkung: recipe.bemerkung || '',
                    zutaten: recipe.zutaten,
                    zubereitung: recipe.zubereitung
                }
            });
        });
}

function editRecipe() {
    const data = document.getElementById('navigator').topPage.data;
    document.getElementById('navigator').pushPage('add-recipe', {
        data: data
    });
}

function copyRecipe() {
    const data = document.getElementById('navigator').topPage.data;
    if (data) {
        const text = \`Titel: \${ data.title || '' }\\n\\nBemerkung: \${ data.bemerkung || '' }\\n\\nZutaten: \\n\${ data.zutaten || '' }\\n\\nZubereitung: \\n\${ data.zubereitung || '' }\`;
        navigator.clipboard.writeText(text).then(() => {
            ons.notification.toast('Rezept kopiert!', { timeout: 2000 });
        });
    }
}

document.addEventListener('init', function(event) {
    const page = event.target;
    const data = page.data || {};

    // Detect the recipe view by its fields and populate.
    const viewTitle = page.querySelector('#recipe-title');
    if (viewTitle) {
        viewTitle.textContent = data.title || '';
        page.querySelector('#recipe-bemerkung').textContent = data.bemerkung || '';
        page.querySelector('#recipe-zutaten').textContent = data.zutaten || '';
        page.querySelector('#recipe-zubereitung').textContent = data.zubereitung || '';
        return;
    }

    // Detect the add/edit form by its inputs and populate accordingly.
    const titleField = page.querySelector('#recipe-title-input');
    if (titleField) {
        const bemerkungField = page.querySelector('#recipe-bemerkung-input');
        const zutatenField = page.querySelector('#recipe-zutaten-input');
        const zubereitungField = page.querySelector('#recipe-zubereitung-input');
        const heading = page.querySelector('#add-recipe-title');

        if (data.id) {
            heading.textContent = 'Rezept bearbeiten';
            titleField.value = data.title || '';
            bemerkungField.value = data.bemerkung || '';
            zutatenField.value = data.zutaten || '';
            zubereitungField.value = data.zubereitung || '';
        } else {
            heading.textContent = 'Neues Rezept';
            titleField.value = '';
            bemerkungField.value = '';
            zutatenField.value = '';
            zubereitungField.value = '';
        }
    }
});
            `, {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }

        if (url.pathname === '/api/login') {
            if (request.method === 'POST') {
                const { password } = await request.json();
                if (password === env.password) {
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    return new Response(JSON.stringify({ success: false }), { status: 401 });
                }
            }
        }

        if (url.pathname === '/api/recipes') {
            if (request.method === 'GET') {
                const recipes = await env.RECIPES.list();
                const recipeList = [];
                for (const key of recipes.keys) {
                    const recipe = await env.RECIPES.get(key.name);
                    const recipeData = JSON.parse(recipe);
                    recipeData.id = key.name;
                    recipeList.push(recipeData);
                }
                return new Response(JSON.stringify(recipeList), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else if (request.method === 'POST') {
                const recipe = await request.json();
                const id = recipe.id || Date.now().toString();
                recipe.id = id;
                await env.RECIPES.put(id, JSON.stringify(recipe));
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (url.pathname.startsWith('/api/recipes/')) {
            const id = url.pathname.split('/')[3];
            if (request.method === 'GET') {
                const recipe = await env.RECIPES.get(id);
                if (recipe) {
                    const recipeData = JSON.parse(recipe);
                    recipeData.id = id;
                    return new Response(JSON.stringify(recipeData), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    return new Response('Not Found', { status: 404 });
                }
            }
        }

        return new Response('Not Found', { status: 404 });
    }
};