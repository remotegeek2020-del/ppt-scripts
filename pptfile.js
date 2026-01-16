<script>
(function() {
    // --- Configuration ---
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
                    <button class="att-btn" data-val="Yes" style="padding:12px; border:1px solid #0d6efd; background:#fff; color:#0d6efd; border-radius:8px; cursor:pointer; font-weight:bold; transition: 0.2s;">Yes.</button>
                    <button class="att-btn" data-val="No Show" style="padding:12px; border:1px solid #dc3545; background:#fff; color:#dc3545; border-radius:8px; cursor:pointer; font-weight:bold; transition: 0.2s;">No, it was a no-show.</button>
                    <button class="att-btn" data-val="Canceled" style="padding:12px; border:1px solid #6c757d; background:#fff; color:#6c757d; border-radius:8px; cursor:pointer; font-weight:bold; transition: 0.2s;">The appointment was canceled.</button>
                    <button class="att-btn" data-val="Rescheduled" style="padding:12px; border:1px solid #ffc107; background:#fff; color:#856404; border-radius:8px; cursor:pointer; font-weight:bold; transition: 0.2s;">The appointment was rescheduled.</button>
                </div>
            </div>

            <div id="survey-s2" style="display:none;">
                <h2 style="margin:0 0 10px; color:#0d6efd; font-size: 24px;">Meeting Feedback</h2>
                <p style="font-size: 16px;">How was your meeting with <strong>${displayName}</strong>?</p>
                <div style="display:flex; justify-content:space-between; margin:25px 0;">
                    ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div class="rate-btn" data-val="${n}" style="border:1px solid #ddd; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s;">${n}</div>`).join('')}
                </div>
            </div>

            <div id="survey-s3" style="display:none;">
                <h3 style="margin-top:0;">Tell us more...</h3>
                <textarea id="note-in" style="width:100%; height:90px; margin-top:10px; border-radius:8px; border:1px solid #ccc; padding:10px; box-sizing:border-box; font-size: 14px;" placeholder="Share your thoughts..."></textarea>
                <button id="survey-sub" style="margin-top:20px; width:100%; padding:14px; background:#1e5b8e; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size: 16px;">Submit</button>
            </div>

            <div id="survey-s4" style="display:none;">
                <h3 style="color:#198754; font-size: 22px;">Thank you for your time!</h3>
                <p>We appreciate your feedback.</p>
                <button id="survey-fin" style="margin-top:15px; padding:12px 30px; background:#1e5b8e; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Close</button>
            </div>
            <span id="survey-close-x" style="position:absolute; top:12px; right:18px; cursor:pointer; font-size:24px; color:#aaa; font-weight:bold;">&times;</span>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Attendance Logic
        box.querySelectorAll('.att-btn').forEach(btn => {
            btn.onmouseover = function() { this.style.filter = "brightness(0.95)"; };
            btn.onmouseout = function() { this.style.filter = "none"; };
            btn.onclick = function() {
                attendanceStatus = this.getAttribute('data-val');
                box.querySelector('#survey-s1').style.display = 'none';
                box.querySelector('#survey-s2').style.display = 'block';
            };
        });

        // Rating Logic
        box.querySelectorAll('.rate-btn').forEach(btn => {
            btn.onclick = function() {
                selectedRating = this.getAttribute('data-val');
                box.querySelector('#survey-s2').style.display = 'none';
                box.querySelector('#survey-s3').style.display = 'block';
            };
        });

        // Submit Logic
        box.querySelector('#survey-sub').onclick = async function() {
            const feedbackNote = box.querySelector('#note-in').value;
            const contactID = getContactIdFromUrl();
            const submitBtn = box.querySelector('#survey-sub');
            
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const payload = {
                contactID: contactID,
                firstName: fname,
                lastName: lname,
                meetingDate: meetingId,
                attendedStatus: attendanceStatus,
                rating: selectedRating,
                feedback: feedbackNote
            };

            fetch(ZAPIER_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', 
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            }).finally(() => {
                box.querySelector('#survey-s3').style.display = 'none';
                box.querySelector('#survey-s4').style.display = 'block';
            });
        };

        const closeSurvey = () => {
            sessionStorage.setItem(DISMISSED_SURVEY_KEY, currentPath);
            overlay.remove();
            surveyActive = false;
        };

        box.querySelector('#survey-close-x').onclick = closeSurvey;
        box.querySelector('#survey-fin').onclick = closeSurvey;
    }

    function runAutomation() {
        const mid = getGHLValue(RECENT_MEETING_SELECTOR);
        const fn = getGHLValue(FNAME_SELECTOR);
        const ln = getGHLValue(LNAME_SELECTOR);
        if (mid && mid.length > 0) {
            showMeetingSurvey(mid, fn, ln);
        }
    }

    let lastUrl = getCurrentPath();
    const obs = new MutationObserver(() => {
        if (getCurrentPath() !== lastUrl) {
            sessionStorage.removeItem(DISMISSED_SURVEY_KEY);
            lastUrl = getCurrentPath();
        }
        setTimeout(runAutomation, 1500);
    });

    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(runAutomation, 2500); 
})();
</script>

<script>
(function() {
  // --- Configuration ---
  const TARGET_TERMINATED = "terminated partner";
  const TARGET_BRANDED = "branded partner";
  
  const ALERT_MESSAGE_SELECTOR = '[name="contact.system_alert_message"]';
  const ALERT_MESSAGE_LABEL = 'system alert message'; 
  
  const RED_COLOR = '#dc3545'; 
  const GREEN_COLOR = '#198754';
  const BLUE_COLOR = '#0d6efd'; 

  // Keys to store dismissal state in sessionStorage
  const DISMISSED_TERMINATED_KEY = 'terminatedPopupDismissedPath';
  const DISMISSED_BRANDED_KEY = 'brandedPopupDismissedPath';
  const DISMISSED_ALERT_KEY = 'alertPopupDismissedPath'; 
  
  let popupActive = false;

  function getCurrentPath() {
    return window.location.pathname;
  }

  function getStatus() {
    const el = document.querySelector('#contact\\.type') ||
               document.querySelector("[id='contact.type']") ||
               document.getElementById('contact.type');

    if (!el) return '';

    let value = (el.getAttribute('title') || el.value || el.textContent || '').trim().toLowerCase();
    const inner = el.querySelector && el.querySelector('.filter-option-inner-inner');
    if (inner && inner.textContent) {
      value = inner.textContent.trim().toLowerCase();
    }
    return value;
  }

  function getAlertMessage() {
    const el = document.querySelector(ALERT_MESSAGE_SELECTOR);

    if (!el) {
        let fieldElement = null;
        const allTextElements = document.querySelectorAll('label, span, p, div, h1, h2, h3, h4, input, textarea');
        for (let searchEl of allTextElements) {
            if (searchEl.textContent && searchEl.textContent.trim().toLowerCase() === ALERT_MESSAGE_LABEL) {
                fieldElement = searchEl;
                break;
            }
        }
        if (fieldElement && fieldElement.nextElementSibling) {
            return (fieldElement.nextElementSibling.value || fieldElement.nextElementSibling.textContent || '').trim();
        }
        return '';
    }
    
    let value = (el.value || '').trim();
    if (value.length > 0) return value;
    
    value = (el.textContent || '').trim();
    if (value.length > 0) {
        return value;
    }

    const textContainers = el.querySelectorAll('input, textarea, p, span, div, strong, em, [data-testid]');
    for (let container of textContainers) {
        let text = (container.value || container.textContent || '').trim();
        if (text.length > 0) {
            return text;
        }
    }

    return '';
  }


  function showPopup(title, mainMessage, buttonText, color, icon, dismissedKey) {
    const currentPath = getCurrentPath();
    
    // Check if popup is already active
    if (popupActive) {
      return; 
    }
    
    popupActive = true;

    // --- Popup DOM Creation (Content remains the same) ---
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '24px';
    box.style.borderRadius = '10px';
    box.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
    box.style.textAlign = 'center';
    box.style.fontFamily = 'system-ui, sans-serif';
    box.style.maxWidth = '400px'; 
    box.style.width = '90%';
    
    box.innerHTML = `
      <h3 style="margin-bottom:10px; color: ${color};">${icon} ${title}</h3>
      <div style="font-size: 0.95em;">${mainMessage}</div>
      <button id="closeStatusPopup" style="margin-top:16px; padding:8px 16px; background:${color}; color:#fff; border:none; border-radius:6px; cursor:pointer;">${buttonText}</button>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('closeStatusPopup').onclick = () => {
      // Save the dismissal state using the correct key
      sessionStorage.setItem(dismissedKey, currentPath); 
      document.body.removeChild(overlay);
      popupActive = false;
    };
  }

  function checkStatus() {
    const status = getStatus();
    const alertMessage = getAlertMessage(); 
    const currentPath = getCurrentPath();
    
    let title, mainMessage, buttonText, color, icon, dismissedKey, targetType;

    // --- 1. DETERMINE WHICH POPUP IS NEEDED AND GET ITS KEY ---
    if (status === TARGET_TERMINATED) {
      targetType = TARGET_TERMINATED;
      dismissedKey = DISMISSED_TERMINATED_KEY;
      color = RED_COLOR;
      icon = `❌`;
      title = `ACCOUNT STATUS: WARNING`.toUpperCase();
      mainMessage = `This account is marked as a <strong style="color: ${color};">TERMINATED PARTNER</strong>.`;
      buttonText = `CLOSE WARNING`.toUpperCase();
      if (alertMessage) {
        mainMessage += `<hr style="margin: 10px 0; border-color: ${color};"><p style="font-weight: bold;">ALERT MESSAGE:</p><p>${alertMessage}</p>`;
      }
      sessionStorage.removeItem(DISMISSED_BRANDED_KEY);
      sessionStorage.removeItem(DISMISSED_ALERT_KEY);

    } else if (status === TARGET_BRANDED) {
      targetType = TARGET_BRANDED;
      dismissedKey = DISMISSED_BRANDED_KEY;
      color = GREEN_COLOR;
      icon = `✔`;
      title = `Account Status Notice`;
      mainMessage = `This account is marked as a <strong>Branded Partner</strong>.`;
      buttonText = `Close Notice`;
      if (alertMessage) {
        mainMessage += `<hr style="margin: 10px 0; border-color: ${color};"><p style="font-weight: bold;">Notice Details:</p><p>${alertMessage}</p>`;
      }
      sessionStorage.removeItem(DISMISSED_TERMINATED_KEY);
      sessionStorage.removeItem(DISMISSED_ALERT_KEY);

    } else if (alertMessage) { 
      // SCENARIO 4: GENERIC ALERT
      targetType = 'generic_alert';
      dismissedKey = DISMISSED_ALERT_KEY;
      color = BLUE_COLOR;
      icon = `❗`;
      title = `Contact Alert Message`;
      mainMessage = `<p>Current Status: <strong>${status || 'N/A'}</strong></p><hr style="margin: 10px 0; border-color: ${color};"><p style="font-weight: bold;">Custom Alert:</p><p>${alertMessage}</p>`;
      buttonText = `Close Alert`;
      sessionStorage.removeItem(DISMISSED_TERMINATED_KEY);
      sessionStorage.removeItem(DISMISSED_BRANDED_KEY);
    } else {
      // Clear all dismissal flags if the current record is "clean"
      sessionStorage.removeItem(DISMISSED_TERMINATED_KEY);
      sessionStorage.removeItem(DISMISSED_BRANDED_KEY);
      sessionStorage.removeItem(DISMISSED_ALERT_KEY);
      return; 
    }
    
    // --- 2. NEW FIX: ENFORCE DISMISSAL CHECK IMMEDIATELY ---
    // If we determined a popup should show, check if it was already dismissed for this path.
    if (sessionStorage.getItem(dismissedKey) === currentPath) {
        return;
    }

    // --- 3. SHOW POPUP ---
    showPopup(title, mainMessage, buttonText, color, icon, dismissedKey);
  }

  // --- Observation/Navigation Logic ---
  let lastCheckedPath = getCurrentPath();
  const observer = new MutationObserver(() => {
    const currentPath = getCurrentPath();
    if (currentPath !== lastCheckedPath) {
        // Clear all session storage keys upon navigation to a new contact
        sessionStorage.removeItem(DISMISSED_TERMINATED_KEY);
        sessionStorage.removeItem(DISMISSED_BRANDED_KEY);
        sessionStorage.removeItem(DISMISSED_ALERT_KEY);
        lastCheckedPath = currentPath;
    }
    
    // Wait a bit for the contact info to render and then run the check
    setTimeout(checkStatus, 700);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also check on initial load
  setTimeout(checkStatus, 1000);
})();
</script>

<script>
  (function() {
    'use strict';

    const mapping = {
        "LeadLabels": [
            { val: '1', label: 'No Fit / DNC', color: '#000000' },
            { val: '2', label: 'Weak Fit / Low Potential', color: '#6eabdd' },
            { val: '3', label: 'Possible Fit / Moderate Potential', color: '#ffd240' },
            { val: '4', label: 'Strong Fit / High Potential', color: '#ff5000' },
            { val: '5', label: 'Ready Now / High Intent', color: '#ff0000' }
        ],
        "PartnerLabels": [
            { val: '1', label: 'Terminated', color: '#000000' },
            { val: '2', label: 'Basic Partner', color: '#6eabdd' },
            { val: '3', label: 'Average Partner', color: '#ffd240' },
            { val: '4', label: 'Above Average Partner', color: '#ff5000' },
            { val: '5', label: 'Power Partner', color: '#ff0000' }
        ]
    };

    function getContext(contactType) {
        const type = (contactType || "Lead").trim();
        const partnerGroups = ["Partner", "Sub-Partner", "Branded Partner", "PPT Staff", "Terminated Partner"];
        if (type === "Terminated Partner") return { map: mapping.PartnerLabels, forceVal: '1', forceLabel: 'Terminated', locked: true };
        if (type === "Vendor/Supplier" || type === "Merchant") return { map: mapping.LeadLabels, forceVal: '1', forceLabel: 'Do not contact', locked: true };
        if (partnerGroups.includes(type)) return { map: mapping.PartnerLabels, locked: false };
        return { map: mapping.LeadLabels, locked: false }; 
    }

    function updatePptUI() {
        const ownerContainer = document.getElementById('OwnersComponent');
        const pptDropdown = document.querySelector('[id="contact.ppt_rating"]');
        const typeDropdown = document.querySelector('[id="contact.type"]');
        
        if (!ownerContainer || !pptDropdown || !typeDropdown) return;

        // Reset parent to a clean state to prevent Save button push
        ownerContainer.style.display = "flex";
        ownerContainer.style.alignItems = "center";
        ownerContainer.style.height = "auto";
        ownerContainer.style.minHeight = "40px";

        const typeBtn = typeDropdown.querySelector('button.dropdown-toggle');
        const contactType = (typeBtn ? typeBtn.getAttribute('title') : 'Lead').trim();
        const context = getContext(contactType);
        const pptSelect = pptDropdown.querySelector('select');
        const pptBtn = pptDropdown.querySelector('button.dropdown-toggle');
        const currentVal = context.forceVal || (pptBtn ? pptBtn.getAttribute('title') : '') || (pptSelect ? pptSelect.value : "");

        const isWide = window.innerWidth > 1400;

        let wrapper = document.getElementById('ppt-header-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'ppt-header-wrapper';
            ownerContainer.appendChild(wrapper);
        }

        // RELATIVE positioning ensures it doesn't overlap icons
        wrapper.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 10px !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            pointer-events: all !important;
        `;

        if (wrapper.dataset.type !== contactType || wrapper.dataset.width !== (isWide ? 'W' : 'S')) {
            wrapper.innerHTML = ''; 
            wrapper.dataset.type = contactType;
            wrapper.dataset.width = isWide ? 'W' : 'S';

            const barsContainer = document.createElement('div');
            if (isWide) {
                // Wide: Single Row
                barsContainer.style.cssText = "display: flex; gap: 4px; margin-bottom: 2px;";
            } else {
                // Small: 2-Column Grid
                barsContainer.style.cssText = "display: grid; grid-template-columns: repeat(2, 20px); grid-gap: 2px; margin-bottom: 2px;";
            }
            
            context.map.forEach(item => {
                const bar = document.createElement('div');
                bar.className = 'ppt-header-bar';
                bar.dataset.val = item.val;
                bar.style.cssText = `
                    width: ${isWide ? '40px' : '20px'} !important; 
                    height: ${isWide ? '14px' : '8px'} !important; 
                    background-color: ${item.color} !important;
                    opacity: 0.15 !important;
                    border-radius: 2px !important;
                    cursor: pointer !important;
                    border: 1px solid rgba(0,0,0,0.1) !important;
                `;
                bar.onclick = () => {
                    if (pptSelect && !context.locked) {
                        pptSelect.value = item.val;
                        pptSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                };
                barsContainer.appendChild(bar);
            });
            wrapper.appendChild(barsContainer);

            const labelDisplay = document.createElement('div');
            labelDisplay.id = 'ppt-adjacent-label';
            labelDisplay.style.cssText = `
                font-weight: 900 !important; 
                font-size: ${isWide ? '10px' : '7px'} !important; 
                text-transform: uppercase !important;
                text-align: center !important;
                white-space: nowrap !important;
                color: #333 !important;
                max-width: ${isWide ? 'none' : '80px'} !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            `;
            wrapper.appendChild(labelDisplay);
        }

        const match = context.map.find(m => m.val === (currentVal ? currentVal.trim() : ""));
        wrapper.querySelectorAll('.ppt-header-bar').forEach(bar => {
            const isActive = match && bar.dataset.val === match.val;
            bar.style.opacity = isActive ? "1" : "0.15";
            bar.style.boxShadow = isActive ? `0 0 5px ${bar.style.backgroundColor}` : "none";
        });

        const labelDisplay = document.getElementById('ppt-adjacent-label');
        if (context.forceLabel) {
            labelDisplay.textContent = context.forceLabel;
        } else if (match) {
            labelDisplay.textContent = match.label;
            labelDisplay.style.color = match.color;
        } else {
            labelDisplay.textContent = "";
        }
    }

    setInterval(updatePptUI, 300);
})();
</script>

<script>
  (function() {
    // 1. SETTINGS & URL FILTERS
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5eeQBjYHIM2I8A1NKXsAFNVRV3VzERI2GH-ftTQoDjh34FQ4pJD6cUOEmWeH54W31/exec';
    const targetFieldIds = ['contact.agent_id_1', 'contact.agent_id_2', 'contact.agent_id_3', 'contact.agent_id_4'];
    
    // Using partial strings to match dynamic URLs
    const allowedPath = '/v2/location/dfg08aPdtlQ1RhIKkCnN/contacts/detail/';

    let currentData = { headers: [], rows: [] };

    // Function to check if the current URL contains the allowed path
    function isAllowedPage() {
        return window.location.href.includes(allowedPath);
    }

    // 2. INJECT SALESFORCE STYLES
    if (!document.getElementById('ghl-salesforce-styles')) {
        const style = document.createElement('style');
        style.id = 'ghl-salesforce-styles';
        style.innerHTML = `
            #ghlSheetModal { display:none; position:fixed; z-index:999999; left:0; top:0; width:100%; height:100%; background:rgba(8, 26, 54, 0.6); backdrop-filter: blur(2px); font-family: 'Segoe UI', Arial, sans-serif; }
            .ghl-modal-content { background:#f3f3f3; margin:2% auto; width:95%; max-width:1450px; height:90vh; border-radius:4px; display: flex; flex-direction: column; border: 1px solid #d8dde6; box-shadow: 0 12px 20px rgba(0,0,0,0.3); }
            .ghl-modal-header { background: #f3f3f2; padding: 12px 20px; border-bottom: 1px solid #d8dde6; display: flex; justify-content: space-between; align-items: center; }
            .ghl-modal-header h2 { font-size: 18px; color: #080707; font-weight: 400; margin: 0; }
            #ghlModalBody { padding: 16px; background: white; flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
            .ghl-search-container { margin-bottom: 15px; padding: 12px; background: #fafaf9; border: 1px solid #d8dde6; border-radius: 4px; display: flex; gap: 15px; align-items: center; }
            .slds-input { padding: 8px 12px; border: 1px solid #dddbda; border-radius: 4px; width: 400px; font-size: 13px; }
            #ghlTableContainer { overflow: auto; border: 1px solid #d8dde6; flex-grow: 1; background: white; }
            .ghl-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 2200px; }
            .ghl-table th { background: #fafaf9; color: #514f4d; padding: 8px 12px; text-align: left; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #d8dde6; font-weight: 700; text-transform: uppercase; }
            .ghl-table td { padding: 8px 12px; border-bottom: 1px solid #d8dde6; white-space: nowrap; color: #080707; }
            .ghl-field-flex { display: flex !important; align-items: center !important; gap: 10px; }
            .search-icon-trigger { cursor: pointer; color: #0070d2; font-size: 18px; line-height: 1; transition: transform 0.1s; }
            .search-icon-trigger:hover { transform: scale(1.2); color: #005fb2; }
        `;
        document.head.appendChild(style);
    }

    // 3. INJECT MODAL HTML
    if (!document.getElementById('ghlSheetModal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="ghlSheetModal">
                <div class="ghl-modal-content">
                    <div class="ghl-modal-header"><h2>Merchant Data</h2><span id="closeGhlModal" style="cursor:pointer; font-size:24px; color:#706e6b;">&times;</span></div>
                    <div id="ghlModalBody">
                        <div class="ghl-search-container">
                            <input type="text" id="internalSearch" class="slds-input" placeholder="Search Merchant ID or DBA Name within results...">
                            <div id="ghlStatusText" style="font-size:13px; color:#3e3e3c;"></div>
                        </div>
                        <div id="ghlTableContainer"></div>
                    </div>
                </div>
            </div>`);
        document.getElementById('closeGhlModal').onclick = () => document.getElementById('ghlSheetModal').style.display = 'none';
        
        document.getElementById('internalSearch').oninput = (e) => {
            const q = e.target.value.toLowerCase();
            const midIdx = currentData.headers.indexOf('merchant_id');
            const dbaIdx = currentData.headers.indexOf('dba_name');
            const filtered = currentData.rows.filter(row => 
                (row[midIdx] || "").toString().toLowerCase().includes(q) || 
                (row[dbaIdx] || "").toString().toLowerCase().includes(q)
            );
            renderTable(filtered);
        };
    }

    // 4. THE SEARCH FUNCTION
    async function performMerchantSearch(agentId) {
        if (!isAllowedPage()) return;
        const status = document.getElementById('ghlStatusText');
        const container = document.getElementById('ghlTableContainer');
        document.getElementById('ghlSheetModal').style.display = 'block';
        document.getElementById('internalSearch').value = '';
        container.innerHTML = '';
        status.innerHTML = `Searching Agent ID: <strong>${agentId}</strong>...`;

        try {
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(agentId)}`, { method: 'GET', redirect: 'follow' });
            currentData = await response.json();
            if (currentData.error) { status.innerHTML = `<span style="color:#c23934;">${currentData.error}</span>`; return; }
            status.innerHTML = `Loaded top <strong>${currentData.count}</strong> records (Total found: ${currentData.total}).`;
            renderTable(currentData.rows);
        } catch (err) { status.innerHTML = `<span style="color:#c23934;">Search failed. Check deployment or login.</span>`; }
    }

    function renderTable(rows) {
        let table = `<table class="ghl-table"><thead><tr>${currentData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
        rows.forEach(row => table += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`);
        document.getElementById('ghlTableContainer').innerHTML = table + `</tbody></table>`;
    }

    // 5. THE INJECTION LOGIC
    function injectIcons() {
        if (!isAllowedPage()) return; 

        targetFieldIds.forEach(id => {
            const wrapper = document.querySelector(`[id="${id}"]`);
            if (!wrapper || wrapper.querySelector('.search-icon-trigger')) return;

            const input = wrapper.querySelector('input');
            if (input) {
                const btn = document.createElement('span');
                btn.innerHTML = '🔍';
                btn.className = 'search-icon-trigger';
                btn.onclick = (e) => {
                    e.preventDefault();
                    if (input.value.trim()) performMerchantSearch(input.value.trim());
                    else alert("Please enter an Agent ID.");
                };
                
                input.after(btn);
                input.parentElement.classList.add('ghl-field-flex');
            }
        });
    }

    setInterval(injectIcons, 1500);
})();
</script>
