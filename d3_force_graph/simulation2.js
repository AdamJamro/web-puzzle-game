// d3 GRAPH


// function parseCSV(csvString) {
//   const rows = csvString.trim().split('\n');
//   const header = rows[0].split(',');
//
//   return rows.slice(1).map(row => {
//     const values = row.replace(/s$/, '').split(',');
//     return {
//       source: values[0],
//       target: values[1],
//       value: parseFloat(values[2])
//     };
//   });
// }
import {csv} from "d3";
import * as d3 from "d3";

const data = csv('./data/interests-graph.csv',
    function(row) {
        return {
            source: row['interestA'],
            target: row['interestB'],
            value: parseFloat(row['weight'])
        };
    });
console.log("awaiting data start: " + data);
const relationships = await data;
console.log("awaiting data end: " + relationships);


// Create a set of all unique animals
const interestsSet = new Set();
relationships.forEach(rel => {
    interestsSet.add(rel.source);
    interestsSet.add(rel.target);
});
console.log(relationships);

const nodes = Array.from(interestsSet).map(interest => ({id : interest}));

const links = relationships.map(relation => ({
    source: nodes.indexOf(relation.source),
    target: nodes.indexOf(relation.target),
    value: parseFloat(relation.value)
}));

const colorScale = d3.scaleOrdinal(['#e74c3c', '#3498db', '#2ecc71', '#f39c12'])
    .domain(nodes)

// Set up the SVG
const width = document.getElementById('graph').clientWidth;
const height = 500;

const svg = d3.select('#graph')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const tooltip = d3.select('#tooltip');

const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-20)) //
    .force('link', d3.forceLink(links).id(d => nodes.indexOf(d.id)).distance(d => (1 - d.value) * 200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(50));

const link = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-width', d => d.value * 5);

const node = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', 25)
    .attr('fill', d => colorScale(d.id))
    .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

const label = svg.append('g')
    .attr('class', 'node-labels')
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .text(d => d.id);

link.on('mouseover', function(event, d) {
    const sourceIdx = nodes[d.source.index];
    const targetIdx = nodes[d.target.index];

    tooltip
        .style('opacity', 1)
        .html(`${sourceIdx} to ${targetIdx}: ${d.value.toFixed(2)} relatedness`)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 30) + 'px');
})
    .on('mouseout', function() {
        tooltip.style('opacity', 0);
    });
//
node.on('mouseover', function(event, d) {
    tooltip
        .style('opacity', 1)
        .html(`${d.id}`)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 30) + 'px');

    // Highlight connected links
    link.style('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.2);})
    .on('mouseout', function() {
        tooltip.style('opacity', 0);
        link.style('stroke-opacity', 0.8);
    });

simulation.on('tick', () => {
    link.attr('x1', d => Math.max(30, Math.min(width - 30, d.source.x)))
        .attr('y1', d => Math.max(30, Math.min(height - 30, d.source.y)))
        .attr('x2', d => Math.max(30, Math.min(width - 30, d.target.x)))
        .attr('y2', d => Math.max(30, Math.min(height - 30, d.target.y)));
    node.attr('cx', d => {console.log("Debug: " + d.x); Math.max(30, Math.min(width - 30, d.x))})
        .attr('cy', d => Math.max(30, Math.min(height - 30, d.y)));
    label.attr('x', d => Math.max(30, Math.min(width - 30, d.x)))
        .attr('y', d => Math.max(30, Math.min(height - 30, d.y)));
});

function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}
function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

const thresholdSlider = document.getElementById('threshold');
const thresholdValue = document.getElementById('threshold-value');
thresholdSlider.addEventListener('input', function() {
    const threshold = parseFloat(this.value);
    thresholdValue.textContent = threshold.toFixed(2);

    // Filter links based on threshold
    link.style('display', d => d.value >= threshold ? 'block' : 'none');

    // Update the simulation
    simulation.force('link').links(links.filter(l => l.value >= threshold));
    simulation.alpha(0.3).restart();
});

window.addEventListener('resize', function() {
    const newWidth = document.getElementById('graph').clientWidth;
    svg.attr('width', newWidth);
    simulation.force('center', d3.forceCenter(newWidth / 2, height / 2));
    simulation.alpha(0.3).restart();
});

document.getElementById('interests-graph-page').addEventListener('click', function() {
    simulation.tick();
});
