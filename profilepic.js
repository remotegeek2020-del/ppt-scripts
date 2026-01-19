(function() {
    'use strict';

    const API_URL = "https://script.google.com/macros/s/AKfycbx0yg_PmOFzZPQewQQc0094OVW1jcllGVdbJ0HuNvkNxszvrsYGWcZT4ZTuGQbqMIpG/exec";
    const DROPZONE_ID = 'VwmRzZjEGSC90BsHSqROdropZone';
    const SIDEBAR_ID = 'mHE05yh0ho81ClvEqGEE';

    // 1. Inject Styles with !important to win over GHL styles
    const style = document.createElement('style');
    style.innerHTML = `
        #gemini-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.7); display: none; z-index: 100000;
            backdrop-filter: blur(8px); justify-content: center; align-items: center;
        }
        #gemini-card {
            background: #ffffff; width: 480px; border-radius: 16px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 20px;
        }
        .sparkle-btn { 
            cursor: pointer; position: absolute !important;
            display: flex !important; align-items: center; justify-content: center;
            width: 28px !important; height: 28px !important; 
            background: #2563eb !important; color: white !important; 
            border-radius: 6px !important; z-index: 9999 !important;
            font-size: 16px !important; border: 2px solid white !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Create Overlay if it doesn't exist
    if (!document.getElementById('gemini-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'gemini-overlay';
        overlay.innerHTML = `<div id="gemini-card"><div id="gemini-text">Loading...</div><button onclick="document.getElementById('gemini-overlay').style.display='none'">Close</button></div>`;
        document.body.appendChild(overlay);
    }

    async function getInsights(id) {
        document.getElementById('gemini-overlay').style.display = 'flex';
        document.getElementById('gemini-text').innerText = "Syncing AI...";
        try {
            const res = await fetch(`${API_URL}?id=${id}`);
            const data = await res.json();
            document.getElementById('gemini-text').innerHTML = data.summary || "No data found.";
        } catch (e) { document.getElementById('gemini-text').innerText = "Error connecting."; }
    }

    const runAllLogic = () => {
        if (!window.location.href.includes('contacts/detail')) return;

        // TARGETING FIX:
        const firstNameInput = document.querySelector('input[data-testid="contact-first-name"]') || document.getElementById('contact.first_name');
        
        if (firstNameInput && !document.getElementById('gemini-trigger')) {
            const btn = document.createElement('div');
            btn.id = 'gemini-trigger'; 
            btn.className = 'sparkle-btn'; 
            btn.innerHTML = '✦';
            
            // Append to body so GHL layout doesn't move it
            document.body.appendChild(btn);

            // Re-positioning function
            const updatePos = () => {
                const rect = firstNameInput.getBoundingClientRect();
                btn.style.top = `${rect.top + (rect.height / 2) - 14}px`;
                btn.style.left = `${rect.right - 35}px`;
            };

            window.addEventListener('resize', updatePos);
            setInterval(updatePos, 500); // Keep it attached if they scroll
            updatePos();

            btn.onclick = () => {
                const contactId = window.location.href.split('/').pop().split('?')[0];
                getInsights(contactId);
            };
        }
        
        // Profile Picture Logic (Simplified)
        const dropZone = document.getElementById(DROPZONE_ID);
        if (dropZone) {
            const link = document.querySelector(`#${DROPZONE_ID} a`);
            if (link && link.href) {
                dropZone.style.display = 'none';
                // Add your profile preview logic here
            }
        }
    };

    setInterval(runAllLogic, 1000);
})();
