(function() {
    'use strict';

    const API_URL = "https://script.google.com/macros/s/AKfycbx0yg_PmOFzZPQewQQc0094OVW1jcllGVdbJ0HuNvkNxszvrsYGWcZT4ZTuGQbqMIpG/exec";
    const DROPZONE_ID = 'VwmRzZjEGSC90BsHSqROdropZone';
    const SIDEBAR_ID = 'mHE05yh0ho81ClvEqGEE';

    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #gemini-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.8); display: none; z-index: 100000;
            backdrop-filter: blur(8px); justify-content: center; align-items: center;
            font-family: sans-serif;
        }
        #gemini-card {
            background: #ffffff; width: 450px; border-radius: 12px; 
            padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .ppt-sparkle-container {
            position: absolute !important;
            right: 8px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 10 !important;
            display: flex;
            align-items: center;
        }
        .ppt-sparkle-btn { 
            cursor: pointer;
            width: 24px !important; height: 24px !important; 
            background: #2563eb !important; color: white !important; 
            border-radius: 4px !important; 
            display: flex !important; align-items: center; justify-content: center;
            font-size: 14px !important; border: none !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Setup Overlay
    if (!document.getElementById('gemini-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'gemini-overlay';
        overlay.innerHTML = `
            <div id="gemini-card">
                <div style="font-weight:bold; font-size:18px; margin-bottom:12px;">✨ Lead Insights</div>
                <div id="gemini-text" style="color:#334155; line-height:1.6; font-size:14px; margin-bottom:20px;">Loading...</div>
                <button onclick="document.getElementById('gemini-overlay').style.display='none'" style="cursor:pointer; background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:6px; width:100%;">Close</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    async function getInsights() {
        const contactId = window.location.href.split('/').pop().split('?')[0];
        const overlay = document.getElementById('gemini-overlay');
        const textBox = document.getElementById('gemini-text');
        overlay.style.display = 'flex';
        textBox.innerHTML = "<i>Fetching AI Analysis...</i>";
        try {
            const res = await fetch(`${API_URL}?id=${contactId}`);
            const data = await res.json();
            textBox.innerHTML = data.summary || "No data available.";
        } catch (e) { textBox.innerText = "Error connecting to AI service."; }
    }

    const injectLogic = () => {
        if (!window.location.href.includes('contacts/detail')) return;

        // TARGET: The "First Name" input field
        const input = document.querySelector('input[data-testid="contact-first-name"]') || document.getElementById('contact.first_name');
        
        if (input && !document.getElementById('ppt-sparkle-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.id = 'ppt-sparkle-wrapper';
            wrapper.className = 'ppt-sparkle-container';
            wrapper.innerHTML = `<div class="ppt-sparkle-btn">✦</div>`;
            
            // GHL Structure fix: Add relative positioning to the input's parent
            const parent = input.parentElement;
            parent.style.position = 'relative';
            parent.appendChild(wrapper);
            
            wrapper.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                getInsights();
            };
        }

        // Profile Picture Handler
        const dropZone = document.getElementById(DROPZONE_ID);
        if (dropZone) {
            const photoLink = document.querySelector(`#${DROPZONE_ID} a`);
            const exists = !!(photoLink && photoLink.href && photoLink.href.includes('http'));
            
            // Toggle visibility
            dropZone.style.display = exists ? 'none' : 'flex';
            const label = dropZone.previousElementSibling;
            if (label && label.innerText.includes('Profile Picture')) {
                label.style.display = exists ? 'none' : 'block';
            }
        }
    };

    // Run interval
    setInterval(injectLogic, 1000);
})();
