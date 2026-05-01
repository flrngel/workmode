//options.js - file to hold the logic of the options saving
//Shrey Ravi / flrngel
//WorkMode 3.0.3 - Regex pattern support + improved domain matching UX

// Default URLs/phrases for display when resetting.
// Plain-text entries (e.g. "reddit.com/") do a case-insensitive substring match.
// Entries wrapped in /…/ (e.g. /^https?:\/\/(www\.)?x\.com\//) are treated as regexes,
// which lets you match an exact domain without accidentally matching similar names.
var displayDefaultBlockedUrls = [
  "facebook.com/",
  "/^https?:\\/\\/(www\\.)?x\\.com\\//",
  "youtube.com/",
  "reddit.com/",
  "pinterest.com/",
  "vimeo.com/",
  "plus.google",
  "tumblr.com/",
  "instagram.com/"
];

// Default URLs/phrases for storage.
// Regex entries keep their original casing; plain-text entries are lowercased.
var storageDefaultBlockedUrls = displayDefaultBlockedUrls.map(processForStorage);

/**
 * Returns true if the entry is a regex pattern (wrapped in /…/).
 * @param {string} pattern
 * @returns {boolean}
 */
function isRegexPattern(pattern) {
  return /^\/(.+)\/([gimsuy]*)$/.test(pattern);
}

/**
 * Normalises regex flags to always include 'i' (case-insensitive).
 * Mirrors the logic in service_worker.js so validation and matching stay in sync.
 * @param {string} flags
 * @returns {string}
 */
function normalizeRegexFlags(flags) {
  const f = flags || '';
  return f.includes('i') ? f : f + 'i';
}

/**
 * Converts a single user-entered line into its storage form.
 * Regex patterns are stored as-is; plain text is lowercased.
 * @param {string} entry
 * @returns {string}
 */
function processForStorage(entry) {
  return isRegexPattern(entry) ? entry : entry.toLowerCase();
}

/**
 * Validates a single pattern entry.
 * @param {string} pattern
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePattern(pattern) {
  const regexMatch = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
  if (regexMatch) {
    try {
      new RegExp(regexMatch[1], normalizeRegexFlags(regexMatch[2]));
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
  return { valid: true };
}

/**
 * Function that saves options to Chrome's localstorage
 */
function save_options() {
  const urlsText = document.getElementById('blockedUrlsTextarea').value;
  const processedUrls = urlsText.split('\n')
                              .map(url => url.trim())
                              .filter(url => url !== '');

  // Validate all entries before saving.
  const errors = [];
  processedUrls.forEach(function(pattern, index) {
    const result = validatePattern(pattern);
    if (!result.valid) {
      errors.push('Line ' + (index + 1) + ': "' + pattern + '" — ' + result.error);
    }
  });

  const status = document.getElementById('status');
  if (errors.length > 0) {
    status.style.color = 'red';
    status.textContent = 'Fix the following errors before saving: ' + errors.join('; ');
    return;
  }

  // Regex entries keep their case; plain-text entries are lowercased.
  const urlsToStore = processedUrls.map(processForStorage);

  chrome.storage.sync.set({
    blockedUrls: urlsToStore,
  }, function() {
    status.style.color = '';
    status.textContent = 'Options saved!';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

/**
 * Restores textarea state using the preferences stored in chrome.storage.
 */
function restore_options() {
  chrome.storage.sync.get({
    blockedUrls: storageDefaultBlockedUrls
  }, function(items) {
    document.getElementById('blockedUrlsTextarea').value = items.blockedUrls.join('\n');
  });
}

/**
 * Resets the options input to a default start state
 */
function reset() {
  document.getElementById('blockedUrlsTextarea').value = displayDefaultBlockedUrls.join('\n');
  save_options();
  var status = document.getElementById('status');
  status.style.color = '';
  status.textContent = 'Options were reset to install configurations.';
  setTimeout(function() {
    status.textContent = '';
  }, 1500);
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