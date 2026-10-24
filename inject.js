// Runs in the page's MAIN world (see manifest.json) so it can reach YouTube's player API
// and the real document visibility properties.

window.addEventListener('YTRefined_AutoHD', () => {
    try {
        const player = document.getElementById("movie_player");
        if (player && typeof player.setPlaybackQualityRange === 'function') {
            player.setPlaybackQualityRange('highres', 'highres');
        }
    } catch(e) {
        console.error("[YT Refined] Auto HD Error");
    }
});

(() => {
    let backgroundEnabled = false;

    const hiddenDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    const visibilityDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    const isReallyHidden = () => hiddenDesc.get.call(document);

    // Configurable getters that only override while the feature is on, so turning it off restores YouTube's default behavior.
    Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => backgroundEnabled ? false : isReallyHidden()
    });
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => backgroundEnabled ? 'visible' : visibilityDesc.get.call(document)
    });

    const getVideo = () => document.querySelector('#movie_player video') || document.querySelector('video');

    async function enterPip() {
        const video = getVideo();
        if (!video || video.paused || document.pictureInPictureElement) return;
        try { await video.requestPictureInPicture(); } catch (e) {}
    }

    // Registered once, before YouTube's own listeners. Auto PIP is handled here because
    // stopping the event would otherwise keep it from reaching any other listener.
    window.addEventListener('visibilitychange', (e) => {
        if (!backgroundEnabled) return;
        if (isReallyHidden()) {
            enterPip();
        } else if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
        }
        e.stopImmediatePropagation();
    }, true);

    // Chrome may block requestPictureInPicture without a user gesture. Browsers that support
    // automatic PIP call this handler themselves when the user switches tabs.
    function setAutoPipHandler(enabled) {
        try {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', enabled ? enterPip : null);
        } catch (e) {}
    }

    window.addEventListener('YTRefined_SetBackground', (e) => {
        backgroundEnabled = e.detail === true;
        setAutoPipHandler(backgroundEnabled);
    });
})();
// Himmet Can Umutlu
// https://github.com/himmetcanumutlu
