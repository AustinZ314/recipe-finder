/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

const minButton = document.getElementById('minimize');
const closeButton = document.getElementById('close');

minButton.addEventListener('click', () => {
  console.log("min clicked");
  minButton.disabled = true;
  window.windowControls.minimize();
});

closeButton.addEventListener('click', () => {
  console.log("close clicked");
  closeButton.disabled = true;
  window.windowControls.close();
});

// Array to store your input entries sequentially for later data extraction
let extractedEntries = [];

// Your autocomplete suggestion pool
const autocompleteSuggestions = ["Apples", "Bananas", "Baking Soda", "Flour", "Milk", "Sugar"];

window.addEventListener('DOMContentLoaded', () => {
  // 1. Grab Screen Switching Elements
  const enterAppBtn = document.getElementById('enterAppBtn');
  const welcomePage = document.getElementById('welcomePage');
  const mainPage = document.getElementById('mainPage');

  // 2. Click event to swap screens
  enterAppBtn.addEventListener('click', () => {
    welcomePage.classList.add('hidden'); // Hide the welcome page
    mainPage.classList.remove('hidden'); // Show the kitchen layout page
  });

  // Grab DOM Elements directly from the HTML layout
  const kitchenBtn = document.querySelector('.kitchen-btn');
  const modalOverlay = document.getElementById('modalOverlay');
  const entriesListElement = document.getElementById('entriesList');
  const entryInputField = document.getElementById('entryInput');
  const addEntryBtn = document.getElementById('addEntryBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const datalistElement = document.getElementById('autocompleteOptions');

  // 1. Populate the HTML autocomplete datalist dropdown
  datalistElement.innerHTML = autocompleteSuggestions
    .map(item => `<option value="${item}"></option>`)
    .join('');

  // 2. Mechanics to log, process, and render a new list entry
  function saveAndRenderEntry() {
    const value = entryInputField.value.trim();
    if (value === "") return;

    // Push into data array for easy extraction
    extractedEntries.push(value);

    // Create a physical row inside the scrollable container
    const item = document.createElement('div');
    item.classList.add('entry-item');
    item.textContent = value;
    entriesListElement.appendChild(item);

    // Housekeeping: Clear input and force scroll window to follow new items
    entryInputField.value = "";
    entriesListElement.scrollTop = entriesListElement.scrollHeight;
  }

  // 3. Setup Listeners
  kitchenBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    entryInputField.focus(); // Pulls up cursor focus instantly
  });

  addEntryBtn.addEventListener('click', saveAndRenderEntry);
  
  entryInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveAndRenderEntry();
  });

  // 1. The NEW Cancel Handler: Closes the box silently without doing anything else
  cancelModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    console.log("Modal closed via 'X'. No data was exported.");
  });
  
  closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    
    // YOUR LOGGED ENTRIES ARE WAITING SAFELY IN AN ARRAY HERE:
    console.log("Extracted List Data Pipeline:", extractedEntries);
  });
});


console.log(
  '👋 This message is being logged by "renderer.js", included via webpack',
);