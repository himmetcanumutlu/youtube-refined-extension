document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('globalToggle');
    const settingsContainer = document.getElementById('settingsContainer');
    const allInputs = settingsContainer.querySelectorAll('input');

    const toggles = {
        dislikesEnabled: document.getElementById('dislikeToggle'),
        shortsEnabled: document.getElementById('shortsToggle'),
        sidebarShortsEnabled: document.getElementById('sidebarShortsToggle'), 
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
        dislikesEnabled: true, 
        shortsEnabled: true, 
        sidebarShortsEnabled: true, 
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

    globalToggle.addEventListener('change', () => {
        const isEnabled = globalToggle.checked;
        applyFreezeEffect(isEnabled);
        updateSetting('globalEnabled', isEnabled);
    });

    Object.keys(toggles).forEach(key => {
        if (toggles[key]) {
            toggles[key].addEventListener('change', () => updateSetting(key, toggles[key].checked));
        }
    });

    Object.keys(sliders).forEach(key => {
        if (sliders[key].el) {
            sliders[key].el.addEventListener('input', () => {
                const val = key === 'customSpeed' ? parseFloat(sliders[key].el.value) : parseInt(sliders[key].el.value);
                sliders[key].val.innerText = sliders[key].format(val);
                updateSetting(key, val);
            });
        }
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

    // Content scripts in every YouTube tab listen to chrome.storage.onChanged.
    function updateSetting(key, value) {
        chrome.storage.local.set({ [key]: value });
    }
});
// Himmet Can Umutlu
// https://github.com/himmetcanumutlu
