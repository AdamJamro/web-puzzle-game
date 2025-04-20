import {styleVariables} from "./_style_variables.js";

export const Game = {
    elements: {
        canvas: document.getElementById('puzzle-canvas'),
        gameFrame: document.getElementById('puzzle-game-container'),
        ctx: null,
        moveCountDisplay: document.getElementById('moveCount'),
        shuffleButton: document.getElementById('shuffleButton'),
        solveButton: document.getElementById('solveButton'),
        expandGridButton: document.getElementById('plusButton'),
        shrinkGridButton: document.getElementById('minusButton'),
    },
    config: {
        gridSize: 3,
        tileSize: 100,
    },
    state: {
        emptyTile: 9,
        board: [],
        moveCount: 0,
        solved: true,
        hoveredTile: null,
    },
    // animation: {
    //     lifecycleStage: 'init',
    //     floating_rectangle: {...},
    //     animationState: {...}
    // },
    animations: [],
    initGame(params) {
        this.config = { ...this.config, ...params };
        console.log(this.config);
        // localStorage.clear();

        this.elements.ctx = this.elements.canvas.getContext('2d');

        this.initBoard();

        this.elements.canvas.addEventListener('click', (e) => { this.handleCanvasClick(e) });
        this.elements.shuffleButton.addEventListener('click', (e) => { this.shuffle()} );
        this.elements.solveButton.addEventListener('click', (e) => { this.solveBoard() } );
        this.elements.expandGridButton.addEventListener('click', (e) => {
            this.changeBoardSize({ gridSize: this.config.gridSize + 1 });
        });
        this.elements.shrinkGridButton.addEventListener('click', (e) => {
            if (this.config.gridSize > 2) {
                this.changeBoardSize({ gridSize: this.config.gridSize - 1 });
            }
        });
        window.addEventListener('resize', (e) => {
            this.elements.ctx.clearRect(
                0, 0,
                this.config.tileSize * this.config.gridSize,
                this.config.tileSize * this.config.gridSize
            );
            this.recalculateCanvasSize();

            this.draw();
        });
        const highlightTile = (mouseX, mouseY) => {
            const col = Math.floor(mouseX / this.config.tileSize);
            const row = Math.floor(mouseY / this.config.tileSize);
            const rows = this.config.gridSize;
            const cols = this.config.gridSize;
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                this.state.hoveredTile = { col: col, row: row, };
            }
        }
        this.elements.canvas.addEventListener('touchstart', (event) => {
            const rect = this.elements.canvas.getBoundingClientRect();
            const mouseX = event.touches[0].clientX - rect.left;
            const mouseY = event.touches[0].clientY - rect.top;

            highlightTile(mouseX, mouseY);
        });
        this.elements.canvas.addEventListener('mousemove', (event) => {
            const rect = this.elements.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            highlightTile(mouseX, mouseY);
        });
        this.elements.canvas.addEventListener('mouseleave', (event) => {
            this.state.hoveredTile = null;
        });
    },
    initBoard() {
        if (!this.loadBoardState()) {
            this.state.board = Array.from({ length: this.config.gridSize * this.config.gridSize }, (_, i) => i + 1);
            this.state.emptyTile = this.state.board[this.state.board.length - 1];
            this.state.moveCount = 0;
            this.state.solved = true;
        }
        this.elements.moveCountDisplay.textContent = String(this.state.moveCount);

        this.recalculateCanvasSize();
        this.draw();
    },
    solveBoard() {
       this.state.solved = true;
       localStorage.removeItem(`game-state-${this.config.gridSize}`);
       this.initBoard();
    },
    changeBoardSize(config) {
        this.config.gridSize = config.gridSize;
        // this.config.tileSize = this.elements.canvas.width / this.config.gridSize;
        localStorage.setItem('default-game-size', this.config.gridSize.toString());
        this.initBoard();
    },
    saveBoardState() {
        console.log('saving to:' + `game-state-${this.config.gridSize}`)
        localStorage.setItem(`game-state-${this.config.gridSize}`, JSON.stringify({
            state: { ...this.state, hoveredTile: null},
            config: { ...this.config }
        }));
        localStorage.setItem('default-game-size', this.config.gridSize.toString());
    },
    loadBoardState() {
        let loadSuccess = false;
        const defaultGameSize = parseInt(localStorage.getItem('default-game-size')) || 3;
        const storedState = JSON.parse(localStorage.getItem(`game-state-${defaultGameSize}`));
        if (storedState) {
            this.state = { ...this.state, ...storedState.state };
            this.config = { ...this.config, ...storedState.config };
            loadSuccess = true;
        }
        return loadSuccess;
    },
    draw() {
        this.animations.forEach(animation => {
            animation.lifecycleStage = 'delete';
        });
        this.animations = [];

        this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        // this.elements.ctx.fillStyle = styleVariables.backgroundColor;
        // this.elements.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);

        console.log('length of board:', this.state.board);
        console.log('empty tile:', this.state.emptyTile);
        for (let i = 0; i < this.state.board.length; i++) {
            // console.log('drawing tile:', this.state.board[i]);
            const row = Math.floor(i / this.config.gridSize);
            const col = i % this.config.gridSize;
            const x = col * this.config.tileSize;
            const y = row * this.config.tileSize;

            const floating_rectangle = {
                width: this.config.tileSize,
                height: this.config.tileSize,
                x: x,
                y: y,
                col: col,
                row: row,
                digit: this.state.board[i],
                floatAmplitude: 0.5,
                floatSpeed: this.randomBetween(0.05, 0.10),
                gradientColors: this.smoothColorList(styleVariables.solvedGradientColors),
                displayColorCount: 3,
            }
            const animationState = {
                time: this.randomBetween(0.0, 1.0),
                currentColorIndex: 0,
                colorTransition: 0.0,
                colorTransitionSpeed: this.randomBetween(0.035, 0.065),
            };
            this.animations.push({
                animationState: animationState,
                lifecycleStage: 'init',
                floating_rectangle: floating_rectangle,
            })
        }
        this.animations.forEach(animation => {
            if (animation.lifecycleStage !== 'init') {
                return;
            }
            this.animate(animation);
        });
    },
    animate(animation) {
        const floating_rectangle = animation.floating_rectangle;
        const animationState = animation.animationState;

        this.elements.ctx.clearRect(
            floating_rectangle.x,
            floating_rectangle.y,
            floating_rectangle.width,
            floating_rectangle.height
        );

        if (animation.lifecycleStage === 'delete') {
            if (this.state.board[this.tileGridToNumber({
                col: floating_rectangle.col,
                row: floating_rectangle.row,
            })] === this.state.emptyTile) {
                console.log('clearing the new empty tile');
            }
            console.log('deleting animation');
            return;
        }

        if (floating_rectangle.digit === this.state.emptyTile) {
            return;
        }

        animation.lifecycleStage = 'running';

        const floatY = Math.sin(animationState.time) * floating_rectangle.floatAmplitude;
        const floatX = (Math.cos(animationState.time) ** 2) * floating_rectangle.floatAmplitude;

        if (!this.state.solved) {
            if (this.state.hoveredTile &&
                floating_rectangle.col === this.state.hoveredTile.col && floating_rectangle.row === this.state.hoveredTile.row) {
                if (animationState.time <= 1){
                    animationState.colorTransition += (Math.exp(-animationState.time) + 1) * animationState.colorTransitionSpeed;
                    // console.log('hovered tile:', floating_rectangle.digit);
                    // console.log('animation time:', animationState.time);
                    animationState.time += 0.01;
                } else {
                    animationState.colorTransition += animationState.colorTransitionSpeed;
                }
            } else {
                animationState.time = 0;
                animationState.colorTransition = 0;
                animationState.currentColorIndex = 0;
            }
        } else {
            animationState.time += floating_rectangle.floatSpeed;
            animationState.colorTransition += animationState.colorTransitionSpeed;
        }


        const gradient = this.elements.ctx.createLinearGradient(
            floating_rectangle.x,
            floating_rectangle.y + floatY,
            floating_rectangle.x + floating_rectangle.width - 2 * styleVariables.tilePaddingX,
            floating_rectangle.y + floating_rectangle.height - 2 * styleVariables.tilePaddingY,
        );

        if (animationState.colorTransition >= 1) {
            animationState.colorTransition = 0;
            animationState.currentColorIndex = (animationState.currentColorIndex + 1) % floating_rectangle.gradientColors.length;
        }

        const colorCount = floating_rectangle.displayColorCount + 1;
        const colorList = [];

        for (let i = 0; i < colorCount; i++) {
            colorList.push(
                floating_rectangle.gradientColors[
                    (animationState.currentColorIndex + i)
                    % floating_rectangle.gradientColors.length
                ]
            );
        }

        let currentColor = colorList[0];
        colorList.slice(1).forEach((color, index) => {
            const interpolatedColor = this.interpolateColor(currentColor, color, animationState.colorTransition);
            // gradient.addColorStop(index / (colorCount - 1), interpolatedColor);
            gradient.addColorStop((index + 1) / (colorCount - 1), interpolatedColor);
            currentColor = color;
        });

        this.elements.ctx.fillStyle = gradient;
        this.elements.ctx.beginPath();
        this.elements.ctx.roundRect(
            floating_rectangle.x + floatX,
            floating_rectangle.y + floatY,
            floating_rectangle.width - floating_rectangle.floatAmplitude * 2,
            floating_rectangle.height - floating_rectangle.floatAmplitude * 2,
            10);
        this.elements.ctx.fill();


        // Draw tile number
        if (!this.state.solved) {
            this.elements.ctx.fillStyle = styleVariables.tileTextColor;
            this.elements.ctx.font = `bold ${this.config.tileSize / 3}px Arial`;
            this.elements.ctx.textAlign = 'center';
            this.elements.ctx.textBaseline = 'middle';
            this.elements.ctx.fillText(
                floating_rectangle.digit,
                floating_rectangle.x + this.config.tileSize / 2 + floatX,
                floating_rectangle.y + this.config.tileSize / 2 + floatY,
            );
        }

        // this.elements.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        // this.elements.ctx.shadowBlur = 15;
        // this.elements.ctx.shadowOffsetX = 10;

        // if (floating_rectangle.digit === this.state.hoveredTile.x) {
        //
        // }

        if (animation.lifecycleStage === 'running') {
            requestAnimationFrame(() => {
                this.animate(animation)
            });
        }
    },
    // Helper function to interpolate between two colors
    interpolateColor(color1, color2, factor) {
        // Convert hex to rgb
        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);

        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);

        // Interpolate
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));

        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },
    shuffle() {
        // Make a lot of random moves to shuffle
        const moves = 50 * this.config.gridSize ** 2;
        for (let i = 0; i < moves; i++) {
            const emptyIndex = this.state.board.indexOf(this.state.emptyTile);
            const emptyRow = Math.floor(emptyIndex / this.config.gridSize);
            const emptyCol = emptyIndex % this.config.gridSize;

            // Get possible moves (up, down, left, right)
            const possibleMoves = [];

            if (emptyRow > 0) possibleMoves.push(-this.config.gridSize); // up
            if (emptyRow < this.config.gridSize - 1) possibleMoves.push(this.config.gridSize); // down
            if (emptyCol > 0) possibleMoves.push(-1); // left
            if (emptyCol < this.config.gridSize - 1) possibleMoves.push(1); // right

            // Choose a random direction
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const tileToMove = emptyIndex + randomMove;

            // Swap
            [this.state.board[emptyIndex], this.state.board[tileToMove]] = [this.state.board[tileToMove], this.state.board[emptyIndex]];
        }

        this.state.moveCount = 0;
        this.elements.moveCountDisplay.textContent = String(this.state.moveCount);
        this.state.solved = false;
        this.checkSolved();
        if (this.state.solved) {
            setTimeout(() => this.shuffle(), 0);
            return;
        }
        this.draw();
    },
    checkSolved() {
        console.log('checking solved. state:', this.state);
        for (let i = 0; i < this.state.board.length; i++) {
            if (this.state.board[i] !== i + 1) {
                console.log('not solved:', this.state.board[i], i + 1);
                this.state.solved = false;
                return;
            }
        }
        this.state.solved = true;
    },
    handleCanvasClick(event) {
        // if (this.state.solved) return;

        const rect = this.elements.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.floor(x / this.config.tileSize);
        const row = Math.floor(y / this.config.tileSize);
        const clickedIndex = row * this.config.gridSize + col;

        const emptyIndex = this.state.board.indexOf(this.state.emptyTile);
        const emptyRow = Math.floor(emptyIndex / this.config.gridSize);
        const emptyCol = emptyIndex % this.config.gridSize;

        // Check if clicked tile is adjacent to empty space
        const isAdjacent =
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);

        if (isAdjacent) {
            // Swap tiles
            [this.state.board[clickedIndex], this.state.board[emptyIndex]] = [this.state.board[emptyIndex], this.state.board[clickedIndex]];
            this.state.moveCount++;
            this.elements.moveCountDisplay.textContent = String(this.state.moveCount);

            // Check if puzzle is solved
            this.checkSolved();
            this.draw();

            if (this.state.solved) {
                setTimeout(() => {
                    alert(`Congratulations! You solved the puzzle in ${this.state.moveCount} moves!`);
                }, 100);
            }
        }

        this.saveBoardState();
    },
    smoothColorList(solvedGradientColors, granularity = 4) {
        const colorList = [];
        for (let i = 0; i < solvedGradientColors.length - 1; i++) {
            const startColor = solvedGradientColors[i];
            const endColor = solvedGradientColors[i + 1];

            for (let j = 0; j <= granularity; j++) {
                const factor = j / granularity;
                colorList.push(this.interpolateColor(startColor, endColor, factor));
            }
        }
        // smooth the last and first color
        const firstColor = solvedGradientColors[0];
        const lastColor = solvedGradientColors[solvedGradientColors.length - 1];
        for (let j = 0; j <= granularity; j++) {
            const factor = j / granularity;
            colorList.push(this.interpolateColor(lastColor, firstColor, factor));
        }

        return colorList;
    },
    randomBetween(from, to) {
        return Math.random() * (to - from) + from;
    },
    tileGridToNumber(hoveredTile) {
        return hoveredTile.row * this.config.gridSize + hoveredTile.col + 1;
    },
    recalculateCanvasSize() {
        const gameFrame = this.elements.gameFrame;
        const gameRect = gameFrame.getBoundingClientRect();
        let factor = 2.5;
        if (window.matchMedia("(max-width: 600px)").matches) {
            factor = 1.5;
        }



        this.config.tileSize = (gameRect.width / factor) / this.config.gridSize;
        this.config.tileSize = Math.max(this.config.tileSize, 50);
        this.elements.canvas.width = this.config.tileSize * this.config.gridSize;
        this.elements.canvas.height = this.config.tileSize * this.config.gridSize;


        // const gameContainer = document.getElementById('puzzle-game-container');
        //
        // if (this.elements.gameFrame.height > gameContainer.height) {
        //     this.elements.gameFrame.height = gameContainer.height + 1000;
        // }

        // const newSize = Math.min(
        //     this.elements.gameFrame.width,
        //     this.elements.gameFrame.height
        // );
        // this.elements.canvas.width = newSize;
        // this.elements.canvas.height = newSize;
        // this.config.tileSize = newSize / 2 / this.config.gridSize;
        // this.elements.canvas.width = gameRect.width / 2;
        // this.elements.canvas.height = gameRect.width / 2;

    },
}

// function isMobileDevice() {
//     // arbitrary breakpoint for mobile devices
//     // not synced with CSS breakpoints
//     return window.matchMedia("(max-width: 600px)").matches;
// }