document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    const globalToggle = document.getElementById('globalToggle');
    const settingsContainer = document.getElementById('settingsContainer');
    const allInputs = settingsContainer.querySelectorAll('input');

    const toggles = {
        dislikesEnabled: document.getElementById('dislikeToggle'),
        shortsEnabled: document.getElementById('shortsToggle'),
        sidebarShortsEnabled: document.getElementById('sidebarShortsToggle'), // <-- Bu eksikti, geri eklendi!
        playablesEnabled: document.getElementById('playablesToggle'),
        focusEnabled: document.getElementById('focusToggle'),
        sponsorEnabled: document.getElementById('sponsorToggle'),
        autoHDEnabled: document.getElementById('autoHDToggle'),
        pipEnabled: document.getElementById('pipToggle')
    };
    
    const sliders = {
        customSpeed: { el: document.getElementById('speedSlider'), val: document.getElementById('speedValue'), format: v => v.toFixed(2) + 'x' },
        volumeLevel: { el: document.getElementById('volumeSlider'), val: document.getElementById('volumeValue'), format: v => v + '%' }
    };

    // Load saved settings from storage and update UI state
    chrome.storage.local.get({
        globalEnabled: true,
        dislikesEnabled: true, 
        shortsEnabled: true, 
        sidebarShortsEnabled: true, // <-- Depolama ayarı geri eklendi!
        playablesEnabled: true, 
        focusEnabled: false, 
        sponsorEnabled: true, 
        autoHDEnabled: true, 
        pipEnabled: false,
        customSpeed: 1.0, 
        volumeLevel: 100
    }, (result) => {
        globalToggle.checked = result.globalEnabled !== false;
        applyFreezeEffect(globalToggle.checked);

        Object.keys(toggles).forEach(key => {
            if (toggles[key]) toggles[key].checked = result[key] !== false;
        });

        Object.keys(sliders).forEach(key => {
            if (sliders[key].el) {
                sliders[key].el.value = result[key] || (key === 'customSpeed' ? 1.0 : 100);
                sliders[key].val.innerText = sliders[key].format(parseFloat(sliders[key].el.value));
            }
        });
    });

    // Attach event listener for the master extension toggle
    globalToggle.addEventListener('change', () => {
        const isEnabled = globalToggle.checked;
        applyFreezeEffect(isEnabled);
        updateSetting('globalEnabled', isEnabled, 'toggle_globalEnabled');
    });

    // Attach event listeners for individual feature toggles
    Object.keys(toggles).forEach(key => {
        if (toggles[key]) {
            toggles[key].addEventListener('change', () => updateSetting(key, toggles[key].checked, `toggle_${key}`));
        }
    });

    // Attach event listeners for range sliders
    Object.keys(sliders).forEach(key => {
        if (sliders[key].el) {
            sliders[key].el.addEventListener('input', () => {
                const val = key === 'customSpeed' ? parseFloat(sliders[key].el.value) : parseInt(sliders[key].el.value);
                sliders[key].val.innerText = sliders[key].format(val);
                updateSetting(key, val, `set_${key}`);
            });
        }
    });

    /**
     * Toggles the interactive state of the settings UI based on global extension status.
     * @param {boolean} isEnabled Whether the extension is globally enabled.
     */
    function applyFreezeEffect(isEnabled) {
        if (isEnabled) {
            settingsContainer.classList.remove('frozen');
            allInputs.forEach(input => input.disabled = false);
        } else {
            settingsContainer.classList.add('frozen');
            allInputs.forEach(input => input.disabled = true);
        }
    }

    /**
     * Saves a setting to local storage and dispatches the update to the active YouTube tab.
     * @param {string} key The storage key.
     * @param {any} value The setting value.
     * @param {string} actionName The action identifier for the message payload.
     */
    function updateSetting(key, value, actionName) {
        chrome.storage.local.set({ [key]: value });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes("youtube.com")) {
                chrome.tabs.sendMessage(tabs[0].id, { action: actionName, state: value }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("[YT Refined] Waiting for page to load or content script is missing.");
                    }
                });
            }
        });
    }
});