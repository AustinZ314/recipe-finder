import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import Database from 'better-sqlite3';

const dbPath = path.join(app.getAppPath(), 'assets', 'starter.db');
const db = new Database(dbPath, { verbose: console.log });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });
};

ipcMain.handle('get-recipes', (event, limit) => {
  const stmt = db.prepare(`
    SELECT id, title, ready_in_minutes, calories, price_per_serving
    FROM recipes
    LIMIT ?
  `);
  return stmt.all(limit);
})

ipcMain.handle('search-recipes', (event, keyword) => {
  const searchTerm = `%${keyword}%`;
  const stmt = db.prepare(`
    SELECT id, title, ready_in_minutes, calories, price_per_serving, cuisines
    FROM recipes
    WHERE title LIKE ? OR cuisines LIKE ?
    LIMIT 30
  `);
  return stmt.all(searchTerm, searchTerm);
});

ipcMain.handle('get-recipe-details', (event, recipeId) => {
  const recipeStmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
  const ingredientStmt = db.prepare('SELECT name, amount, unit FROM ingredients WHERE recipe_id = ?');

  const recipe = recipeStmt.get(recipeId);
  if (!recipe) return null;

  recipe.ingredients = ingredientStmt.all(recipeId);

  try {
    recipe.instructions = JSON.parse(recipe.instructions_json || '[]');
  } catch (e) {
    recipe.instructions = [];
  }

  return recipe;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.