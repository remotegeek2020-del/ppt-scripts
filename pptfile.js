/**
 * PPT Combined Automation Script
 * Version: 1.0.1
 * Modules: Meeting Survey, Account Status Popups, PPT Rating UI, Merchant Search
 */

(function() {
    'use strict';

    // ==========================================
    // MODULE 1: MEETING SURVEY
    // ==========================================
    (function() {
        const FNAME_SELECTOR = 'input[name="contact.first_name"], #contact\\.first_name input';
        const LNAME_SELECTOR = 'input[name="contact.last_name"], #contact\\.last_name input';
        const RECENT_MEETING_SELECTOR = 'input[name="contact.recent_meeting"], #contact\\.recent_meeting input';
        const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/14591222/uak5wld/';
        const DISMISSED_SURVEY_KEY = 'ghl_survey_dismissed_path';
        let surveyActive = false;

        function getCurrentPath() { return window.location.pathname; }
        function getContactIdFromUrl() {
            const pathParts = window.location.pathname.split('/');
            return pathParts[pathParts.length - 1];
        }
        function getGHLValue(selector) {
            const el = document.querySelector(selector);
            if (!el) return '';
            let val = el.value ? el.value.trim() : '';
            const forbidden = ["", "null", "undefined", "none", "n/a"];
            return forbidden.includes(val.toLowerCase()) ? '' : val;
        }

        function showMeetingSurvey(meetingId, fname, lname) {
            const currentPath = getCurrentPath();
            if (surveyActive || sessionStorage.getItem(DISMISSED_SURVEY_KEY) === currentPath || !meetingId) return;
            surveyActive = true;
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position:'fixed', inset:'0', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:'99999', fontFamily:'sans-serif' });
            const box = document.createElement('div');
            Object.assign(box.style, { background:'#fff', padding:'25px', borderRadius:'15px', textAlign:'center', width:'450px', position:'relative', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' });
            const displayName = `${fname} ${lname}`.trim() || "the contact";
            let attendanceStatus = "";
            let selectedRating = 0;

            box.innerHTML = `
                <div id="survey-s1">
                    <h2 style="margin:0 0 10px; color:#0d6efd; font-size: 22px;">Meeting Status</h2>
                    <p style="font-size: 15px; margin-bottom: 20px;">What happened with the meeting for <strong>${displayName}</strong> on <strong>${meetingId}</strong>?</p>
                    <div style="display:flex; flex-direction: column; gap:10px; margin:10px 0;">
                        <button class="att-btn" data-val="Yes" style="padding:12px; border:1px solid #0d6efd; background:#fff; color:#0d6efd; border-radius:8px; cursor:pointer; font-weight:bold;">Yes.</button>
                        <button class="att-btn" data-val="No Show" style="padding:12px; border:1px solid #dc3545; background:#fff; color:#dc3545; border-radius:8px; cursor:pointer; font-weight:bold;">No, it was a no-show.</button>
                        <button class="att-btn" data-val="Canceled" style="padding:12px; border:1px solid #6c757d; background:#fff; color:#6c757d; border-radius:8px; cursor:pointer; font-weight:bold;">Canceled.</button>
                        <button class="att-btn" data-val="Rescheduled" style="padding:12px; border:1px solid #ffc107; background:#fff; color:#856404; border-radius:8px; cursor:pointer; font-weight:bold;">Rescheduled.</button>
                    </div>
                </div>
                <div id="survey-s2" style="display:none;">
                    <h2 style="margin:0 0 10px; color:#0d6efd; font-size: 24px;">Meeting Feedback</h2>
                    <div style="display:flex; justify-content:space-between; margin:25px 0;">
                        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div class="rate-btn" data-val="${n}" style="border:1px solid #ddd; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold;">${n}</div>`).join('')}
                    </div>
                </div>
                <div id="survey-s3" style="display:none;">
                    <h3>Tell us more...</h3>
                    <textarea id="note-in" style="width:100%; height:90px; border-radius:8px; border:1px solid #ccc; padding:10px;" placeholder="Share your thoughts..."></textarea>
                    <button id="survey-sub" style="margin-top:20px; width:100%; padding:14px; background:#1e5b8e; color:#fff; border:none; border-radius:8px; font-weight:bold;">Submit</button>
                </div>
                <div id="survey-s4" style="display:none;">
                    <h3 style="color:#198754;">Thank you!</h3>
                    <button id="survey-fin" style="margin-top:15px; padding:12px 30px; background:#1e5b8e; color:#fff; border:none; border-radius:8px;">Close</button>
                </div>
                <span id="survey-close-x" style="position:absolute; top:12px; right:18px; cursor:pointer; font-size:24px; color:#aaa;">&times;</span>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            box.querySelectorAll('.att-btn').forEach(btn => btn.onclick = function() {
                attendanceStatus = this.getAttribute('data-val');
                box.querySelector('#survey-s1').style.display = 'none';
                box.querySelector('#survey-s2').style.display = 'block';
            });

            box.querySelectorAll('.rate-btn').forEach(btn => btn.onclick = function() {
                selectedRating = this.getAttribute('data-val');
                box.querySelector('#survey-s2').style.display = 'none';
                box.querySelector('#survey-s3').style.display = 'block';
            });

            box.querySelector('#survey-sub').onclick = async function() {
                const submitBtn = this;
                submitBtn.innerText = "Sending...";
                submitBtn.disabled = true;
                const payload = { contactID: getContactIdFromUrl(), firstName: fname, lastName: lname, meetingDate: meetingId, attendedStatus: attendanceStatus, rating: selectedRating, feedback: box.querySelector('#note-in').value };
                fetch(ZAPIER_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }).finally(() => {
                    box.querySelector('#survey-s3').style.display = 'none';
                    box.querySelector('#survey-s4').style.display = 'block';
                });
            };

            const closeSurvey = () => { sessionStorage.setItem(DISMISSED_SURVEY_KEY, currentPath); overlay.remove(); surveyActive = false; };
            box.querySelector('#survey-close-x').onclick = closeSurvey;
            box.querySelector('#survey-fin').onclick = closeSurvey;
        }

        function runAutomation() {
            const mid = getGHLValue(RECENT_MEETING_SELECTOR);
            if (mid) showMeetingSurvey(mid, getGHLValue(FNAME_SELECTOR), getGHLValue(LNAME_SELECTOR));
        }

        let lastUrl = getCurrentPath();
        const obs = new MutationObserver(() => {
            if (getCurrentPath() !== lastUrl) { sessionStorage.removeItem(DISMISSED_SURVEY_KEY); lastUrl = getCurrentPath(); }
            setTimeout(runAutomation, 1500);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(runAutomation, 2500);
    })();

    // ==========================================
    // MODULE 2: STATUS POPUPS
    // ==========================================
    (function() {
        const TARGET_TERMINATED = "terminated partner", TARGET_BRANDED = "branded partner";
        const ALERT_MESSAGE_SELECTOR = '[name="contact.system_alert_message"]', ALERT_MESSAGE_LABEL = 'system alert message';
        const RED_COLOR = '#dc3545', GREEN_COLOR = '#198754', BLUE_COLOR = '#0d6efd';
        const DISMISSED_TERMINATED_KEY = 'terminatedPopupDismissedPath', DISMISSED_BRANDED_KEY = 'brandedPopupDismissedPath', DISMISSED_ALERT_KEY = 'alertPopupDismissedPath';
        let popupActive = false;

        function getCurrentPath() { return window.location.pathname; }
        function getStatus() {
            const el = document.querySelector('#contact\\.type') || document.querySelector("[id='contact.type']");
            if (!el) return '';
            let value = (el.getAttribute('title') || el.value || el.textContent || '').trim().toLowerCase();
            const inner = el.querySelector && el.querySelector('.filter-option-inner-inner');
            return inner ? inner.textContent.trim().toLowerCase() : value;
        }
        function getAlertMessage() {
            const el = document.querySelector(ALERT_MESSAGE_SELECTOR);
            if (!el) return '';
            return (el.value || el.textContent || '').trim();
        }

        function showPopup(title, mainMessage, buttonText, color, icon, dismissedKey) {
            if (popupActive || sessionStorage.getItem(dismissedKey) === getCurrentPath()) return;
            popupActive = true;
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position:'fixed', inset:'0', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:'99999' });
            const box = document.createElement('div');
            Object.assign(box.style, { background:'#fff', padding:'24px', borderRadius:'10px', textAlign:'center', fontFamily:'sans-serif', maxWidth:'400px', width:'90%' });
            box.innerHTML = `<h3 style="color: ${color};">${icon} ${title}</h3><div>${mainMessage}</div><button id="closeStatusPopup" style="margin-top:16px; padding:8px 16px; background:${color}; color:#fff; border:none; border-radius:6px; cursor:pointer;">${buttonText}</button>`;
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            document.getElementById('closeStatusPopup').onclick = () => { sessionStorage.setItem(dismissedKey, getCurrentPath()); overlay.remove(); popupActive = false; };
        }

        function checkStatus() {
            const status = getStatus(), alertMessage = getAlertMessage();
            if (status === TARGET_TERMINATED) showPopup("WARNING", "Terminated Partner", "CLOSE", RED_COLOR, "❌", DISMISSED_TERMINATED_KEY);
            else if (status === TARGET_BRANDED) showPopup("Notice", "Branded Partner", "Close", GREEN_COLOR, "✔", DISMISSED_BRANDED_KEY);
            else if (alertMessage) showPopup("Alert", alertMessage, "Close", BLUE_COLOR, "❗", DISMISSED_ALERT_KEY);
        }

        const observer = new MutationObserver(() => setTimeout(checkStatus, 700));
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(checkStatus, 1000);
    })();

    // ==========================================
    // MODULE 3: PPT RATING UI
    // ==========================================
    (function() {
        const mapping = {
            "LeadLabels": [{ val: '1', label: 'No Fit / DNC', color: '#000000' },{ val: '5', label: 'Ready Now', color: '#ff0000' }],
            "PartnerLabels": [{ val: '1', label: 'Terminated', color: '#000000' },{ val: '5', label: 'Power Partner', color: '#ff0000' }]
        };
        function updatePptUI() {
            const ownerContainer = document.getElementById('OwnersComponent');
            if (!ownerContainer) return;
            ownerContainer.style.minHeight = "40px"; // Keeps UI stable
        }
        setInterval(updatePptUI, 300);
    })();

    // ==========================================
    // MODULE 4: MERCHANT SEARCH
    // ==========================================
    (function() {
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5eeQBjYHIM2I8A1NKXsAFNVRV3VzERI2GH-ftTQoDjh34FQ4pJD6cUOEmWeH54W31/exec';
        const targetFieldIds = ['contact.agent_id_1', 'contact.agent_id_2'];
        function injectIcons() {
            targetFieldIds.forEach(id => {
                const wrapper = document.querySelector(`[id="${id}"]`);
                if (wrapper && !wrapper.querySelector('.search-icon-trigger')) {
                    const btn = document.createElement('span');
                    btn.innerHTML = '🔍';
                    btn.className = 'search-icon-trigger';
                    btn.style.cursor = "pointer";
                    wrapper.appendChild(btn);
                }
            });
        }
        setInterval(injectIcons, 1500);
    })();

})();
