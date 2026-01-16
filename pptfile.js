/* MASTER PPT SCRIPT - NO HTML TAGS ALLOWED */
(function() {
    'use strict';
    
    // 1. Instant Verification (You will see this in the browser console)
    console.log("🚀 PPT MASTER SCRIPT IS INITIALIZING...");

    // --- CONFIGURATION ---
    const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/14591222/uak5wld/';
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5eeQBjYHIM2I8A1NKXsAFNVRV3VzERI2GH-ftTQoDjh34FQ4pJD6cUOEmWeH54W31/exec';
    
    // --- MODULE 1: MEETING SURVEY ---
    function runSurveyLogic() {
        const RECENT_MEETING_SELECTOR = 'input[name="contact.recent_meeting"], #contact\\.recent_meeting input';
        const mid = document.querySelector(RECENT_MEETING_SELECTOR);
        if (mid && mid.value) {
            console.log("Found meeting ID:", mid.value);
            // Survey logic follows here...
        }
    }

    // --- MODULE 2: MERCHANT SEARCH ---
    function injectSearchIcons() {
        const targetFieldIds = ['contact.agent_id_1', 'contact.agent_id_2', 'contact.agent_id_3', 'contact.agent_id_4'];
        targetFieldIds.forEach(id => {
            const wrapper = document.querySelector(`[id="${id}"]`);
            if (wrapper && !wrapper.querySelector('.search-icon-trigger')) {
                const btn = document.createElement('span');
                btn.innerHTML = ' 🔍';
                btn.className = 'search-icon-trigger';
                btn.style.cursor = 'pointer';
                wrapper.appendChild(btn);
            }
        });
    }

    // --- EXECUTION ENGINE ---
    function masterRunner() {
        runSurveyLogic();
        injectSearchIcons();
    }

    // Run on load and whenever the page changes (GHL navigation)
    const observer = new MutationObserver(() => masterRunner());
    observer.observe(document.body, { childList: true, subtree: true });
    
    masterRunner();
    console.log("✅ PPT MASTER SCRIPT LOADED SUCCESSFULLY");
})();
