class YouTubeEnhancer {
    constructor() {
        this.settings = {};
        this.audioCtx = null;
        this.gainNode = null;

        this.setupListeners();
        this.initStates();
    }

    setupListeners() {
        window.addEventListener('yt-navigate-finish', () => this.handleNavigation());
        
        // A speed change right after a click or key press comes from the user (YouTube menu, Shift + > / <),
        // so it is respected for the current video. Any other change is YouTube resetting the speed.
        const markUserInput = () => { this.lastUserInput = Date.now(); };
        document.addEventListener('pointerdown', markUserInput, true);
        document.addEventListener('keydown', markUserInput, true);

        document.addEventListener('ratechange', (e) => {
            if (e.target.tagName !== 'VIDEO' || !this.isCustomSpeedActive() || this.userSpeedOverride) return;
            if (e.target.playbackRate === this.settings.customSpeed) return;
            if (Date.now() - (this.lastUserInput || 0) < 1000) this.userSpeedOverride = true;
            else e.target.playbackRate = this.settings.customSpeed;
        }, true);

        // Storage is the single source of truth, so every open YouTube tab stays in sync.
        const handlers = {
            globalEnabled: () => this.handleAllFeatures(),
            dislikesEnabled: () => this.handleDislikeUI(),
            shortsEnabled: () => this.handleShortsUI(),
            sidebarShortsEnabled: () => this.handleSidebarShortsUI(),
            playablesEnabled: () => this.handlePlayablesUI(),
            focusEnabled: () => this.handleFocusUI(),
            sponsorEnabled: () => this.initSponsorBlock(),
            autoHDEnabled: () => this.applyAutoHD(),
            pipEnabled: () => this.applyBackgroundPlayForce(),
            customSpeed: () => { this.userSpeedOverride = false; this.applySpeed(); },
            volumeLevel: () => this.applyVolume()
        };

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;
            Object.keys(changes).forEach(key => {
                if (!(key in handlers)) return;
                this.settings[key] = changes[key].newValue;
                handlers[key]();
            });
        });
    }

    initStates() {
        chrome.storage.local.get({
            globalEnabled: true,
            dislikesEnabled: true, shortsEnabled: true, sidebarShortsEnabled: true, playablesEnabled: true, focusEnabled: false, sponsorEnabled: true, autoHDEnabled: true, pipEnabled: false,
            customSpeed: 1.0, volumeLevel: 100
        }, (result) => {
            this.settings = result;
            this.handleNavigation();
            this.handleAllFeatures();
        });
    }

    handleNavigation() {
        this.userSpeedOverride = false;
        if (!this.settings.globalEnabled) return;
        if (this.settings.dislikesEnabled) this.initDislikes();
        if (this.settings.sponsorEnabled) this.initSponsorBlock();
        
        setTimeout(() => {
            this.applySpeed();
            this.applyVolume();
            this.applyAutoHD();
        }, 800);
    }

    handleAllFeatures() {
        this.handleShortsUI();
        this.handleSidebarShortsUI();
        this.handlePlayablesUI();
        this.handleFocusUI();
        this.handleDislikeUI();
        this.applySpeed();
        this.applyVolume();
        this.applyBackgroundPlayForce();
        if (this.settings.globalEnabled) this.initSponsorBlock();
    }

    applyBackgroundPlayForce() {
        const enabled = !!(this.settings.globalEnabled && this.settings.pipEnabled);
        window.dispatchEvent(new CustomEvent('YTRefined_SetBackground', { detail: enabled }));
    }

    applyAutoHD() {
        if (!this.settings.globalEnabled || !this.settings.autoHDEnabled || !window.location.pathname.includes('/watch')) return;
        const video = document.querySelector('video');
        if (video && !video.dataset.autoHdConnected) {
            video.addEventListener('loadedmetadata', () => { 
                if (this.settings.globalEnabled && this.settings.autoHDEnabled) {
                    window.dispatchEvent(new CustomEvent('YTRefined_AutoHD'));
                }
            });
            video.dataset.autoHdConnected = "true";
        }
        window.dispatchEvent(new CustomEvent('YTRefined_AutoHD'));
    }

    isCustomSpeedActive() {
        return this.settings.globalEnabled && !!this.settings.customSpeed && this.settings.customSpeed !== 1.0;
    }

    applySpeed() {
        const video = document.querySelector('video');
        if (!video) return;
        if (this.isCustomSpeedActive()) {
            if (!this.userSpeedOverride) video.playbackRate = this.settings.customSpeed;
            this.speedApplied = true;
        } else if (this.speedApplied) {
            // Only undo a speed the extension set itself; otherwise leave YouTube's own speed alone.
            video.playbackRate = 1.0;
            this.speedApplied = false;
        }
    }

    applyVolume() {
        const video = document.querySelector('video');
        if (!video) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioCtx.createGain();
            this.gainNode.connect(this.audioCtx.destination);
        }
        if (!video.dataset.audioBoostConnected) {
            try {
                this.audioSource = this.audioCtx.createMediaElementSource(video);
                this.audioSource.connect(this.gainNode);
                video.dataset.audioBoostConnected = "true";
            } catch (e) {}
        }
        if (this.gainNode) {
            this.gainNode.gain.value = this.settings.globalEnabled ? (this.settings.volumeLevel / 100) : 1.0;
        }
    }

    handleFocusUI() {
        if (this.settings.globalEnabled && this.settings.focusEnabled) {
            this.injectCSS('yt-focus-mode', `
                ytd-watch-flexy #comments,
                ytd-watch-flexy #related,
                ytd-watch-flexy:not([playlist]) #secondary {
                    display: none !important;
                }
            `);
        } else {
            this.removeCSS('yt-focus-mode');
        }
    }

    handleShortsUI() {
        if (this.settings.globalEnabled && this.settings.shortsEnabled) {
            this.injectCSS('yt-shorts-hider', `
                ytd-rich-shelf-renderer[is-shorts], 
                ytd-rich-item-renderer:has(a[href*="/shorts/"]),
                ytd-mini-guide-entry-renderer[aria-label="Shorts"], 
                ytd-guide-entry-renderer:has(a[title="Shorts"]) { 
                    display: none !important; 
                }
            `);
        } else {
            this.removeCSS('yt-shorts-hider');
        }
    }

    handleSidebarShortsUI() {
        if (this.settings.globalEnabled && this.settings.sidebarShortsEnabled) {
            this.injectCSS('yt-sidebar-shorts-hider', `
                #related ytd-reel-shelf-renderer,
                #related ytd-compact-video-renderer:has(a[href*="/shorts/"]) { 
                    display: none !important; 
                }
            `);
        } else {
            this.removeCSS('yt-sidebar-shorts-hider');
        }
    }

    handlePlayablesUI() {
        if (this.settings.globalEnabled && this.settings.playablesEnabled) {
            this.injectCSS('yt-playables-hider', `
                ytd-rich-section-renderer:has(a[href*="/playables"]),
                ytd-item-section-renderer:has(a[href*="/playables"]),
                ytd-shelf-renderer:has(a[href*="/playables"]),
                ytd-horizontal-card-list-renderer:has(a[href*="/playables"]),
                ytd-guide-entry-renderer:has(a[href*="/playables"]),
                ytd-mini-guide-entry-renderer:has(a[href*="/playables"]),
                ytd-mini-guide-entry-renderer[aria-label*="Playables"] { 
                    display: none !important; 
                }
            `);
        } else {
            this.removeCSS('yt-playables-hider');
        }
    }

    injectCSS(id, cssRules) {
        if (document.getElementById(id)) return;
        const style = document.createElement('style'); style.id = id;
        style.innerHTML = cssRules;
        document.head.appendChild(style);
    }
    
    removeCSS(id) {
        const style = document.getElementById(id); if (style) style.remove();
    }

    async initSponsorBlock() {
        if (!this.settings.globalEnabled || !window.location.pathname.includes('/watch') || !this.settings.sponsorEnabled) return;
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) return;

        if (this.currentSponsorVideoId !== videoId) {
            this.currentSponsorVideoId = videoId;
            try {
                const res = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["sponsor"]`);
                if (res.ok) {
                    const data = await res.json();
                    this.sponsorSegments = data.map(item => item.segment);
                } else this.sponsorSegments = [];
            } catch (e) { this.sponsorSegments = []; }
        }

        const video = document.querySelector('video');
        if (!video) return setTimeout(() => this.initSponsorBlock(), 1000);

        if (this.onTimeUpdateListener) video.removeEventListener('timeupdate', this.onTimeUpdateListener);
        
        this.onTimeUpdateListener = () => {
            if (!this.settings.globalEnabled || !this.settings.sponsorEnabled || !this.sponsorSegments || this.sponsorSegments.length === 0) return;
            const currentTime = video.currentTime;
            for (let i = 0; i < this.sponsorSegments.length; i++) {
                const [start, end] = this.sponsorSegments[i];
                if (currentTime >= start && currentTime < end) {
                    video.currentTime = end;
                    break;
                }
            }
        };
        video.addEventListener('timeupdate', this.onTimeUpdateListener);
    }

    handleDislikeUI() {
        const counter = document.getElementById('custom-dislike-counter');
        if (this.settings.globalEnabled && this.settings.dislikesEnabled) this.initDislikes();
        else if (counter) counter.style.display = 'none';
    }

    getDislikeButton() {
        return document.querySelector('ytd-watch-metadata dislike-button-view-model button') ||
               document.querySelector('#actions dislike-button-view-model button') ||
               document.querySelector('#top-level-buttons-computed dislike-button-view-model button');
    }

    async initDislikes() {
        if (!window.location.pathname.includes('/watch')) return;
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) return;

        // YouTube reuses the dislike button between videos, so a counter from the previous video may still be there.
        const existing = document.getElementById('custom-dislike-counter');
        if (existing && existing.dataset.videoId !== videoId) existing.remove();

        this.currentVideoId = videoId;
        if (this.dislikeData && this.dislikeData.videoId === videoId) return this.renderDislikes();
        if (this.pendingDislikeVideoId === videoId) return;

        this.pendingDislikeVideoId = videoId;
        try {
            const res = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
            const data = await res.json();
            if (typeof data.dislikes !== 'number') return;

            let num = data.dislikes;
            let formatted = num.toString();
            if (num >= 1000000) formatted = (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            else if (num >= 1000) formatted = (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';

            this.dislikeData = { videoId, formatted };
            if (this.currentVideoId === videoId) this.renderDislikes();
        } catch (error) {
        } finally {
            if (this.pendingDislikeVideoId === videoId) this.pendingDislikeVideoId = null;
        }
    }

    renderDislikes() {
        if (this.dislikeObserver) this.dislikeObserver.disconnect();

        const render = () => {
            const data = this.dislikeData;
            if (!data || data.videoId !== this.currentVideoId) return true;
            const container = this.getDislikeButton();
            if (!container) return false;
            if (!this.settings.globalEnabled || !this.settings.dislikesEnabled) return true;

            let span = document.getElementById('custom-dislike-counter');
            if (!span) {
                span = document.createElement('span');
                span.id = 'custom-dislike-counter';
                span.style.cssText = `font-size: 1.4rem; line-height: 2rem; font-weight: 500; font-family: "Roboto", "Arial", sans-serif; margin-left: 6px; margin-right: 6px; color: var(--yt-spec-text-primary); display: inline-block; vertical-align: middle;`;

                const btnContent = container.querySelector('.yt-spec-button-shape-next__button-text-content');
                if (btnContent) {
                    btnContent.parentNode.insertBefore(span, btnContent.nextSibling);
                } else {
                    container.appendChild(span);
                }
            }
            span.dataset.videoId = data.videoId;
            span.innerText = data.formatted;
            span.style.display = 'inline-block';
            return true;
        };

        if (render()) return;
        this.dislikeObserver = new MutationObserver((mutations, obs) => {
            if (render()) obs.disconnect();
        });
        this.dislikeObserver.observe(document.body, { childList: true, subtree: true });
    }
}

new YouTubeEnhancer();
// Himmet Can Umutlu
// https://github.com/himmetcanumutlu
