// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// import { csv } from "https://cdn.jsdelivr.net/npm/d3-fetch@3/+esm";
// import {initializeForceGraph} from "./d3_force_graph/simulation.js";
// import * as tf from '@tensorflow/tfjs';
// import pako from 'pako'; // or use <script src="pako.min.js"></script> in HTML
import {IMGLoader} from "/image_loader/IMGLoader.js";
import {attachHamburgerListeners} from "/navigation/hamburger_logic/hamburger.js";
import {Game} from "/puzzle-game/game.js";
import {attachNavigation} from "/navigation/navigation.js"


document.addEventListener('DOMContentLoaded', function(event) {
  IMGLoader.init();

  // optionally todo init game each time game page is loaded
  Game.initGame();

  attachNavigation();
  attachHamburgerListeners(document);
});




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
