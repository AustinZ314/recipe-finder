const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
});

contextBridge.exposeInMainWorld('api', {
    // test endpoints
    getRecipes: (limit = 20) => ipcRenderer.invoke('get-recipes', limit),
    searchRecipes: (keyword) => ipcRenderer.invoke('search-recipes', keyword),

    // temp endpoints (to find good min & max limits for sliders in UI)
    getSliderBounds: () => ipcRenderer.invoke('get-slider-bounds'),

    findRecipes: (filters) => ipcRenderer.invoke('find-recipes', filters),
    getRecipeDetails: (id) => ipcRenderer.invoke('get-recipe-details', id),

});