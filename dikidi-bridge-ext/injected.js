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

            clientName = clientName ? clientName.trim() : '';

            // STRICT FILTER: Unknown Client
            if (!clientName || clientName === 'Unknown Client') {
                return;
            }

            // 3. Service Name & Cleaning
            let serviceName = 'Unknown Service';
            if (info.services_title && Array.isArray(info.services_title) && info.services_title.length > 0) {
                serviceName = info.services_title[0];
            } else if (info.service_name) {
                serviceName = info.service_name;
            } else if (info.services && Array.isArray(info.services) && info.services.length > 0) {
                serviceName = info.services[0].name || info.services[0].title || 'Service';
            }

            serviceName = serviceName ? serviceName.trim() : '';

            // STRICT FILTER: Empty Service
            if (!serviceName || serviceName === 'Unknown Service') {
                return;
            }

            // 4. Price & Cost
            const price = parseFloat(info.cost || info.total_cost || info.price || 0);

            // 5. Status
            let status = 'in_progress';
            const paidAmount = parseFloat(info.paid || info.pay_sum || 0);

            if (info.paid_full == 1 || (paidAmount >= price && price > 0)) {
                status = 'paid';
            }

            // 6. DATE VALIDATION (Double Check)
            if (info.time_start) {
                const apptDatePart = info.time_start.split(' ')[0]; // "2023-10-27"
                const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi' });

                if (apptDatePart !== todayStr) {
                    return;
                }
            }

            const appointment = {
                external_id: externalId,
                client_name: clientName,
                service_name: serviceName,
                service_price: price,
                status: status,
                appointment_time: info.time_start ? new Date(info.time_start).toISOString() : new Date().toISOString()
            };

            // Send to Content Script
            const payload = appointment;

            console.log("!!! DATA SENT TO TUNNEL (CustomEvent):", payload.external_id);
            const event = new CustomEvent('DIKIDI_SYNC_EVENT', { detail: payload });
            document.dispatchEvent(event);
        };

        // Recursive function to find appointment-like objects
        /* 
        DISABLED RECURSION TO PREVENT DATA FLOOD
        const findAndExtract = (obj, depth = 0) => {
            if (depth > 20) return; // Safety break
            if (!obj || typeof obj !== 'object') return;
            Object.entries(obj).forEach(([key, val]) => {
                if (!val || typeof val !== 'object') return;
                const candidate = val.info ? val.info : val;
                const hasClient = (candidate.client || candidate.client_name || candidate.client_id);
                const hasServices = (candidate.services || candidate.services_title || candidate.service_name);

                if (hasClient && hasServices) {
                    const recordId = (val.info && key) ? key : (val.id || candidate.id || key);
                    try {
                        processRecordData(recordId, candidate);
                        foundCount++;
                    } catch (e) {
                        console.error("Error processing text candidate", e);
                    }
                }
                findAndExtract(val, depth + 1);
            });
        };
        */

        // STRATEGY 1: Specific handling for Journal API structure
        if (data.masters) {
            // Calculate Today in Tbilisi
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi' });
            console.log("Dikidi Bridge: Filtering specifically for Today:", todayStr);

            let todayAppointments = null;

            // 1. Check data.masters.records.data -> [Date]
            if (data.masters.records && data.masters.records.data) {
                if (data.masters.records.data[todayStr]) {
                    console.log("Dikidi Bridge: Found records for today in 'masters.records.data'");
                    todayAppointments = data.masters.records.data[todayStr];
                }
            }
            // 2. Fallback: Check data.masters.data
            else if (data.masters.data) {
                console.log("Dikidi Bridge: 'masters.data' path found. Processing all, relying on processRecordData validation.");
                todayAppointments = data.masters.data;
            }

            if (todayAppointments) {
                try {
                    Object.values(todayAppointments).forEach(masterGroup => {
                        if (!masterGroup || typeof masterGroup !== 'object') return;

                        Object.entries(masterGroup).forEach(([apptId, apptData]) => {
                            const candidate = apptData.info ? apptData.info : apptData;

                            if (foundCount === 0) {
                                console.log("Debug: First Appointment Candidate Keys:", Object.keys(candidate));
                            }

                            const hasId = candidate.id || apptId;

                            if (hasId) {
                                processRecordData(hasId, candidate);
                                foundCount++;
                            }
                        });
                    });
                } catch (err) {
                    console.error("Error in specific extraction:", err);
                }
            }
        }

        /*
        // STRATEGY 2: Generic Recursive Search (Fallback)
        if (foundCount === 0) {
            findAndExtract(data);
        }
        */

        // Fallback Logging if nothing found
        if (foundCount === 0) {
            console.log("!!! STEP 1 FAIL: URL matched but extraction logic returned null for", url);
            // SPECIFIC DEBUG FOR JOURNAL
            if (data.masters && data.masters.records && data.masters.records.data) {
                console.log("Available Dates in Response:", Object.keys(data.masters.records.data));
            }
        }
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
