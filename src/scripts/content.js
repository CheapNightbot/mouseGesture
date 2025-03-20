const contextMenuHandler = (event) => event.preventDefault();

let gesturePoints = [{x: 0, y: 0}];
let detectedGesture;
let hintText;
let mouseDown = false;
let mouseTrail;
let previousX = 0;
let previousY = 0;

// Ramer-Douglas-Peucker algorithm
// https://rosettacode.org/wiki/Ramer-Douglas-Peucker_line_simplification#JavaScript
const RDP = (l, eps) => {
    const last = l.length - 1;
    const p1 = l[0];
    const p2 = l[last];
    const x21 = p2.x - p1.x;
    const y21 = p2.y - p1.y;

    const [dMax, x] = l.slice(1, last)
        .map(p => Math.abs(y21 * p.x - x21 * p.y + p2.x * p1.y - p2.y * p1.x))
        .reduce((p, c, i) => {
            const v = Math.max(p[0], c);
            return [v, v === p[0] ? p[1] : i + 1];
        }, [-1, 0]);

    if (dMax > eps) {
        return [...RDP(l.slice(0, x + 1), eps), ...RDP(l.slice(x), eps).slice(1)];
    }
    return [l[0], l[last]]
};

document.addEventListener('mousedown', (event) => {
    // Right mouse button
    if (event.button === 2) {
        mouseDown = true;

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

        gesturePoints.push({ x: event.clientX, y: event.clientY });
        gesturePoints = RDP(gesturePoints, 1);

        // Calculate angles between consecutive points
        const angles = [];
        for (let i = 1; i < gesturePoints.length; i++) {
            const p1 = gesturePoints[i - 1];
            const p2 = gesturePoints[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI); // Angle in degrees
            angles.push(angle);
        }

        // Initialize an array to store the sequence of directions
        const gestureSequence = [];

        // Analyze the angles to recognize the gesture
        angles.forEach(angle => {
            if (angle > 45 && angle <= 135) {
                gestureSequence.push("Down");
            } else if (angle >= -45 && angle <= 45) {
                gestureSequence.push("Right");
            } else if (angle >= -135 && angle <= -45) {
                gestureSequence.push("Up");
            } else if ((angle > 135 && angle <= 180) || (angle >= -180 && angle <= -135)) {
                gestureSequence.push("Left");
            }
        });

        // Remove consecutive duplicates to simplify the sequence
        const simplifiedSequence = gestureSequence.filter(
            (dir, index) => index === 0 || dir !== gestureSequence[index - 1]
        )

        // Recognize gestures based on the simplified sequence
        if (simplifiedSequence.join(" → ") === "Down → Right") {
            hintText.innerHTML = '↳<br>Close tab';
            detectedGesture = "closeTab";
        } else if (simplifiedSequence.join(" → ") === "Right → Down") {
            hintText.innerHTML = '↴<br>Refresh';
            detectedGesture = "refresh";
        } else if (simplifiedSequence.length === 1 && simplifiedSequence[0] === "Right") {
            hintText.innerHTML = '→<br>Forward';
            detectedGesture = "goForward";
        } else if (simplifiedSequence.length === 1 && simplifiedSequence[0] === "Left") {
            hintText.innerHTML = '←<br>Go Back';
            detectedGesture = "goBack";
        } else if (simplifiedSequence.length === 1 && simplifiedSequence[0] === "Up") {
            hintText.innerHTML = '↑<br>Scroll to top';
            detectedGesture = "scrollUp";
        } else if (simplifiedSequence.length === 1 && simplifiedSequence[0] === "Down") {
            hintText.innerHTML = '↓<br>Scroll to bottom';
            detectedGesture = "scrollDown";
        } else {
            hintText.innerHTML = 'Invalid gesture';
            detectedGesture = "invalid";
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
        if (detectedGesture === "goBack") {
            chrome.runtime.sendMessage({ action: 'goBack' });
            gesturePoints = []; // reset gesturePoints once gesture is complete
            // Check if moved forward (to the right)
        } else if (detectedGesture === "goForward") {
            chrome.runtime.sendMessage({ action: 'goForward' });
            gesturePoints = []; // reset gesturePoints once gesture is complete
        }
        // Check if moved up
        else if (detectedGesture === "scrollUp") {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            gesturePoints = []; // reset gesturePoints once gesture is complete
        }
            // Check if moved down
        else if (detectedGesture === "scrollDown") {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
            gesturePoints = []; // reset gesturePoints once gesture is complete
        }
        // Check if moved down then right
        else if (detectedGesture === "refresh") {
            chrome.runtime.sendMessage({ action: 'refresh' });
            gesturePoints = []; // reset gesturePoints once gesture is complete
        }
            // Check if moved down then right
        else if (detectedGesture === "closeTab") {
            chrome.runtime.sendMessage({ action: 'closeTab' });
            gesturePoints = []; // reset gesturePoints once gesture is complete
        }
        else {
            gesturePoints = []; // reset gesturePoints
        }
    }
});
