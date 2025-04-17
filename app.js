// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// import { csv } from "https://cdn.jsdelivr.net/npm/d3-fetch@3/+esm";
import {initializeForceGraph} from "./d3_force_graph/simulation.js";
import {IMGLoader} from "./image_loader/IMGLoader.js";
import * as tf from '@tensorflow/tfjs';
import pako from 'pako'; // or use <script src="pako.min.js"></script> in HTML

const defaultPage = 'home';

window.addEventListener('hashchange', handleRouteChange); // deprecated

document.addEventListener('DOMContentLoaded', function(event) {
  handleRouteChange(); // set default page view
  IMGLoader.init();

  ////




  // const IMAGES_URL = 'https://raw.githubusercontent.com/AdamJamro/AdamJamro/master/train-images-idx3-ubyte.gz';
  // const LABELS_URL = 'https://raw.githubusercontent.com/AdamJamro/AdamJamro/master/train-labels-idx1-ubyte.gz';
  //
  // function fetchRawMNIST() {
  //   return Promise.all([
  //     fetch(IMAGES_URL),
  //     fetch(LABELS_URL)
  //   ])
  //       .then(([imagesResponse, labelsResponse]) => {
  //         return Promise.all([
  //           imagesResponse.arrayBuffer(),
  //           labelsResponse.arrayBuffer()
  //         ]);
  //       })
  //       .then(([imagesBuffer, labelsBuffer]) => {
  //         // Process binary data
  //         const compressedImageData = new Uint8Array(imagesBuffer);
  //         const compressedLabelData = new Uint8Array(labelsBuffer);
  //
  //         const imageData = pako.ungzip(compressedImageData);
  //         const labelData = pako.ungzip(compressedLabelData);
  //
  //         // Parse image header information (IDX format)
  //         const imageMagic = imageData[0] << 24 | imageData[1] << 16 | imageData[2] << 8 | imageData[3];
  //         const numImages = imageData[4] << 24 | imageData[5] << 16 | imageData[6] << 8 | imageData[7];
  //         const numRows = imageData[8] << 24 | imageData[9] << 16 | imageData[10] << 8 | imageData[11];
  //         const numCols = imageData[12] << 24 | imageData[13] << 16 | imageData[14] << 8 | imageData[15];
  //
  //         // Extract actual image data (starting from byte 16)
  //         const images = imageData.slice(16);
  //
  //         // Parse label header information
  //         const labelMagic = labelData[0] << 24 | labelData[1] << 16 | labelData[2] << 8 | labelData[3];
  //         const numLabels = labelData[4] << 24 | labelData[5] << 16 | labelData[6] << 8 | labelData[7];
  //
  //         // Extract actual label data (starting from byte 8)
  //         const labels = labelData.slice(8);
  //
  //         console.log(`Found ${numImages} images with dimensions ${numRows}x${numCols}`);
  //         console.log(`Found ${numLabels} labels`);
  //
  //         // Using the actual dimensions from the file
  //         const tensor = tf.tensor4d(
  //             Array.from(images),
  //             [numImages, numRows, numCols, 1],
  //             'float32'
  //         );
  //
  //         return {
  //           tensor,
  //           images,
  //           labels,
  //           numImages,
  //           imageWidth: numCols,
  //           imageHeight: numRows
  //         };
  //       })
  //       .catch(error => {
  //         console.error('Error fetching MNIST data:', error);
  //         throw error;
  //       });
  // }
  //
  // function renderDigitAsImage(digitData, width = 28, height = 28) {
  //   // Create a canvas element
  //   const canvas = document.createElement('canvas');
  //   canvas.width = width;
  //   canvas.height = height;
  //   const ctx = canvas.getContext('2d');
  //
  //   // Create an ImageData object
  //   const imageData = ctx.createImageData(width, height);
  //
  //   // Fill the imageData with our digit data
  //   for (let i = 0; i < digitData.length; i++) {
  //     const value = digitData[i];
  //     // Set RGB to the same value (grayscale) and Alpha to 255 (fully opaque)
  //     imageData.data[i * 4] = value;     // R
  //     imageData.data[i * 4 + 1] = value; // G
  //     imageData.data[i * 4 + 2] = value; // B
  //     imageData.data[i * 4 + 3] = 255;   // A
  //   }
  //
  //   // Put the image data onto the canvas
  //   ctx.putImageData(imageData, 0, 0);
  //
  //   // Create an Image object and set its source to the canvas data
  //   const image = new Image();
  //   image.src = canvas.toDataURL();
  //
  //   return image;
  // }

// Example usage:
//   function displayMNISTSamples(numSamples = 10) {
    // const container = document.createElement('div');
    // document.body.appendChild(container);

    // fetchRawMNIST()
//         .then(({ images, labels, imageWidth, imageHeight }) => {
//           const pixelsPerImage = imageWidth * imageHeight;
//
//           for (let i = 0; i < numSamples; i++) {
//             const startIdx = i * pixelsPerImage;
//             const digitData = images.slice(startIdx, startIdx + pixelsPerImage);
//             const label = labels[i];
//
//             const image = renderDigitAsImage(digitData, imageWidth, imageHeight);
//
//             // Create a wrapper div for each digit with its label
//             const wrapper = document.createElement('div');
//             wrapper.style.display = 'inline-block';
//             wrapper.style.margin = '10px';
//             wrapper.style.textAlign = 'center';
//
//             // Add the label
//             const labelElement = document.createElement('div');
//             labelElement.textContent = `Label: ${label}`;
//
//             // Add the image
//             wrapper.appendChild(image);
//             wrapper.appendChild(labelElement);
//
//             container.appendChild(wrapper);
//           }
//         })
//         .catch(error => {
//           console.error('Error displaying MNIST samples:', error);
//         });
//   }
//
// displayMNISTSamples();


  /////

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

  document.addEventListener('touchstart', function (e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTimestamp = e.timeStamp;
  });

  document.addEventListener('touchend', function (e) {
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
});



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


// d3 STREAMGRAPH GRAPHIC

/*
const chart = {
  const width = 928;
  const height = 500;

  const x = d3.scaleLinear([0, m - 1], [0, width]);
  const y = d3.scaleLinear([0, 1], [height, 0]);
  const z = d3.interpolateCool;

  const area = d3.area()
      .x((d, i) => x(i))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

  const stack = d3.stack()
      .keys(d3.range(n))
      .offset(offset)
      .order(d3.stackOrderNone);

  function randomize() {
  const layers = stack(d3.transpose(Array.from({length: n}, () => bumps(m, k))));
  y.domain([
    d3.min(layers, l => d3.min(l, d => d[0])),
    d3.max(layers, l => d3.max(l, d => d[1]))
  ]);
  return layers;
}

const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

const path = svg.selectAll("path")
    .data(randomize)
    .join("path")
    .attr("d", area)
    .attr("fill", () => z(Math.random()));

while (true) {
  yield svg.node();

  await path
      .data(randomize)
      .transition()
      .delay(1000)
      .duration(1500)
      .attr("d", area)
      .end();
}
}*/
