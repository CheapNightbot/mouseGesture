const contextMenuHandler = (event) => event.preventDefault();

let mouseDown = false;
let startX;
let previousX = 0;
let previousY = 0;
let mouseTrail;
let hintText;


document.addEventListener('mousedown', (event) => {
    // Right mouse button
    if (event.button === 2) {
        mouseDown = true;
        startX = event.clientX;

        mouseTrail = document.createElement('div');
        mouseTrail.id = 'mouse-trail';
        document.body.appendChild(mouseTrail);

        previousX = event.clientX;
        previousY = event.clientY;

        hintText = document.createElement('p');
        hintText.className = 'mouse-gesture-hint';
        hintText.style.display = 'none';
        document.body.appendChild(hintText);
    }
});

document.addEventListener('mousemove', (event) => {
    if (mouseDown) {
        const line = document.createElement('div');
        line.className = 'mouse-trail-line';
        line.style.left = previousX + 'px';
        line.style.top = previousY + 'px';

        let distance = Math.sqrt(Math.pow(event.clientX - previousX, 2) + Math.pow(event.clientY - previousY, 2));
        line.style.width = distance + 'px';

        let angle = Math.atan2(event.clientY - previousY, event.clientX - previousX);
        line.style.transform = 'rotate(' + angle + 'rad)';

        mouseTrail.appendChild(line);
        hintText.style.display = 'flex';

        previousX = event.clientX;
        previousY = event.clientY;

        if ((startX - previousX) > 100) {
            hintText.innerHTML = '←<br>Go Back';
        } else if ((startX - previousX) < -100) {
            hintText.innerHTML = '→<br>Forward';
        } else {
            hintText.innerHTML = 'Invalid gesture';
        }

        // Prevent the context menu from appearing
        document.addEventListener('contextmenu', contextMenuHandler);
    } else {
        // Show the context menu as normal
        document.removeEventListener('contextmenu', contextMenuHandler);
    }
});


// Only do actions when the mouse button is released
document.addEventListener('mouseup', (e) => {
    // Right mouse button
    if (e.button === 2) {
        mouseDown = false;
        if (mouseTrail) {
            document.body.removeChild(mouseTrail);
            mouseTrail = null;
        }
        if (hintText) {
            document.body.removeChild(hintText);
            hintText = null;
        }

        // Check if moved backward (to the left)
        if (previousX < startX - 100) {
            chrome.runtime.sendMessage({ action: 'goBack' });

            // Check if moved forward (to the right)
        } else if (previousX > startX + 100) {
            chrome.runtime.sendMessage({ action: 'goForward' });
        }
    }
});
