<p align="center">
  <img src="icons/icon_on_128.png" alt="YT Refined logo" width="96">
</p>

# 🚀 YT Refined

![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)
![Chrome](https://img.shields.io/badge/chrome-111%2B-yellow.svg)

**YT Refined** is a powerful, all-in-one Chrome extension designed to purify and supercharge your YouTube experience. It brings advanced media controls, UI decluttering, background playback force, and sponsor skipping into a beautiful, two-column glassmorphism-styled dark UI.

---

## ✨ Features

### 🎛️ Master Control
* **Master Switch (Freeze UI):** Easily disable the entire extension with a single click. The UI smoothly freezes, reverting YouTube back to its default state instantly without needing a page reload.
* **Live Sync Across Tabs:** Every change you make in the popup is applied instantly to **all** open YouTube tabs.
* **Dynamic Toolbar Icon:** The toolbar icon shows a green toggle while the extension is active and turns grey when it is disabled.

### 🎬 Media Controls
* **Custom Playback Speed:** Break YouTube's 2x speed limit. Smoothly adjust your playback speed from **0.25x up to 4.0x**. YouTube's own speed menu and keyboard shortcuts (`Shift + >` / `Shift + <`) keep working for the current video.
* **Volume Boost:** Audio too low? Using the Web Audio API (`GainNode`), safely boost any video's volume up to **600%** without severe distortion.
* **Auto Max Quality (Auto HD):** Bypasses YouTube's dynamic resolution scaling. Forces every video to start at the absolute highest available quality automatically.
* **Auto PIP & Background Play:** Tricks YouTube's visibility API to prevent auto-pausing when switching tabs, and tries to enter **Picture-in-Picture (PIP)** mode when you leave the video tab. Turning it off restores YouTube's default behavior instantly *(Note: Not recommended if you already have YouTube Premium)*.
* **Sponsor Skipper:** Integrated with the community-driven *SponsorBlock API*. Automatically detects and skips embedded sponsor pitches seamlessly.

### 🎨 Appearance & UI
* **Dislike Counter:** Brings back the exact dislike count right next to the like button, powered by the *Return YouTube Dislike API*.
* **Home Shorts Hider:** Automatically removes all Shorts shelves and recommendations from your homepage and search results using lightweight CSS injection.
* **Sidebar Shorts Hider:** Keeps the related videos sidebar clean by hiding mixed-in Shorts recommendations.
* **Playables Hider:** Completely removes the new "YouTube Playables" (instant games) shelves from the homepage, search results, and navigation menus.
* **Focus Mode:** Instantly hide comments and related videos on the watch page to eliminate distractions. If you are watching a playlist, the playlist panel stays visible.

> ℹ️ YT Refined only runs on `www.youtube.com`. YouTube Music, YouTube Studio and other YouTube subdomains are not affected.

---

## 🖥️ User Interface

The extension features a modern, premium **2-Column Grid Layout** that completely eliminates the need for scrolling. Everything you need is visible at a single glance, neatly categorized into *Media Controls* and *Appearance & UI*.

### 📸 Screenshots

| Toolbar icon (enabled) | Toolbar icon (disabled) |
|:---:|:---:|
| <img src="icons/icon_on_128.png" width="64" alt="Enabled icon"> | <img src="icons/icon_off_128.png" width="64" alt="Disabled icon"> |

<!--
  Popup and in-page screenshots will be added here. Expected files:
  docs/screenshots/popup.png        - Settings popup (2-column layout)
  docs/screenshots/popup-frozen.png - Popup with the Master Switch off
  docs/screenshots/dislikes.png     - Dislike counter next to the like button
  docs/screenshots/focus-mode.png   - Watch page with Focus Mode enabled
-->

---

## 🛠️ Installation (Developer Mode)

Since this extension is currently not on the Chrome Web Store, you can install it manually in Developer Mode.

### ✅ Requirements
* **Google Chrome 111 or newer**, or any Chromium-based browser such as **Microsoft Edge**, **Brave**, **Opera** or **Vivaldi**.
* You can check your version at `chrome://settings/help`.

### 1️⃣ Get the Files

**Option A: Clone with Git (recommended, easier to update)**
```bash
git clone https://github.com/himmetcanumutlu/youtube-refined-extension.git
```

**Option B: Download as ZIP**
1. Open the [repository page](https://github.com/himmetcanumutlu/youtube-refined-extension).
2. Click the green **Code** button, then **Download ZIP**.
3. Extract the ZIP file to a permanent location (e.g. `Documents/Extensions`).

> ⚠️ Do not delete or move this folder after installing. The browser loads the extension directly from it.

> ⚠️ Extracting a ZIP sometimes creates a nested folder such as `youtube-refined-extension-main/youtube-refined-extension-main`. Make sure you select the folder that **directly contains `manifest.json`**.

### 2️⃣ Load the Extension
1. Open your browser's extensions page:
   * **Chrome / Brave / Opera / Vivaldi:** `chrome://extensions/`
   * **Microsoft Edge:** `edge://extensions/`
2. Enable **Developer mode** using the toggle (top right in Chrome, left sidebar in Edge).
3. Click the **Load unpacked** button.
4. Select the extension folder (the one containing `manifest.json`).
5. **YT Refined** now appears in your extensions list with its red logo.

### 3️⃣ Pin and Use
1. Click the 🧩 puzzle icon in the browser toolbar.
2. Click the 📌 pin icon next to **YT Refined** to keep it visible.
3. Open or **refresh** any YouTube tab. Tabs that were already open before installation need a refresh once.
4. Click the YT Refined icon to open the settings popup and toggle features.

### 🔄 Updating
1. Get the latest files:
   * **Git:** run `git pull` inside the extension folder.
   * **ZIP:** download the new ZIP and replace the old files in the same folder.
2. Go to `chrome://extensions/` and click the **⟳ Reload** icon on the YT Refined card.
3. Refresh your open YouTube tabs.

Your settings are kept after updating.

### 🗑️ Uninstalling
Go to `chrome://extensions/`, click **Remove** on the YT Refined card, then delete the extension folder.

### 🧯 Troubleshooting
| Problem | Solution |
|---|---|
| **"Manifest file is missing or unreadable"** | You selected the wrong folder. Select the folder that directly contains `manifest.json`. |
| **Features do nothing on YouTube** | Refresh the YouTube tab. Also make sure the Master Switch in the popup is on (the toolbar icon should show a green toggle). |
| **Errors button appears on the extension card** | Make sure your browser is version 111 or newer, then click **⟳ Reload** on the extension card. |
| **Auto PIP does not open** | Chrome can block Picture-in-Picture that starts without a click. Background play still works. In newer Chrome versions, allow automatic Picture-in-Picture for YouTube in the site settings. |
| **Speed resets after changing it from the YouTube menu** | Your choice applies to the current video. The next video starts at the speed set in the popup. Set the popup speed to `1.00x` to fully use YouTube's own speed control. |

---

## 📁 Project Structure

```
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Service worker: switches the toolbar icon
├── content.js                 # Main feature logic (runs on www.youtube.com)
├── inject.js                  # Runs in the page context: Auto HD, background play, PIP
├── popup.html / popup.js      # Settings popup
├── icons/                     # ON / OFF icon sets (16, 32, 48, 128 px)
└── scripts/generate-icons.js  # Regenerates the icons: node scripts/generate-icons.js
```

---

## 🤝 Support & Contribute

If you like **YT Refined** and find it useful, please consider giving this repository a ⭐️ **Star**! It helps the project grow and keeps me motivated to add new features.

Feel free to open issues, report bugs, or submit pull requests if you want to contribute to the codebase.

---

## 👤 Author

Developed with 💻 and ☕ by **[Himmet Can Umutlu](https://github.com/himmetcanumutlu)**. 

Check out my GitHub profile for more projects on AI, Cybersecurity, and Software Engineering.

---

## 📜 License

This project is open-source and distributed under the **[MIT License](LICENSE)**. See the `LICENSE` file for more details.
