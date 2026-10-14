document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('globalToggle');
    const settingsContainer = document.getElementById('settingsContainer');
    const allInputs = settingsContainer.querySelectorAll('input');

    const toggles = {
        dislikesEnabled: document.getElementById('dislikeToggle'),
        shortsEnabled: document.getElementById('shortsToggle'),
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

    chrome.storage.local.get({
        globalEnabled: true,
        dislikesEnabled: true, shortsEnabled: true, playablesEnabled: true, focusEnabled: false, sponsorEnabled: true, autoHDEnabled: true, pipEnabled: false,
        customSpeed: 1.0, volumeLevel: 100
    }, (result) => {
        globalToggle.checked = result.globalEnabled;
        applyFreezeEffect(result.globalEnabled);

        Object.keys(toggles).forEach(key => toggles[key].checked = result[key]);
        Object.keys(sliders).forEach(key => {
            sliders[key].el.value = result[key];
            sliders[key].val.innerText = sliders[key].format(result[key]);
        });
    });

    globalToggle.addEventListener('change', () => {
        const isEnabled = globalToggle.checked;
        applyFreezeEffect(isEnabled);
        updateSetting('globalEnabled', isEnabled, 'toggle_globalEnabled');
    });

    Object.keys(toggles).forEach(key => {
        toggles[key].addEventListener('change', () => updateSetting(key, toggles[key].checked, `toggle_${key}`));
    });

    Object.keys(sliders).forEach(key => {
        sliders[key].el.addEventListener('input', () => {
            const val = key === 'customSpeed' ? parseFloat(sliders[key].el.value) : parseInt(sliders[key].el.value);
            sliders[key].val.innerText = sliders[key].format(val);
            updateSetting(key, val, `set_${key}`);
        });
    });

    function applyFreezeEffect(isEnabled) {
        if (isEnabled) {
            settingsContainer.classList.remove('frozen');
            allInputs.forEach(input => input.disabled = false);
        } else {
            settingsContainer.classList.add('frozen');
            allInputs.forEach(input => input.disabled = true);
        }
    }

    function updateSetting(key, value, actionName) {
        chrome.storage.local.set({ [key]: value });
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
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