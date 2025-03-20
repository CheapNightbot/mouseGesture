chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === 'goBack') {
        chrome.tabs.goBack(sender.tab.id);
    }

    if (request.action === 'goForward') {
        chrome.tabs.goForward(sender.tab.id);
    }

    if (request.action === 'refresh') {
        chrome.tabs.reload(sender.tab.id);
    }

    if (request.action === 'closeTab') {
        chrome.tabs.remove(sender.tab.id);
    }

    if (request.action === 'scrollUp') {
        chrome.tabs.executeScript(sender.tab.id, { code: 'window.scrollBy(0, -100)' });
    }

    if (request.action === 'scrollDown') {
        chrome.tabs.executeScript(sender.tab.id, { code: 'window.scrollBy(0, 100)' });
    }
});
