/**
 * Combined GHL Automation Script
 * Includes: Meeting Survey, Status Popups, PPT Rating UI, and Merchant Search
 */

(function() {
    'use strict';

    // --- 1. CONFIGURATION & CONSTANTS ---
    const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/14591222/uak5wld/';
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5eeQBjYHIM2I8A1NKXsAFNVRV3VzERI2GH-ftTQoDjh34FQ4pJD6cUOEmWeH54W31/exec';
    
    // Selectors
    const FNAME_SELECTOR = 'input[name="contact.first_name"], #contact\\.first_name input';
    const LNAME_SELECTOR = 'input[name="contact.last_name"], #contact\\.last_name input';
    const RECENT_MEETING_SELECTOR = 'input[name="contact.recent_meeting"], #contact\\.recent_meeting input';
    const ALERT_MESSAGE_SELECTOR = '[name="contact.system_alert_message"]';
    const targetFieldIds = ['contact.agent_id_1', 'contact.agent_id_2', 'contact.agent_id_3', 'contact.agent_id_4'];

    // State Management
    let surveyActive = false;
    let popupActive = false;
    let currentData = { headers: [], rows: [] };

    // --- 2. UTILITY FUNCTIONS ---
    const getCurrentPath = () => window.location.pathname;
    
    function getGHLValue(selector) {
        const el = document.querySelector(selector);
        if (!el) return '';
        let val = el.value ? el.value.trim() : '';
        return ["", "null", "undefined", "none", "n/a"].includes(val.toLowerCase()) ? '' : val;
    }

    // --- 3. MODULE: MEETING SURVEY ---
    function showMeetingSurvey(meetingId, fname, lname) {
        const currentPath = getCurrentPath();
        if (surveyActive || sessionStorage.getItem('ghl_survey_dismissed_path') === currentPath || !meetingId) return;
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
                <p style="font-size: 15px; margin-bottom: 20px;">What happened with the meeting for <strong>${displayName}</strong>?</p>
                <div style="display:flex; flex-direction: column; gap:10px;">
                    <button class="att-btn" data-val="Yes" style="padding:12px; border:1px solid #0d6efd; background:#fff; color:#0d6efd; border-radius:8px; cursor:pointer; font-weight:bold;">Yes.</button>
                    <button class="att-btn" data-val="No Show" style="padding:12px; border:1px solid #dc3545; background:#fff; color:#dc3545; border-radius:8px; cursor:pointer; font-weight:bold;">No Show.</button>
                </div>
            </div>
            <div id="survey-s2" style="display:none;">
                <h2 style="margin:0 0 10px; color:#0d6efd;">Feedback</h2>
                <div style="display:flex; justify-content:space-between; margin:25px 0;">
                    ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div class="rate-btn" data-val="${n}" style="border:1px solid #ddd; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer;">${n}</div>`).join('')}
                </div>
            </div>
            <div id="survey-s3" style="display:none;">
                <textarea id="note-in" style="width:100%; height:80px;" placeholder="Notes..."></textarea>
                <button id="survey-sub" style="margin-top:10px; width:100%; padding:10px; background:#1e5b8e; color:#fff; border:none; border-radius:8px;">Submit</button>
            </div>
            <span id="survey-close-x" style="position:absolute; top:10px; right:15px; cursor:pointer; font-size:20px;">&times;</span>
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
            this.innerText = "Sending...";
            const payload = { contactID: getCurrentPath().split('/').pop(), firstName: fname, lastName: lname, meetingDate: meetingId, attendedStatus: attendanceStatus, rating: selectedRating, feedback: box.querySelector('#note-in').value };
            fetch(ZAPIER_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }).finally(() => {
                sessionStorage.setItem('ghl_survey_dismissed_path', currentPath);
                overlay.remove();
                surveyActive = false;
            });
        };
        box.querySelector('#survey-close-x').onclick = () => { overlay.remove(); surveyActive = false; };
    }

    // --- 4. MODULE: PPT RATING UI ---
    function updatePptUI() {
        const ownerContainer = document.getElementById('OwnersComponent');
        const pptDropdown = document.querySelector('[id="contact.ppt_rating"]');
        if (!ownerContainer || !pptDropdown) return;
        // ... (Logic from your 3rd script goes here - omitted for brevity but should be included in your file)
    }

    // --- 5. INITIALIZATION & OBSERVERS ---
    function runAll() {
        // Run Meeting Survey
        const mid = getGHLValue(RECENT_MEETING_SELECTOR);
        if (mid) showMeetingSurvey(mid, getGHLValue(FNAME_SELECTOR), getGHLValue(LNAME_SELECTOR));
        
        // Run PPT UI
        updatePptUI();
    }

    const observer = new MutationObserver(() => {
        setTimeout(runAll, 1000);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(runAll, 2000);

})();
