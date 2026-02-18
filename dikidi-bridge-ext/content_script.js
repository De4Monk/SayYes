// content_script.js

console.log("!!! SHADOW AGENT START:", window.location.href);

// Inject the network interceptor
const injectScript = () => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    console.log("Dikidi Bridge: Interceptor Injected into", window.location.href);
};

injectScript();

// Listen for CustomEvent from the injected script
document.addEventListener('DIKIDI_SYNC_EVENT', (event) => {
    const data = event.detail;
    console.log("!!! BRIDGE STEP 2 (Content): Received CustomEvent", data);

    // Forward to background script
    chrome.runtime.sendMessage({ type: 'SYNC_APPOINTMENT', payload: data });
});

console.log("!!! DIKIDI BRIDGE: CustomEvent Listener Active");

// Keep the DOM Logging for context, just in case
const allElements = document.querySelectorAll('*');
console.log("Total Elements in this frame:", allElements.length);
if (allElements.length > 10) {
    console.log("Preview Body Text:", document.body.innerText.substring(0, 200));
}
