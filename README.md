# recipe-finder

## Store Recipes from Spoonacular

The `recipes.js` script fetches recipes from Spoonacular and saves them to our local SQLite database.

### 1. Create Your `.env` File
Create a `.env` file in the project root and add your Spoonacular API key:

```env
API_KEY=real_apikey
```

### 2. Run the Harvester
Run the script using one of the scripts in package.json. This is because the SQLite database needs to be compiled differently for terminal scripts than for desktop apps. This command switches between them automatically so no other commands are needed.

```bash
npm run harvest
```