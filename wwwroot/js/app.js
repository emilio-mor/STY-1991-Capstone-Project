// Overdrive Exchange — minimal JS helpers for Blazor Server

window.fxpulse = {
    // Scroll element into view
    scrollIntoView: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),

    // Auto-dismiss toast after delay
    autoFade: (selector, ms) => {
        const el = document.querySelector(selector);
        if (el) setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .5s'; }, ms);
    }
};
