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
