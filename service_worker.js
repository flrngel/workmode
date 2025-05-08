//service_worker.js
//Shrey Ravi
//WorkMode 3.0.2 - Using Chrome Storage API + Custom URL Blocking

const storageCache = { count: 0 };
const initStorageCache = chrome.storage.sync.get().then((items) => {
  Object.assign(storageCache, items);
});

// Default blocked URLs/phrases. These must be lowercase for matching logic.
// This list should ideally be consistent with `storageDefaultBlockedUrls` in options.js.
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
 * Adds Chrome onUpdated listener that senses when to close tabs
 */
chrome.tabs.onUpdated.addListener(function(id, info, tab) {
    chrome.storage.sync.get(['activated'], function(items) {
        var bool = items.activated;
        if(bool.indexOf("true") > -1) {
            chrome.storage.sync.get({
            blockedUrls: defaultBlockedUrls // Use new key 'blockedUrls' and its lowercase defaults
            }, function(items) {
                const currentBlockedUrls = items.blockedUrls; // These are already lowercase from storage/defaults
                for (const pattern of currentBlockedUrls) {
                    // pattern is already lowercase. tab.url is converted to lowercase for matching.
                    if (tab.url.toLowerCase().indexOf(pattern) !== -1) {
                        try {
                            chrome.tabs.remove(id);
                        }
                        catch (e) {
                            // Log error if removal fails (e.g., tab already closed by other means)
                            console.log('Failed to remove tabId: '+ id + ' for URL: ' + tab.url.toLowerCase(), e);
                        }
                        // Tab matched and removal attempted, no need to check other patterns for this tab update.
                        // The setIcon call below will still execute.
                        return; 
                    }
                }
            });
            try {
                chrome.action.setIcon({
                    path: {
                        38: "iconon.png"
                    },
                    tabId: id
                });
            }
            catch {
                // Note: This may be expected if tab is already removed or other edge cases.
            }
        }
        else {
            try {
                chrome.action.setIcon({
                    path: {
                        38: "icon.png"
                    },
                    tabId: id
                });
            }   
            catch {
                // Note: This may be expected if tab is already removed or other edge cases.
            }
        }  
    });
});

/**
 * Adds function that senses when to update extension state to call in listeners
 */
function updateIconState() {
    chrome.storage.sync.get(["activated"], function(items) {
        bool = items.activated;
        if(bool == null) {
            bool = "false";
        }
        if(bool.indexOf("true") > -1) {
            chrome.action.setIcon({
                path: {
                    38: "iconon.png"
                },
            });
            activated = true;
            chrome.storage.sync.set({activated: "true",}, function() {});
        }
        else {
            chrome.action.setIcon({
                path: {
                    38: "icon.png"
                },
            });
            chrome.storage.sync.set({activated: "false",}, function() {});
        }
    });
}

/**
 * Adds Chrome onClicked listener that senses when to update extension state
 * The key difference is this method has tabID: tab.id stored as well in the 
 * chrome.action call
 */
chrome.action.onClicked.addListener(function(tab) {
    chrome.storage.sync.get(['activated'], function(items) {
        bool = items.activated;
        if(bool == null) {
            bool = "false";
        }
        if(bool.indexOf("true") > -1) {
            try {
                chrome.action.setIcon({
                    path: {
                        38: "icon.png"
                    },
                    tabId: tab.id
                });
            }
            catch {
                console.log('Failed to remove tabId: '+ tab.url.toLowerCase());
            }
            chrome.storage.sync.set({'activated': 'false'}, function() {});    
        }
        else {
            try {
                chrome.action.setIcon({
                path: {
                    38: "iconon.png"
                },
                tabId: tab.id
            });
            }
            catch {
                console.log('Failed to remove tabId: '+ tab.url.toLowerCase());
            }
            activated = true;
            chrome.storage.sync.set({'activated': 'true'}, function() {});  
        }
    });
});

//NOTE: Added the below to ensure compatibility will all versions of Google Chrome and ensure proper function in all cases

/**
 * Adds Chrome onCreated listener that senses when to update extension state
 */
chrome.tabs.onCreated.addListener(function(tab){
    updateIconState();
});

/**
 * Adds Chrome onMoved listener that senses when to update extension state
 */
chrome.tabs.onMoved.addListener(function(id, info){
    updateIconState();
});

/**
 * Adds Chrome onActivated listener that senses when to update extension state
 */
chrome.tabs.onActivated.addListener(function(info){
    updateIconState();
});

/**
 * Adds Chrome onHighlighted listener that senses when to update extension state
 */
chrome.tabs.onHighlighted.addListener(function(info){
    updateIconState();
});

/**
 * Adds Chrome onDetached listener that senses when to update extension state
 */
chrome.tabs.onDetached.addListener(function(id){
    updateIconState();
});

/**
 * Adds Chrome onAttached listener that senses when to update extension state
 */
chrome.tabs.onAttached.addListener(function(id, info){
    updateIconState();
});

/**
 * Adds Chrome onRemoved listener that senses when to update extension state
 */
chrome.tabs.onRemoved.addListener(function(id, info){
    updateIconState();
});

/**
 * Adds Chrome onReplaced listener that senses when to update extension state
 */
chrome.tabs.onReplaced.addListener(function(id, removedId){
    updateIconState();
});

/**
 * Adds Chrome onZoomChange listener that senses when to update extension state
 */
chrome.tabs.onZoomChange.addListener(function(info){
    updateIconState();
});