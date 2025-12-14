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
    <link rel="stylesheet" href="https://unpkg.com/onsenui/css/onsen-css-components.min.css">
    <script src="https://unpkg.com/onsenui/js/onsenui.min.js"></script>
    <link rel="manifest" href="/manifest.json">    <style>
        body { font-size: 18px; }
        .card__title, .toolbar__title { font-size: 20px; }
        .list-item__title { font-size: 18px; }
    </style></head>
<body>
    <ons-navigator id="navigator">
        <ons-page id="home">
            <ons-toolbar>
                <div class="center">Pascals Rezepte</div>
            </ons-toolbar>
            <ons-list id="recipe-list">
                <!-- Recipes will be loaded here -->
            </ons-list>
            <ons-fab position="bottom right" onclick="addRecipe()">
                <ons-icon icon="md-plus"></ons-icon>
            </ons-fab>
        </ons-page>
    </ons-navigator>

    <template id="recipe-view">
        <ons-page>
            <ons-toolbar>
                <div class="left">
                    <ons-back-button>Zurück</ons-back-button>
                </div>
                <div class="center">Pascals Rezepte</div>
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
    loadRecipes();
});

function loadRecipes() {
    fetch('/api/recipes')
        .then(response => response.json())
        .then(recipes => {
            const list = document.getElementById('recipe-list');
            list.innerHTML = '';
            recipes.forEach(recipe => {
                const item = ons.createElement(\`
                    <ons-list-item modifier="chevron" tappable onclick="viewRecipe('\${recipe.id}')">
                        \${recipe.name}
                    </ons-list-item>
                \`);
                list.appendChild(item);
            });
        });
}

function addRecipe() {
    const name = prompt('Enter recipe name');
    const zutaten = prompt('Enter zutaten');
    const zubereitung = prompt('Enter zubereitung');
    const bemerkung = prompt('Enter bemerkung');
    if (name && zutaten && zubereitung) {
        fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, zutaten, zubereitung, bemerkung })
        }).then(() => loadRecipes());
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