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

        const processRecordData = (recordId, info, masterId = null, debugLabel = null) => {
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

            // 6. DATE VALIDATION (Relaxed for Debug)
            if (info.time_start) {
                const apptDatePart = info.time_start.split(' ')[0]; // "2023-10-27"
                const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi' });

                // If we are in "debug_fallback" mode, we might want to allow other dates, 
                // BUT strict requirement was "Today-only". 
                // However, user said "process ALL records... mark with debug_date".
                // So if debugLabel is set, we bypass strict today check? 
                // Let's keep strict check for now unless explicitly asked to ignore it for valid data.
                // Actually, user said: "Temporary Override: ... process ALL records ... mark them".
                // So we will ALLOW them if debugLabel is present.
                if (apptDatePart !== todayStr && !debugLabel) {
                    return;
                }
            }

            // 7. Master ID Handling
            let finalMasterId = masterId;
            if (!finalMasterId && info.master_id) finalMasterId = info.master_id;
            finalMasterId = finalMasterId ? String(finalMasterId) : null;

            const appointment = {
                external_id: externalId,
                client_name: clientName,
                service_name: serviceName,
                service_price: price,
                status: status,
                appointment_time: info.time_start ? new Date(info.time_start).toISOString() : new Date().toISOString(),
                master_id: finalMasterId,
                debug_date: debugLabel ? debugLabel : undefined
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

            // 1. Check data.masters.records.data
            if (data.masters.records && data.masters.records.data) {
                const recordsData = data.masters.records.data;
                const availableKeys = Object.keys(recordsData);
                // console.log("!!! DEBUG: Found keys in records.data:", availableKeys);

                /* NEW: Detect if keys are Master IDs (Numeric) or Dates */
                const isNumericKey = availableKeys.some(k => !isNaN(Number(k)) && k.length < 15); // Simple heuristic

                if (isNumericKey) {
                    console.log("Dikidi Bridge: Detected Master ID keys structure.");
                    // Iterate Master IDs -> [Appointments]
                    availableKeys.forEach(masterId => {
                        const masterGroup = recordsData[masterId];
                        if (!masterGroup) return;
                        Object.entries(masterGroup).forEach(([apptId, apptData]) => {
                            const candidate = apptData.info ? apptData.info : apptData;
                            const hasId = candidate.id || apptId;
                            if (hasId) {
                                processRecordData(hasId, candidate, masterId); // Standard process
                                foundCount++;
                            }
                        });
                    });
                }
                // STANDARD: Date Keys
                else {
                    // A. Exact Match
                    if (recordsData[todayStr]) {
                        console.log("Dikidi Bridge: Exact match for today:", todayStr);
                        todayAppointments = recordsData[todayStr];
                        // Process Today
                        if (todayAppointments) {
                            Object.entries(todayAppointments).forEach(([masterId, masterGroup]) => {
                                if (!masterGroup) return;
                                Object.entries(masterGroup).forEach(([apptId, apptData]) => {
                                    const candidate = apptData.info ? apptData.info : apptData;
                                    const hasId = candidate.id || apptId;
                                    if (hasId) {
                                        processRecordData(hasId, candidate, masterId);
                                        foundCount++;
                                    }
                                });
                            });
                        }
                    }
                    // B. Smart Match (Contains Day & Month)
                    else {
                        const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi', day: '2-digit' });
                        const month = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi', month: '2-digit' });
                        const match = availableKeys.find(k => k.includes(day) && k.includes(month));

                        if (match) {
                            console.log("Dikidi Bridge: Smart Match found:", match);
                            const matchedGroup = recordsData[match];
                            Object.entries(matchedGroup).forEach(([masterId, masterGroup]) => {
                                if (!masterGroup) return;
                                Object.entries(masterGroup).forEach(([apptId, apptData]) => {
                                    const candidate = apptData.info ? apptData.info : apptData;
                                    const hasId = candidate.id || apptId;
                                    if (hasId) {
                                        processRecordData(hasId, candidate, masterId);
                                        foundCount++;
                                    }
                                });
                            });
                        } else {
                            // C. Fallback: Process ALL keys
                            console.warn("Dikidi Bridge: No Today match found. Processing ALL available keys with debug flag.");
                            availableKeys.forEach(key => {
                                const group = recordsData[key];
                                if (!group) return;
                                // In Date-Key structure: group is { masterId: { apptId: ... } }
                                Object.entries(group).forEach(([masterId, masterRecords]) => {
                                    if (!masterRecords) return;
                                    Object.entries(masterRecords).forEach(([apptId, apptData]) => {
                                        const candidate = apptData.info ? apptData.info : apptData;
                                        const hasId = candidate.id || apptId;
                                        if (hasId) {
                                            processRecordData(hasId, candidate, masterId, `fallback_${key}`);
                                            foundCount++;
                                        }
                                    });
                                });
                            });
                        }
                    }
                }
            }
            // 2. Fallback: Check data.masters.data
            else if (data.masters.data) {
                console.log("Dikidi Bridge: 'masters.data' path found. Processing all.");
                todayAppointments = data.masters.data;
                if (todayAppointments) {
                    Object.values(todayAppointments).forEach(masterGroup => {
                        if (!masterGroup) return;
                        Object.entries(masterGroup).forEach(([apptId, apptData]) => {
                            const candidate = apptData.info ? apptData.info : apptData;
                            const hasId = candidate.id || apptId;
                            if (hasId) {
                                processRecordData(hasId, candidate);
                                foundCount++;
                            }
                        });
                    });
                }
            }
        }

        // Fallback Logging if nothing found
        if (foundCount === 0) {
            console.log("!!! STEP 1 FAIL: URL matched but extraction logic returned null for", url);
            // SPECIFIC DEBUG FOR JOURNAL
            if (data.masters && data.masters.records && data.masters.records.data) {
                console.log("Available Keys in Response:", Object.keys(data.masters.records.data));
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
