/**
 * GHL Custom Integration: Lead Insights & Profile Picture Handler
 * Version: 2.1 - Absolute Positioning Fix
 */

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const API_URL = "https://script.google.com/macros/s/AKfycbx0yg_PmOFzZPQewQQc0094OVW1jcllGVdbJ0HuNvkNxszvrsYGWcZT4ZTuGQbqMIpG/exec";
    const DROPZONE_ID = 'VwmRzZjEGSC90BsHSqROdropZone';
    const SIDEBAR_ID = 'mHE05yh0ho81ClvEqGEE';
    const PREVIEW_ID = 'ghl-profile-preview';
    const MODAL_ID = 'ghl-image-modal';

    // --- STYLES INJECTION ---
    const style = document.createElement('style');
    style.innerHTML = `
        #gemini-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.7); display: none; z-index: 100000;
            backdrop-filter: blur(8px); justify-content: center; align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #gemini-card {
            background: #ffffff; width: 480px; border-radius: 16px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-height: 90vh; overflow-y: auto; animation: geminiSlideUp 0.3s ease-out;
        }
        @keyframes geminiSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .gemini-banner { background: #f8fafc; padding: 18px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .gemini-body { padding: 24px; color: #334155; line-height: 1.6; font-size: 15px; }
        .asset-label { font-weight: 700; color: #2563eb; font-size: 11px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .img-container { width: 100%; background: #f1f5f9; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; min-height: 100px; display: flex; align-items: center; justify-content: center; }
        .creative-img { width: 100%; height: auto; display: block; }
        .sparkle-btn { 
            cursor: pointer; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            width: 26px; 
            height: 26px; 
            background: #2563eb; 
            color: white; 
            border-radius: 6px; 
            font-size: 14px;
            transition: transform 0.2s ease;
        }
        .sparkle-btn:hover { transform: scale(1.1); background: #1d4ed8; }
        .close-btn { cursor: pointer; font-size: 24px; color: #94a3b8; line-height: 1; }
    `;
    document.head.appendChild(style);

    // --- UI ELEMENTS SETUP ---
    if (!document.getElementById('gemini-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'gemini-overlay';
        overlay.innerHTML = `
            <div id="gemini-card">
                <div class="gemini-banner"><div style="font-weight:600;">✨ Lead Activity Insights</div><div class="close-btn" id="close-gemini">×</div></div>
                <div class="gemini-body" id="gemini-text">Loading...</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'close-gemini' || e.target.id === 'gemini-overlay') {
                overlay.style.display = 'none';
            }
        });
    }

    // --- UTILITIES ---
    function getDirectImgLink(url) {
        if (!url || !url.includes('drive.google.com')) return url;
        let fileId = "";
        if (url.includes('/d/')) {
            fileId = url.split('/d/')[1].split('/')[0];
        } else if (url.includes('id=')) {
            fileId = url.split('id=')[1].split('&')[0];
        }
        // Fixed template literal for GitHub compatibility
        return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
    }

    async function getInsights(id) {
        const overlay = document.getElementById('gemini-overlay');
        const textBox = document.getElementById('gemini-text');
        overlay.style.display = 'flex';
        textBox.innerHTML = "<i>Syncing with PayProTec AI...</i>";
        try {
            const res = await fetch(`${API_URL}?id=${id}`);
            const data = await res.json();
            if (data.status === "success") {
                let html = `<div>${data.summary}</div>`;
                if (data.creativeUrl && data.creativeUrl !== "N/A") {
                    const directUrl = getDirectImgLink(data.creativeUrl);
                    html += `<div class="asset-label">Here's the asset from the ads:</div>
                             <div class="img-container">
                                <img src="${directUrl}" class="creative-img" onerror="this.parentElement.innerHTML='<p style=\\'padding:20px;font-size:12px;color:#94a3b8;\\'>⚠️ Image cannot load. Check if Drive permissions are set to \\"Anyone with the link\\".</p>';">
                             </div>`;
                }
                textBox.innerHTML = html;
            } else { textBox.innerHTML = "No record found for this lead."; }
        } catch (err) { textBox.innerHTML = "Connection Error."; }
    }

    function renderPreview(url) {
        const sidebar = document.getElementById(SIDEBAR_ID);
        if (!sidebar) return;
        let container = document.getElementById(PREVIEW_ID);

        if (!container) {
            container = document.createElement('div');
            container.id = PREVIEW_ID;
            container.style.cssText = 'display: flex; justify-content: center; width: 100%; padding: 20px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 15px;';
            sidebar.prepend(container);
        }

        if (container.dataset.url !== url) {
            container.innerHTML = `
                <div style="position: relative;">
                    <img src="${url}" id="clickable-img" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); cursor: pointer;">
                </div>
            `;
            container.dataset.url = url;
            document.getElementById('clickable-img').onclick = () => showModal(url);
        }
    }

    function showModal(url) {
        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = MODAL_ID;
            modal.style.cssText = 'display: none; position: fixed; z-index: 10001; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.9); align-items:center; justify-content:center; cursor: pointer;';
            modal.onclick = () => modal.style.display = 'none';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `<img src="${url}" style="max-width:85%; max-height:85%; border-radius:12px; border: 3px solid #fff;">`;
        modal.style.display = 'flex';
    }

    // --- MAIN EXECUTION ENGINE ---
    const runAllLogic = () => {
        if (!window.location.href.includes('contacts/detail')) return;

        // Logic A: Sparkle Button Injection with Absolute Position Fix
        const target = document.getElementById('contact.first_name') || document.querySelector('input[data-testid="contact-first-name"]');
        if (target && !document.getElementById('gemini-trigger')) {
            const btn = document.createElement('div');
            btn.id = 'gemini-trigger'; 
            btn.className = 'sparkle-btn'; 
            btn.innerHTML = '✦';
            
            // This anchors the button to the right of the input field
            btn.style.cssText = `
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 99;
            `;

            const parent = target.parentElement;
            if (parent) {
                parent.style.position = 'relative'; 
                parent.appendChild(btn);
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const contactId = window.location.href.split('/').pop().split('?')[0];
                    getInsights(contactId);
                };
            }
        }

        // Logic B: Profile Picture Handler
        const sidebar = document.getElementById(SIDEBAR_ID);
        const dropZone = document.getElementById(DROPZONE_ID);
        if (sidebar && dropZone) {
            const savedLink = document.querySelector(`#${DROPZONE_ID} ~ div a, #${DROPZONE_ID} a`);
            const hasSavedFile = !!(savedLink && savedLink.href && savedLink.href.includes('http'));
            
            if (hasSavedFile) {
                renderPreview(savedLink.href);
                dropZone.style.display = 'none';
                const label = dropZone.previousElementSibling;
                if (label && label.innerText.includes('Profile Picture')) label.style.display = 'none';
            } else {
                dropZone.style.display = 'flex';
                if (!dropZone.dataset.styled) {
                    dropZone.style.cssText = `width: 100%; height: 90px; border: 2px dashed #3b82f6; border-radius: 12px; background: #eff6ff; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s; margin-top: 10px; padding: 10px; text-align: center; cursor: pointer;`;
                    dropZone.innerHTML = `<i class="fa fa-image" style="font-size: 20px; color: #3b82f6; margin-bottom: 8px;"></i><div style="color: #1e40af; font-size: 12px; font-weight: 700; line-height: 1.4;">DRAG PHOTO HERE<br><span style="font-weight: 400; color: #60a5fa;">to update profile picture</span></div>`;
                    dropZone.dataset.styled = "true";
                }
            }
        }
    };

    setInterval(runAllLogic, 1000);
})();
