# recipe-finder

## Store Recipes from Spoonacular

The `recipes.js` script fetches recipes from Spoonacular and saves them to our local SQLite database.

### 1. Create Your `.env` File
Create a `.env` file in the project root and add your Spoonacular API key:

```env
API_KEY=real_apikey
```

### 2. Run the Harvester
Run the script using Node's env flag:

```bash
node --env-file=.env recipes.js
```