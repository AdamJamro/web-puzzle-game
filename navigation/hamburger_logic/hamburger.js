// hamburger menu

const hamburger = document.querySelector('.hamburger');
const hamburgerMenu = document.querySelector('.hamburger-menu');
const overlay = document.querySelector('.overlay');
function closeHamburgerDialog() {
    hamburger.classList.remove('active');
    hamburgerMenu.classList.remove('active');
    overlay.classList.remove('active');
}

hamburger.addEventListener('click', function (event) {
    hamburger.classList.toggle('active');
    hamburgerMenu.classList.toggle('active');
    overlay.classList.toggle('active');
});
hamburgerMenu.addEventListener('click', closeHamburgerDialog);
overlay.addEventListener('click', closeHamburgerDialog);



// mobile swipe detection

function handleSwipeRight(speed) {
    if (!hamburger.classList.contains('active')) {
        return;
    }
    if (speed < 0.5) {
        console.log('Swipe too slow');
        return;
    }
    closeHamburgerDialog();
}

function handleSwipeLeft(speed) {
    if (speed < 0.5) {
        console.log('Swipe too slow');
        return;
    }
    hamburger.classList.add('active');
    hamburgerMenu.classList.add('active');
    overlay.classList.add('active');
}


let startX = 0;
let startY = 0;
let startTimestamp = null;

export function attachHamburgerListeners(documentView) {
    documentView.addEventListener('touchstart', function (e) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTimestamp = e.timeStamp;
    });

    documentView.addEventListener('touchend', function (e) {
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;

        const diffX = endX - startX;
        const diffY = endY - startY;

        const timeDiff = e.timeStamp - startTimestamp;
        const speed = diffX * diffX + diffY * diffY / timeDiff / timeDiff;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 50) {
                console.log('Swiped right');
                handleSwipeRight(speed);
            } else if (diffX < -50) {
                console.log('Swiped left');
                handleSwipeLeft(speed);
            }
        } else {
            // Vertical swipe
            if (diffY > 50) {
                console.log('Swiped down');
            } else if (diffY < -50) {
                console.log('Swiped up');
            }
        }
    });
}
