/**
 * AI Prompt Manager - Background Script
 * Handles initialization and background tasks
 * @author hetao (贺涛)
 * @license CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)
 */

// Load default prompts from config file
async function loadDefaultPrompts() {
  try {
    const response = await fetch(chrome.runtime.getURL('config/prompts.json'));
    const data = await response.json();
    return {
      categories: data.categories || [],
      prompts: data.prompts || []
    };
  } catch (error) {
    console.error('Failed to load prompts.json:', error);
    return { categories: [], prompts: [] };
  }
}

// Load default sites from config file
async function loadDefaultSites() {
  try {
    const response = await fetch(chrome.runtime.getURL('config/sites.json'));
    const data = await response.json();
    return (data.sites || []).map(site => site.domain);
  } catch (error) {
    console.error('Failed to load sites.json:', error);
    return [];
  }
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  const defaultData = await loadDefaultPrompts();
  const defaultSites = await loadDefaultSites();
  
  chrome.storage.local.get(['prompts', 'categories', 'enabledSites'], (result) => {
    // Initialize categories if not set
    if (!result.categories && defaultData.categories.length > 0) {
      chrome.storage.local.set({ categories: defaultData.categories });
    }
    
    // Initialize prompts if not set
    if (!result.prompts && defaultData.prompts.length > 0) {
      chrome.storage.local.set({ prompts: defaultData.prompts });
    }

    // Initialize enabled sites if not set
    if (!result.enabledSites && defaultSites.length > 0) {
      chrome.storage.local.set({ enabledSites: defaultSites });
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reloadConfig') {
    // Allow manual reload of config files
    loadDefaultPrompts().then(data => {
      chrome.storage.local.set({
        categories: data.categories,
        prompts: data.prompts
      });
      sendResponse({ success: true });
    });
    return true;
  }
});
