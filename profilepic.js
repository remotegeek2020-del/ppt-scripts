(function() {
    'use strict';

    const API_URL = "https://script.google.com/macros/s/AKfycbx0yg_PmOFzZPQewQQc0094OVW1jcllGVdbJ0HuNvkNxszvrsYGWcZT4ZTuGQbqMIpG/exec";
    const DROPZONE_ID = 'VwmRzZjEGSC90BsHSqROdropZone';
    const SIDEBAR_ID = 'mHE05yh0ho81ClvEqGEE';

    // 1. Optimized Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #gemini-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.7); display: none; z-index: 100000;
            backdrop-filter: blur(8px); justify-content: center; align-items: center;
            font-family: sans-serif;
        }
        #gemini-card {
            background: #ffffff; width: 450px; border-radius: 12px; 
            padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        #gemini-trigger { 
            cursor: pointer; position: fixed !important;
            display: flex !important; align-items: center; justify-content: center;
            width: 24px !important; height: 24px !important; 
            background: #2563eb !important; color: white !important; 
            border-radius: 5px !important; z-index: 999999 !important;
            font-size: 14px !important; font-weight: bold !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: transform 0.1s;
        }
        #gemini-trigger:hover { transform: scale(1.1); background: #1d4ed8 !important; }
    `;
    document.head.appendChild(style);

    // 2. Setup Overlay
    if (!document.getElementById('gemini-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'gemini-overlay';
        overlay.innerHTML = `
            <div id="gemini-card">
                <div style="font-weight:bold; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">✨ Lead Activity Insights</div>
                <div id="gemini-text" style="color:#334155; line-height:1.5; font-size:14px; margin-bottom:20px;">Loading...</div>
                <button onclick="document.getElementById('gemini-overlay').style.display='none'" style="cursor:pointer; background:#64748b; color:white; border:none; padding:8px 16px; border-radius:4px;">Close</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    async function getInsights(id) {
        const overlay = document.getElementById('gemini-overlay');
        const textBox = document.getElementById('gemini-text');
        overlay.style.display = 'flex';
        textBox.innerHTML = "<i>Analyzing Lead Data...</i>";
        try {
            const res = await fetch(`${API_URL}?id=${id}`);
            const data = await res.json();
            textBox.innerHTML = data.summary || "No insights found for this record.";
        } catch (e) { textBox.innerText = "Connection Error."; }
    }

    const runAllLogic = () => {
        if (!window.location.href.includes('contacts/detail')) {
            const existingBtn = document.getElementById('gemini-trigger');
            if (existingBtn) existingBtn.style.display = 'none';
            return;
        }

        // FIND THE INPUT BOX
        const input = document.querySelector('input[data-testid="contact-first-name"]') || 
                      document.getElementById('contact.first_name');

        if (input) {
            let btn = document.getElementById('gemini-trigger');
            if (!btn) {
                btn = document.createElement('div');
                btn.id = 'gemini-trigger'; 
                btn.innerHTML = '✦';
                document.body.appendChild(btn);
                btn.onclick = () => {
                    const contactId = window.location.href.split('/').pop().split('?')[0];
                    getInsights(contactId);
                };
            }

            // DYNAMIC POSITIONING ENGINE
            const rect = input.getBoundingClientRect();
            if (rect.top > 0) {
                btn.style.display = 'flex';
                // Position it exactly inside the right-hand side of the input box
                btn.style.top = (rect.top + (rect.height / 2) - 12) + "px";
                btn.style.left = (rect.right - 32) + "px";
            } else {
                btn.style.display = 'none';
            }
        }

        // PROFILE PICTURE AUTO-HIDE LOGIC
        const dropZone = document.getElementById(DROPZONE_ID);
        if (dropZone) {
            const hasPhoto = !!document.querySelector(`#${DROPZONE_ID} a[href*="http"]`);
            dropZone.style.display = hasPhoto ? 'none' : 'flex';
            const label = dropZone.previousElementSibling;
            if (label && label.innerText.includes('Profile Picture')) {
                label.style.display = hasPhoto ? 'none' : 'block';
            }
        }
    };

    // Run much faster (100ms) for smooth positioning while scrolling
    setInterval(runAllLogic, 100);
})();
