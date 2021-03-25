chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        //the page has finished loading
        chrome.tabs.sendMessage(tabId, {
            extension: 'grade-comment-monitor',
            info: 'page loaded',
        });
    }
});
