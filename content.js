class YouTubeEnhancer {
    constructor() {
        this.settings = {};
        this.audioCtx = null;
        this.gainNode = null;

        this.injectMainWorldScript();
        this.setupListeners();
        this.initStates();
    }

    injectMainWorldScript() {
        try {
            if (document.getElementById('yt-refined-inject')) return;
            const script = document.createElement('script');
            script.id = 'yt-refined-inject';
            script.src = chrome.runtime.getURL('inject.js');
            script.onload = function() { this.remove(); };
            (document.head || document.documentElement).appendChild(script);
        } catch(e) {}
    }

    setupListeners() {
        window.addEventListener('yt-navigate-finish', () => this.handleNavigation());
        
        document.addEventListener('ratechange', (e) => {
            if (e.target.tagName === 'VIDEO' && this.settings.globalEnabled && this.settings.customSpeed && e.target.playbackRate !== this.settings.customSpeed) {
                e.target.playbackRate = this.settings.customSpeed;
            }
        }, true);

        document.addEventListener("visibilitychange", async () => {
            if (!this.settings.globalEnabled || !this.settings.pipEnabled) return;
            const video = document.querySelector("video");
            if (!video) return;

            if (document.hidden) {
                if (!video.paused && !document.pictureInPictureElement) {
                    try { await video.requestPictureInPicture(); } catch (e) {}
                }
            } else {
                if (document.pictureInPictureElement) {
                    try { await document.exitPictureInPicture(); } catch (e) {}
                }
            }
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "toggle_globalEnabled") { 
                this.settings.globalEnabled = request.state; 
                this.handleAllFeatures(); 
            }
            else if (request.action === "toggle_dislikesEnabled") { this.settings.dislikesEnabled = request.state; this.handleDislikeUI(); }
            else if (request.action === "toggle_shortsEnabled") { this.settings.shortsEnabled = request.state; this.handleShortsUI(); }
            else if (request.action === "toggle_sidebarShortsEnabled") { this.settings.sidebarShortsEnabled = request.state; this.handleSidebarShortsUI(); }
            else if (request.action === "toggle_playablesEnabled") { this.settings.playablesEnabled = request.state; this.handlePlayablesUI(); }
            else if (request.action === "toggle_focusEnabled") { this.settings.focusEnabled = request.state; this.handleFocusUI(); }
            else if (request.action === "toggle_sponsorEnabled") { this.settings.sponsorEnabled = request.state; this.initSponsorBlock(); }
            else if (request.action === "toggle_autoHDEnabled") { this.settings.autoHDEnabled = request.state; this.applyAutoHD(); }
            else if (request.action === "toggle_pipEnabled") { this.settings.pipEnabled = request.state; this.applyBackgroundPlayForce(); }
            else if (request.action === "set_customSpeed") { this.settings.customSpeed = request.state; this.applySpeed(); }
            else if (request.action === "set_volumeLevel") { this.settings.volumeLevel = request.state; this.applyVolume(); }
            
            sendResponse({status: "ok"});
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
        if(this.settings.globalEnabled) {
            this.applyBackgroundPlayForce();
            this.initSponsorBlock();
        }
    }

    applyBackgroundPlayForce() {
        if (!this.settings.globalEnabled || !this.settings.pipEnabled) return;
        window.dispatchEvent(new CustomEvent('YTRefined_ForceBackground'));
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

    applySpeed() {
        const video = document.querySelector('video');
        if (video) {
            video.playbackRate = this.settings.globalEnabled ? this.settings.customSpeed : 1.0;
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
        if (this.settings.globalEnabled && this.settings.dislikesEnabled) {
            if (!counter) this.initDislikes();
            else counter.style.display = 'inline-block';
        } else if (counter) counter.style.display = 'none';
    }
    
    async initDislikes() {
        if (!window.location.pathname.includes('/watch')) return;
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) return;

        if (videoId === this.currentVideoId && document.getElementById('custom-dislike-counter')) {
            document.getElementById('custom-dislike-counter').style.display = 'inline-block'; return;
        }

        this.currentVideoId = videoId;
        try {
            const res = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
            const data = await res.json();
            
            let num = data.dislikes;
            let formatted = num.toString();
            if (num >= 1000000) formatted = (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            else if (num >= 1000) formatted = (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';

            if (this.dislikeObserver) this.dislikeObserver.disconnect();
            
            this.dislikeObserver = new MutationObserver((mutations, obs) => {
                const container = document.querySelector('ytd-watch-metadata dislike-button-view-model button') || 
                                  document.querySelector('#actions dislike-button-view-model button') ||
                                  document.querySelector('#top-level-buttons-computed dislike-button-view-model button');

                if (container) {
                    if (document.getElementById('custom-dislike-counter')) {
                        obs.disconnect();
                        return;
                    }
                    if (!this.settings.globalEnabled || !this.settings.dislikesEnabled) return;

                    const span = document.createElement('span');
                    span.id = 'custom-dislike-counter';
                    span.innerText = formatted;
                    span.style.cssText = `font-size: 1.4rem; line-height: 2rem; font-weight: 500; font-family: "Roboto", "Arial", sans-serif; margin-left: 6px; margin-right: 6px; color: var(--yt-spec-text-primary); display: inline-block; vertical-align: middle;`;

                    const btnContent = container.querySelector('.yt-spec-button-shape-next__button-text-content');
                    if (btnContent) {
                        btnContent.parentNode.insertBefore(span, btnContent.nextSibling);
                    } else {
                        container.appendChild(span);
                    }
                    
                    obs.disconnect();
                }
            });
            this.dislikeObserver.observe(document.body, { childList: true, subtree: true });
            
        } catch (error) {}
    }
}

new YouTubeEnhancer();
// Himmet Can Umutlu
// https://github.com/himmetcanumutlu
