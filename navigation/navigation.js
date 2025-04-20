import {initializeForceGraph} from "../d3_force_graph/simulation.js";

const defaultPage = 'home';

export const attachNavigation = function () {
    window.addEventListener('hashchange', handleRouteChange); // deprecated
    handleRouteChange(); // set default page view

    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const logoButton = document.querySelector('.logo-href');
    const navigationElements = [...navLinks, logoButton];

    navigationElements.forEach(link => {
        const href = link.getAttribute('href');
        const route = href.replace(/^.*#/, '');

        link.addEventListener('click', function (e) {
            e.preventDefault();
            console.log(route);
            handleRouteChange(route);
            updateHashWithoutJump(href);
        });
    });
}


function updateHashWithoutJump(newHash) {
    const url = new URL(window.location);
    url.hash = newHash;
    history.replaceState(null, '', url.toString());
}

function handleRouteChange(newRoute) {
    let currentRoute;
    if (newRoute instanceof String || typeof newRoute === 'string') {
        currentRoute = newRoute;
    } else if (newRoute instanceof Event || newRoute === undefined) {
        currentRoute = window.location.hash.slice(1) || defaultPage;
    } else {
        console.error("Invalid route type: " + typeof newRoute + ": " + newRoute);
        currentRoute = defaultPage;
    }
    currentRoute = currentRoute.replace(/-page$/, '');
    const currentPage = document.getElementById(`${currentRoute}-page`);
    const currentLink = document.getElementById(`${currentRoute}-link`);
    if (!currentPage || !currentLink) {
        console.error(`No element found for route: ${currentRoute}`);
        return;
    }

    console.log(`Current route: ${currentRoute}`); // TODO delete

    // make currentRoute the active page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    currentPage.classList.remove('hidden');

    console.log(`Scrolling to: ${currentPage.id}`); // TODO delete
    currentPage.scrollIntoView({
        inline: 'nearest',
        block: 'start',
        behavior: 'smooth',
    });

    // update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    currentLink.classList.add('active');
    console.log(`Current link: ${currentLink}`); // TODO delete

    if (currentRoute === 'interests-graph') {
        initializeForceGraph();
    }
}