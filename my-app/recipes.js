const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true });
const dbPath = path.join(__dirname, 'assets', 'starter.db');
const db = new Database(dbPath, {verbose: console.log });

/* API CALL PARAMETERS */
const CUISINE = "chinese";
const BATCH_SIZE = 100; // Max recipes to return in one call (1-100)
const MAX_CALLS = 1; // How many calls to make to api

async function fetchRecipes() {
    console.log("Grabbing recipes");

    db.exec(`
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            ready_in_minutes INTEGER,
            price_per_serving REAL,
            calories REAL,
            protein_g REAL,
            fat_g REAL,
            carbs_g REAL,
            fiber_g REAL,
            sodium_mg REAL,
            is_vegetarian INTEGER,
            is_vegan INTEGER,
            is_gluten_free INTEGER,
            is_dairy_free INTEGER,
            instructions_json TEXT,
            raw_json TEXT,
            cuisines TEXT
        );

        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            name TEXT NOT NULL,
            amount REAL,
            unit TEXT,
            FOREIGN KEY(recipe_id) REFERENCES recipes(id)
        );

        CREATE TABLE IF NOT EXISTS harvest_status (
            cuisine TEXT PRIMARY KEY, 
            last_offset INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_ingredient_name ON ingredients(name);
        CREATE INDEX IF NOT EXISTS idx_ingredient_recipe_id ON ingredients(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_recipe_calories ON recipes(calories);
        CREATE INDEX IF NOT EXISTS idx_recipe_price ON recipes(price_per_serving);
    `);

    // Find where the last batch of recipes left off
    const findOffset = db.prepare('SELECT last_offset FROM harvest_status WHERE cuisine = ?');
    const offsetRow = findOffset.get(CUISINE);
    let currentOffset = offsetRow ? offsetRow.last_offset : 0;

    console.log(`Current offset for ${CUISINE} is ${currentOffset}`);

    const insertRecipe = db.prepare(`
        INSERT OR IGNORE INTO recipes (
            id, title, ready_in_minutes, price_per_serving, calories, protein_g, fat_g, carbs_g, fiber_g, sodium_mg, is_vegetarian, is_vegan, is_gluten_free, is_dairy_free, instructions_json, raw_json, cuisines
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertIngredient = db.prepare(`
        INSERT INTO ingredients (recipe_id, name, amount, unit)
        VALUES (?, ?, ?, ?)
    `)

    const updateOffset = db.prepare(`
        INSERT OR REPLACE INTO harvest_status (cuisine, last_offset)
        VALUES (?, ?)
    `);

    for (let i = 0; i < MAX_CALLS; i++) {
        const url = `https://api.spoonacular.com/recipes/complexSearch?cuisine=${CUISINE}&sort=popularity&sortDirection=desc&number=${BATCH_SIZE}&apiKey=${process.env.API_KEY}&addRecipeInstructions=true&addRecipeNutrition=true&offset=${currentOffset}`;

        try {
            console.log(`Fetch batch ${i + 1} with offset ${currentOffset}`)
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTML Response error: ${response.status}`);
            }
            
            const data = await response.json();

            if(!data.results || data.results.length === 0) {
                console.log(`No more recipes found for ${CUISINE}`);
                break;
            }

            const saveBatch = db.transaction((recipes) => {
                for (const recipe of recipes) {
                    const nut = recipe.nutrition?.nutrients || [];
                    const getNut = (name) => nut.find(n => n.name === name)?.amount || 0;

                    const info = insertRecipe.run(
                        recipe.id,
                        recipe.title,
                        recipe.readyInMinutes || 0,
                        recipe.pricePerServing || 0,
                        getNut('Calories'),
                        getNut('Protein'),
                        getNut('Fat'),
                        getNut('Carbohydrates'),
                        getNut('Fiber'),
                        getNut('Sodium'),
                        recipe.vegetarian ? 1 : 0,
                        recipe.vegan ? 1 : 0,
                        recipe.glutenFree ? 1 : 0,
                        recipe.dairyFree ? 1 : 0,
                        JSON.stringify(recipe.analyzedInstructions || []),
                        JSON.stringify(recipe),
                        JSON.stringify(recipe.cuisines || []),
                    );

                    if (info.changes > 0) {
                        const ingredients = recipe.nutrition?.ingredients || [];
                        for (const ing of ingredients) {
                            insertIngredient.run(recipe.id, ing.name, ing.amount, ing.unit);
                        }
                    } else {
                        console.log(`Skipped recipe because it was previously added: ${recipe.title} (${recipe.id})`);
                    }
                }

                currentOffset += recipes.length;
                updateOffset.run(CUISINE, currentOffset);
            });

            saveBatch(data.results);
            console.log(`Saved batch ${i + 1}, offset updated to ${currentOffset}`);

        } catch (error) {
            console.error("Fetch error: ", error.message);
        }
    }
    console.log("Finished grabbing recipes")
}

fetchRecipes();