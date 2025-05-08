// service_worker.js
// Shrey Ravi
// WorkMode 3.0.2 - Using Chrome Storage API + Custom URL Blocking

// Default blocked URLs/phrases. These must be lowercase for matching logic.
const defaultBlockedUrls = [
    "facebook.com/",
    "twitter.com/",
    "youtube.com/",
    "reddit.com/",
    "pinterest.com/",
    "vimeo.com/",
    "plus.google",
    "tumblr.com/",
    "instagram.com/"
  ].map(url => url.toLowerCase()); // Ensure all default items are lowercase

/**
 * Updates the extension action icon globally based on the activation state.
 * @param {boolean} isActivated - True if the extension is active, false otherwise.
 */
function updateIconVisuals(isActivated) {
    const iconPath = isActivated ? "iconon.png" : "icon.png";
    chrome.action.setIcon({
        path: {
            "19": iconPath, // Common size for action icons
            "38": iconPath  // Common size for action icons (as used previously)
        }
    }, () => {
        if (chrome.runtime.lastError) {
            // console.error("Error setting icon:", chrome.runtime.lastError.message);
            // This can happen if the extension context is invalidated (e.g., during uninstall/reload)
        }
    });
}

/**
 * Fetches the 'activated' state from chrome.storage.sync and updates the icon.
 * Initializes 'activated' state to "false" if not already set.
 */
function syncIconWithStorage() {
    chrome.storage.sync.get(['activated'], function(items) {
        let activatedState = items.activated;
        if (activatedState === undefined || activatedState === null) {
            activatedState = "false"; // Default to "false" (inactive)
            chrome.storage.sync.set({ 'activated': activatedState }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error setting default 'activated' state:", chrome.runtime.lastError.message);
                }
                updateIconVisuals(false); // Update icon to inactive
            });
        } else {
            updateIconVisuals(activatedState === "true");
        }
    });
}
 
/**
 * Handles tab updates: if the extension is active, checks if the tab URL
 * matches any blocked patterns and removes the tab if it does.
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Ensure tab.url is present; some updates might not involve a URL change relevant for blocking.
    // Act on 'loading' or 'complete' status to avoid redundant checks if possible,
    // or if specific changeInfo properties indicate a URL navigation.
    if (!tab.url || (changeInfo.status !== 'loading' && changeInfo.status !== 'complete' && !changeInfo.url) ) {
        // If not loading, not complete, and no URL change info, likely not a navigation event we need to act on.
        // However, the original code didn't have this check, so to maintain original blocking frequency:
        // we will check tab.url on most updates.
        // A more refined check: if (changeInfo.status === 'loading' || changeInfo.url)
        if (!tab.url) return;
    }

    chrome.storage.sync.get(['activated', 'blockedUrls'], function(data) {
        const isActivated = data.activated === "true";
        const currentBlockedUrls = data.blockedUrls || defaultBlockedUrls;

        if (isActivated) {
            for (const pattern of currentBlockedUrls) {
                if (tab.url.toLowerCase().indexOf(pattern) !== -1) {
                    chrome.tabs.remove(tabId, () => {
                        if (chrome.runtime.lastError) {
                            // Log error if removal fails (e.g., tab already closed, or no permission - though unlikely here)
                            // console.log('Failed to remove tabId: '+ tabId + '. Error: ' + chrome.runtime.lastError.message);
                        }
                    });
                    return; // Tab matched and removal attempted.
                }
            }
        }
        // Icons are handled globally, no need to setIcon per tab here.
    });
});

/**
 * Handles clicks on the extension action icon.
 * Toggles the 'activated' state and updates the icon globally.
 */
chrome.action.onClicked.addListener(function(tab) { // tab argument is available but not used for global icon
    chrome.storage.sync.get(['activated'], function(items) {
        let currentActivated = items.activated;
        if (currentActivated === undefined || currentActivated === null) {
            currentActivated = "false"; // Default to "false" if not set
        }

        const newActivatedState = (currentActivated === "true") ? "false" : "true";

        chrome.storage.sync.set({ 'activated': newActivatedState }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error setting 'activated' state:", chrome.runtime.lastError.message);
                // If state saving fails, icon might become out of sync.
                // Optionally, revert or re-fetch from storage. For now, proceed to update icon.
            }
            updateIconVisuals(newActivatedState === "true");
        });
    });
});

// Set initial icon state when the extension/service worker starts
syncIconWithStorage();

// Listen for storage changes from other parts of the extension (e.g. options page)
// This is not strictly necessary for the icon toggle from action, but good for robustness
// if other parts of the extension could change the 'activated' state.
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.activated) {
        syncIconWithStorage();
    }
});


// The following listeners ensure the icon state is maintained correctly
// if the service worker becomes inactive and is later reawakened by a tab event.
// They all call syncIconWithStorage to refresh the global icon from storage.

chrome.tabs.onCreated.addListener(function(tab){
    syncIconWithStorage();
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
    syncIconWithStorage();
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    syncIconWithStorage();
});

chrome.tabs.onHighlighted.addListener(function(highlightInfo){
    syncIconWithStorage();
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
    syncIconWithStorage();
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
    syncIconWithStorage();
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    // When a tab is removed, there's no specific tab to update an icon for.
    // Global icon state should remain, syncIcon can be called for consistency
    // but usually not strictly necessary for this event unless it can affect global state.
    syncIconWithStorage();
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId){
    syncIconWithStorage();
});

chrome.tabs.onZoomChange.addListener(function(ZoomChangeInfo){
    syncIconWithStorage();
});

// For completeness, handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Set initial state to "false" (deactivated) explicitly on first install
        chrome.storage.sync.set({ activated: "false", blockedUrls: defaultBlockedUrls }, () => {
            syncIconWithStorage(); 
        });
    } else {
        // For updates or other reasons, just ensure the icon is synced.
        syncIconWithStorage();
    }
});

// Also sync icon on browser startup
chrome.runtime.onStartup.addListener(() => {
    syncIconWithStorage();
});