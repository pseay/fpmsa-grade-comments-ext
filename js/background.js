chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        //the page has finished loading
        chrome.tabs.sendMessage(tabId, {
            extension: 'assignment-organizer',
            info: 'page loaded',
        });
    }
    if (changeInfo.url) {
        //url has changed
        console.log('url changed');
        chrome.tabs.sendMessage(tabId, {
            extension: 'assignment-organizer',
            info: 'url change',
            url: changeInfo.url,
        });
    }
});