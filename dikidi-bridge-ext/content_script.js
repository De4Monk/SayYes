// content_script.js

console.log("Dikidi Bridge: Content Script Loaded");

// Function to extract data from an open appointment modal or card
// Note: Selectors will need to be adjusted based on actual Dikidi DOM structure.
// This is a heuristic implementation.
const extractAppointmentData = (node) => {
    try {
        // 1. Check if this node is an appointment card or modal by looking for the payment block or specific inputs
        const paymentInfoBlock = node.querySelector('.payment-info-block');
        const clientInput = node.querySelector('input[name="client_name"]');

        if (!paymentInfoBlock && !clientInput) return null; // Not an appointment block

        // 2. Extract Data
        // Client Name (It's an input field, so we need .value, not .innerText)
        const clientName = clientInput ? clientInput.value : 'Unknown Client';

        // Service Name (Inside a span with class 'filter-option' next to 'Complex:')
        // We need to find the span containing the service name. Often the first .filter-option pull-left
        const serviceSpans = node.querySelectorAll('.filter-option.pull-left');
        let serviceName = 'Unknown Service';
        if (serviceSpans.length > 0) {
            // Heuristic: The service name usually contains a colon or is the first option
            serviceName = serviceSpans[0].innerText.trim();
        }

        // External ID (Extract from the payment edit link's data-href)
        const editLink = node.querySelector('a.payments-edit');
        let externalId = null;
        if (editLink && editLink.getAttribute('data-href')) {
            const href = editLink.getAttribute('data-href');
            // Example: /ru/owner/ajax/sales/form/139875458?company=887914 -> extracts 139875458
            const match = href.match(/\/form\/(\d+)\?/);
            if (match) externalId = match[1];
        }

        if (!externalId) return null;

        // 3. Status Determination (Based on Debt and Paid values)
        const costElement = node.querySelector('.payment-cost');
        const paidElement = node.querySelector('.payment-paid span');

        let status = 'in_progress';
        let price = 0;

        if (costElement && paidElement) {
            price = parseFloat(costElement.innerText.replace(/[^\d.-]/g, ''));
            const paid = parseFloat(paidElement.innerText.replace(/[^\d.-]/g, ''));

            if (paid >= price && price > 0) {
                status = 'paid';
            }
        }

        // If we don't have a status we care about, exit
        if (status !== 'paid' && status !== 'in_progress') return null;

        // 4. Time
        // Looking for the time in a generic span, usually before the service or name
        // Since it's hard to pin down without a specific class, we'll send the current time, 
        // as the event is happening *now* when the status changes.
        const appointmentTime = new Date().toISOString();

        return {
            external_id: externalId,
            client_name: clientName,
            service_name: serviceName,
            service_price: price,
            status: status,
            appointment_time: appointmentTime
        };

    } catch (e) {
        console.error("Dikidi Bridge: Extraction Error", e);
        return null;
    }
};

// Observer Callback
const observerCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check if node itself is an appointment card or modal
                    const data = extractAppointmentData(node);
                    if (data) {
                        console.log("Dikidi Bridge: Detected relevant appointment update", data);
                        chrome.runtime.sendMessage({ type: 'SYNC_APPOINTMENT', payload: data });
                    }

                    // Also check descendants if it's a large container update
                    // node.querySelectorAll('.appointment-card').forEach(...)
                }
            });
        }
        // distinct attribute changes (like class change for status)
        else if (mutation.type === 'attributes' && (mutation.target.classList.contains('appointment-card') || mutation.target.classList.contains('status-badge'))) {
            // Re-evaluate parent/target
            // const data = extractAppointmentData(mutation.target.closest('.appointment-card'));
            // ...
        }
    }
};

// Initialize Observer
const targetNode = document.body; // Watch the whole body for modals/dynamic content
const config = { attributes: true, childList: true, subtree: true };
const observer = new MutationObserver(observerCallback);
observer.observe(targetNode, config);
