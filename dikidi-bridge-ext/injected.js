// injected.js
(function () {
    console.log("!!! DIKIDI BRIDGE: Network Interceptor Injected !!!");

    // Helper to process response data
    const processResponse = (url, responseBody) => {
        // Accept both journal and sales/form to be safe
        if (!url.includes('/ajax/journal/api/') && !url.includes('/ajax/sales/form/')) {
            return;
        }

        console.log("Dikidi Bridge Intercepted API:", url);

        let data;
        try {
            data = JSON.parse(responseBody);
        } catch (e) {
            return;
        }

        let foundCount = 0;

        // Recursive function to find appointment-like objects
        const findAndExtract = (obj, depth = 0) => {
            if (depth > 20) return; // Safety break
            if (!obj || typeof obj !== 'object') return;

            // Check array or object entries
            Object.entries(obj).forEach(([key, val]) => {
                if (!val || typeof val !== 'object') return;

                // Check if 'val' looks like an appointment record
                // Heuristic: has 'client' (obj) or 'client_name' AND 'services' (array) or 'services_title'

                // Sometimes the object itself is the record, sometimes it's inside 'info'
                const candidate = val.info ? val.info : val;

                // Check for existence of client and service info
                const hasClient = (candidate.client || candidate.client_name || candidate.client_id);
                const hasServices = (candidate.services || candidate.services_title || candidate.service_name);

                if (hasClient && hasServices) {
                    // Found a potential match!
                    // If we found it via key iteration, 'key' might be the ID
                    // If 'val' has 'id', use that.

                    const recordId = (val.info && key) ? key : (val.id || candidate.id || key);

                    // Process this record
                    try {
                        processRecordData(recordId, candidate);
                        foundCount++;
                    } catch (e) {
                        console.error("Error processing text candidate", e);
                    }
                }

                // Continue recursion
                findAndExtract(val, depth + 1);
            });
        };

        findAndExtract(data);

        // Fallback Logging if nothing found
        if (foundCount === 0) {
            console.log("!!! STEP 1 FAIL: URL matched but extraction logic returned null for", url);
            console.log("JSON Root Keys:", Object.keys(data));
            if (data.data && typeof data.data === 'object') {
                console.log("JSON Data Keys:", Object.keys(data.data));
            }
        }
    };

    const processRecordData = (recordId, info) => {
        // 1. External ID & Filtering
        const externalId = String(recordId);

        // Filter out non-numeric IDs or metadata keys like 'info'
        if (!externalId || externalId === 'info' || isNaN(Number(externalId))) {
            return;
        }

        // 2. Client Name & Cleaning
        let clientName = 'Unknown Client';
        if (info.client && info.client.name) clientName = info.client.name;
        else if (info.client_name) clientName = info.client_name;

        clientName = clientName.trim();

        // 3. Service Name & Cleaning
        let serviceName = 'Unknown Service';
        if (info.services_title && Array.isArray(info.services_title) && info.services_title.length > 0) {
            serviceName = info.services_title[0];
        } else if (info.service_name) {
            serviceName = info.service_name;
        } else if (info.services && Array.isArray(info.services) && info.services.length > 0) {
            serviceName = info.services[0].name || info.services[0].title || 'Service';
        }

        serviceName = serviceName.trim();

        // 4. Price & Cost
        const price = parseFloat(info.cost || info.total_cost || info.price || 0);

        // 5. Status
        let status = 'in_progress';
        const paidAmount = parseFloat(info.paid || info.pay_sum || 0);

        if (info.paid_full == 1 || (paidAmount >= price && price > 0)) {
            status = 'paid';
        }

        const appointment = {
            external_id: externalId,
            client_name: clientName,
            service_name: serviceName,
            service_price: price,
            status: status,
            appointment_time: new Date().toISOString()
        };

        // Send to Content Script
        const payload = appointment;

        console.log("!!! DATA SENT TO TUNNEL (CustomEvent):", payload.external_id);
        const event = new CustomEvent('DIKIDI_SYNC_EVENT', { detail: payload });
        document.dispatchEvent(event);
    };

    // 1. Monkey-patch XMLHttpRequest
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function (method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            processResponse(this._url, this.responseText);
        });
        return send.apply(this, arguments);
    };

    // 2. Monkey-patch fetch
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);

        // Clone response to read it without consuming the stream for the app
        const clone = response.clone();
        const url = response.url;

        clone.text().then(body => {
            processResponse(url, body);
        }).catch(err => console.error("Fetch Intercept Error", err));

        return response;
    };

})();
