//options.js - file to hold the logic of the options saving
//Shrey Ravi
//WorkMode 3.0.2 - Using Chrome Storage API + Custom URL Blocking

// Default URLs/phrases for display when resetting.
const displayDefaultBlockedUrls = [
  "facebook.com/",
  "twitter.com/",
  "youtube.com/",
  "reddit.com/",
  "pinterest.com/",
  "vimeo.com/",
  "plus.google",
  "tumblr.com/",
  "instagram.com/"
];

// Default URLs/phrases for storage (all lowercase).
const storageDefaultBlockedUrls = displayDefaultBlockedUrls.map(url => url.toLowerCase());

/**
 * Function that saves options to Chrome's localstorage
 */
function save_options() {
  const urlsText = document.getElementById('blockedUrlsTextarea').value;
  const processedUrls = urlsText.split('\n')
                              .map(url => url.trim()) // Trim whitespace
                              .filter(url => url !== ''); // Remove empty lines
  
  // Store lowercase versions for case-insensitive matching in service_worker
  const urlsToStore = processedUrls.map(url => url.toLowerCase());

  chrome.storage.sync.set({
    blockedUrls: urlsToStore, // Use new key 'blockedUrls'
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved! Thank you.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000); 
  });
}

/**
 * Restores textarea state using the preferences stored in chrome.storage.
 */
function restore_options() {
  chrome.storage.sync.get({
    blockedUrls: storageDefaultBlockedUrls // Default to lowercase stored defaults if 'blockedUrls' not found
  }, function(items) {
    // items.blockedUrls are expected to be lowercase from storage or from storageDefaultBlockedUrls.
    // Display them in the textarea.
    document.getElementById('blockedUrlsTextarea').value = items.blockedUrls.join('\n');
  });
}

/**
 * Resets the options input to a default start state
 */
function reset() {
  // Populate textarea with display defaults (maintaining original casing for display)
  document.getElementById('blockedUrlsTextarea').value = displayDefaultBlockedUrls.join('\n');
  // Save these default settings (this will also process them: trim, filter, lowercase for storage)
  save_options();
  // Update status to let user know options were saved.
  var status = document.getElementById('status');
  status.textContent = 'Options were reset to install configurations.';
  setTimeout(function() {
    status.textContent = '';
  }, 1500); // Longer duration for reset message
}

/**
 * Once page is loaded, load the localstorage options values
 */
document.addEventListener('DOMContentLoaded', restore_options);

/**
 * If the reset button is properly rendered, attach a listener to activate reset logic
 */
var resetbtn = document.getElementById('reset');
if(resetbtn) {
  resetbtn.addEventListener('click', reset);
}

/**
 * If the save button is properly rendered, attach a listener to activate save logic
 */
var svbtn = document.getElementById('save');
if(svbtn) {
  svbtn.addEventListener('click', save_options);
}