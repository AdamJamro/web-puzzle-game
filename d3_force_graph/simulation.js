
import getLinkColor from './utils/getLinkColor.js'
import getNodeColor from './utils/getNodeColor.js'
import getTextColor from './utils/getTextColor.js'
import getNeighbors from './utils/getNeighbors.js'

import baseNodes from './data/nodes.js'
import baseLinks from './data/links.js'
import * as d3 from "d3";


let nodes = [...baseNodes]
let links = [...baseLinks]

let width = document.getElementById('graph').clientWidth;
// const width = window.innerWidth
let height = document.innerHeight

let svg = d3.select('#graph')
svg.attr('width', width)
   .attr('height', height)

let linkElements,
    nodeElements,
    textElements

// we use svg groups to logically group the elements together
let linkGroup = svg.append('g').attr('class', 'links')
let nodeGroup = svg.append('g').attr('class', 'nodes')
let textGroup = svg.append('g').attr('class', 'texts')

// we use this reference to select/deselect
// after clicking the same element twice
let selectedId

// simulation setup with all forces
let linkForce = d3
  .forceLink()
  .id(link => link.id)
  .strength(link => link.strength)

let simulation = d3
  .forceSimulation()
  .force('link', linkForce)
  .force('charge', d3.forceManyBody().strength(-120))
  .force('center', d3.forceCenter(width / 2, height / 2))

let dragDrop = d3.drag().on('start', (event, node) => {
  node.fx = node.x
  node.fy = node.y
}).on('drag', (event, node) => {
  simulation.alphaTarget(0.7).restart();
  const [x, y] = d3.pointer(event)
  node.fx = x
  node.fy = y
}).on('end', (event, node) => {
  if (!event.active) {
    simulation.alphaTarget(0)
  }
  node.fx = null
  node.fy = null
})

/**---------------------------
 --- UPDATE & INTERACTION ---
 ---------------------------**/

// select node is called on every click
// we either update the data according to the selection
// or reset the data if the same node is clicked twice
function selectNode(selectedNode) {
  if (selectedId === selectedNode.id) {
    selectedId = undefined
    resetData()
    updateSimulation()
  } else {
    selectedId = selectedNode.id
    updateData(selectedNode)
    updateSimulation()
  }

  const neighbors = getNeighbors(selectedNode, baseLinks)

  // we modify the styles to highlight selected nodes
  nodeElements.attr('fill', node => getNodeColor(node, neighbors))
  textElements.attr('fill', node => getTextColor(node, neighbors))
  linkElements.attr('stroke', link => getLinkColor(selectedNode, link))
}

// this helper simple adds all nodes and links
// that are missing, to recreate the initial state
function resetData() {
  const nodeIds = nodes.map(node => node.id)

  baseNodes.forEach((node) => {
    if (nodeIds.indexOf(node.id) === -1) {
      nodes.push(node)
    }
  })

  links = baseLinks
}

// diffing and mutating the data
function updateData(selectedNode) {
  const neighbors = getNeighbors(selectedNode, baseLinks)
  const newNodes = baseNodes.filter(node => neighbors.indexOf(node.id) > -1 || node.level === 1)

  const diff = {
    removed: nodes.filter(node => newNodes.indexOf(node) === -1),
    added: newNodes.filter(node => nodes.indexOf(node) === -1)
  }

  diff.removed.forEach(node => nodes.splice(nodes.indexOf(node), 1))
  diff.added.forEach(node => nodes.push(node))

  links = baseLinks.filter(link => link.target.id === selectedNode.id || link.source.id === selectedNode.id)
}

function updateGraph() {
  // links
  linkElements = linkGroup.selectAll('line').data(links, link => link.target.id + link.source.id)
  linkElements.exit().remove()

  const linkEnter = linkElements.enter().append('line').attr('stroke-width', 1).attr('stroke', 'rgba(50, 50, 50, 0.2)')

  linkElements = linkEnter.merge(linkElements)

  // nodes
  nodeElements = nodeGroup.selectAll('circle').data(nodes, node => node.id);
  nodeElements.exit().remove();

  const nodeEnter = nodeElements
    .enter()
    .append('circle')
    .attr('r', 10)
    .attr('fill', node => node.level === 1 ? 'red' : 'gray')
    .call(dragDrop)
    // we link the selectNode method here
    // to update the graph on every click
    .on('click', selectNode);

  nodeElements = nodeEnter.merge(nodeElements);

  // texts
  textElements = textGroup.selectAll('text').data(nodes, node => node.id);
  textElements.exit().remove();

  const textEnter = textElements
    .enter()
    .append('text')
    .text(node => node.label)
    .attr('font-size', 15)
    .attr('dx', 15)
    .attr('dy', 4);

  textElements = textEnter.merge(textElements);
}

function updateSimulation() {
  updateGraph();

  simulation.nodes(nodes).on('tick', () => {
    linkElements
        .attr('x1', d => Math.max(30, Math.min(width - 30, d.source.x)))
        .attr('y1', d => Math.max(30, Math.min(height - 30, d.source.y || 1000)))
        .attr('x2', d => Math.max(30, Math.min(width - 30, d.target.x)))
        .attr('y2', d => Math.max(30, Math.min(height - 30, d.target.y || 1000)));
    nodeElements
        .attr('cx', d => {
          Math.max(30, Math.min(width - 30, d.x))
        })
        .attr('cy', d => {
          console.log("Debug: " + height / 2);
          Math.max(30, Math.min(height - 30, height / 2))
        });
    textElements
        .attr('x', d => Math.max(30, Math.min(width - 30, d.x)))
        .attr('y', d => Math.max(30, Math.min(height - 30, d.y || 1000)));
  });


  simulation.force('link').links(links);
  simulation.restart();
}

// call the initialize function to trigger the initial render
export function initializeForceGraph() {
  updateSimulation();
}