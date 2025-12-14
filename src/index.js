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
                <div class="center">
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
            const list = document.getElementById('recipe-list');
            list.innerHTML = '';
            recipes.forEach(recipe => {
                const item = ons.createElement(\`
                    <ons-list-item modifier="chevron" inset tappable onclick="viewRecipe('\${recipe.id}')">
                        \${recipe.name}
                    </ons-list-item>
                \`);
                list.appendChild(item);
            });
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
        fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, bemerkung, zutaten, zubereitung })
        }).then(() => {
            document.getElementById('navigator').popPage();
            loadRecipes();
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
                    title: recipe.name || recipe.title,
                    bemerkung: recipe.bemerkung || '',
                    zutaten: recipe.zutaten || recipe.ingredients,
                    zubereitung: recipe.zubereitung || recipe.instructions
                }
            });
        });
}

document.addEventListener('init', function(event) {
    if (event.target.data) {
        const data = event.target.data;
        document.getElementById('recipe-title').textContent = data.title;
        document.getElementById('recipe-bemerkung').textContent = data.bemerkung;
        document.getElementById('recipe-zutaten').textContent = data.zutaten;
        document.getElementById('recipe-zubereitung').textContent = data.zubereitung;
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
                const id = Date.now().toString();
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