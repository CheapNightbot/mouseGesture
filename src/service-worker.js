chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === 'goBack') {
        chrome.tabs.goBack(sender.tab.id);
    }

    if (request.action === 'goForward') {
        chrome.tabs.goForward(sender.tab.id);
    }
});
