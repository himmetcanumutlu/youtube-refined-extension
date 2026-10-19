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

window.addEventListener('YTRefined_ForceBackground', () => {
    try {
        Object.defineProperty(document, 'hidden', {value: false, writable: false});
        Object.defineProperty(document, 'visibilityState', {value: 'visible', writable: false});
        window.addEventListener('visibilitychange', e => e.stopImmediatePropagation(), true);
    } catch(e) {}
});
// Himmet Can Umutlu
// https://github.com/himmetcanumutlu
