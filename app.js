document.addEventListener('DOMContentLoaded', function () {
    loadRecipes();
});

function loadRecipes() {
    fetch('/api/recipes')
        .then(response => response.json())
        .then(recipes => {
            const list = document.getElementById('recipe-list');
            list.innerHTML = '';
            recipes.forEach(recipe => {
                const item = ons.createElement(`
                    <ons-list-item tappable onclick="viewRecipe('${recipe.id}')">
                        ${recipe.name}
                    </ons-list-item>
                `);
                list.appendChild(item);
            });
        });
}

function addRecipe() {
    // For simplicity, use prompt, but ideally a form
    const title = prompt('Enter recipe title');
    const ingredients = prompt('Enter ingredients');
    const instructions = prompt('Enter instructions');
    if (title && ingredients && instructions) {
        fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, ingredients, instructions })
        }).then(() => loadRecipes());
    }
}

function viewRecipe(id) {
    // Navigate to recipe page, but for now, alert
    alert('View recipe ' + id);
}