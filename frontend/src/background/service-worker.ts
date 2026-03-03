chrome.runtime.onInstalled.addListener(()=>{
    console.log("Extension Installed!!!");
})

chrome.action.onClicked.addListener((tab)=>{
    chrome.sidePanel.open({tabId: tab.id!})
})

console.log("hello world from the extension")

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    
    if (message.type === "PAGE_DATA") {
        console.log("Received:", message.payload);
        sendResponse({ status: "received" });
    }

    return true; // tells Chrome to keep channel open for async response
})