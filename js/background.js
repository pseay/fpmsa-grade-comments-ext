chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //TODO: add another script to automatically log in
    //TODO: learn how to make variables stored (not just in localStorage)
    //NOTE: maybe make an interface for storage for the whole program to replace localStorage (not necessary)
    if (changeInfo.status === "complete") {
        //the page has finished loading
        chrome.tabs.sendMessage(tabId, {
            extension: "assignment-organizer",
            info: "page loaded"
        });
    }
    if (changeInfo.url) {
        //url has changed
        console.log("url changed");
        chrome.tabs.sendMessage(tabId, {
            extension: "assignment-organizer",
            info: "url change",
            url: changeInfo.url
        });
    }
});
