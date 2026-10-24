// Switches the toolbar icon between the ON and OFF sets based on the Master Switch.

const ICONS = {
    on:  { 16: 'icons/icon_on_16.png',  32: 'icons/icon_on_32.png',  48: 'icons/icon_on_48.png',  128: 'icons/icon_on_128.png' },
    off: { 16: 'icons/icon_off_16.png', 32: 'icons/icon_off_32.png', 48: 'icons/icon_off_48.png', 128: 'icons/icon_off_128.png' }
};

function updateIcon(enabled) {
    chrome.action.setIcon({ path: enabled ? ICONS.on : ICONS.off });
}

function syncIcon() {
    chrome.storage.local.get({ globalEnabled: true }, (result) => updateIcon(result.globalEnabled !== false));
}

chrome.runtime.onInstalled.addListener(syncIcon);
chrome.runtime.onStartup.addListener(syncIcon);

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'globalEnabled' in changes) updateIcon(changes.globalEnabled.newValue !== false);
});
// Himmet Can Umutlu
// https://github.com/himmetcanumutlu
