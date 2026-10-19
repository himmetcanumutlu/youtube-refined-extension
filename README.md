# 🚀 YT Refined

![Version](https://img.shields.io/badge/version-1.6.4-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**YT Refined** is a powerful, all-in-one Chrome extension designed to purify and supercharge your YouTube experience. It brings advanced media controls, UI decluttering, background playback force, and sponsor skipping into a beautiful, two-column glassmorphism-styled dark UI.

---

## ✨ Features

### 🎛️ Master Control
* **Master Switch (Freeze UI):** Easily disable the entire extension with a single click. The UI smoothly freezes, reverting YouTube back to its default state instantly without needing a page reload.

### 🎬 Media Controls
* **Custom Playback Speed:** Break YouTube's 2x speed limit. Smoothly adjust your playback speed from **0.25x up to 4.0x**.
* **Volume Boost:** Audio too low? Using the Web Audio API (`GainNode`), safely boost any video's volume up to **600%** without severe distortion.
* **Auto Max Quality (Auto HD):** Bypasses YouTube's dynamic resolution scaling. Forces every video to start at the absolute highest available quality automatically.
* **Auto PIP & Background Play:** Tricks YouTube's visibility API to prevent auto-pausing when switching tabs. Automatically enters **Picture-in-Picture (PIP)** mode when you leave the video tab *(Note: Not recommended if you already have YouTube Premium)*.
* **Sponsor Skipper:** Integrated with the community-driven *SponsorBlock API*. Automatically detects and skips embedded sponsor pitches seamlessly.

### 🎨 Appearance & UI
* **Dislike Counter:** Brings back the exact dislike count right next to the like button, powered by the *Return YouTube Dislike API*.
* **Home Shorts Hider:** Automatically removes all Shorts shelves and recommendations from your homepage and search results using lightweight CSS injection.
* **Sidebar Shorts Hider:** Keeps the related videos sidebar clean by hiding mixed-in Shorts recommendations.
* **Playables Hider:** Completely removes the new "YouTube Playables" (instant games) shelves from the homepage, search results, and navigation menus.
* **Focus Mode:** Instantly hide comments and the related videos sidebar to eliminate distractions and focus purely on the content.

---

## 🖥️ User Interface

The extension features a modern, premium **2-Column Grid Layout** that completely eliminates the need for scrolling. Everything you need is visible at a single glance, neatly categorized into *Media Controls* and *Appearance & UI*.

---

## 🛠️ Installation (Developer Mode)

Since this extension is currently not on the Chrome Web Store, you can install it manually in a few easy steps:

1. Download the latest release or clone this repository:
   ```bash
   git clone https://github.com/himmetcanumutlu/youtube-refined-extension.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click on the **Load unpacked** button in the top left.
5. Select the folder where you extracted/cloned the extension (`youtube-refined-extension-main`).
6. Pin the **YT Refined** extension to your toolbar and enjoy a purified YouTube!

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
