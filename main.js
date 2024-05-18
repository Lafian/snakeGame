class Config {
    static get CANVAS_SCALE() {
        return 0.75; // 75% of the screen size
    }

    static get GRID_SIZE() {
        return 20; // Size of the grid (number of cells)
    }

    static get INITIAL_SNAKE_LENGTH() {
        return 3; // Initial length of the snake
    }

    static get UPDATE_INTERVAL() {
        return Config.SMOOTH_ANIMATION ? 1 : 50; // Update interval in milliseconds
    }

    static get SNAKE_COLOR() {
        return 'blue'; // Color of the snake
    }

    static get SNAKE_BORDER_COLOR() {
        return 'darkgreen'; // Border color of the snake
    }

    static get FOOD_COLOR() {
        return 'red'; // Color of the food
    }

    static get FOOD_BORDER_COLOR() {
        return 'darkred'; // Border color of the food
    }

    static get SNAKE_STEP_COUNT() {
        return Config.SMOOTH_ANIMATION ? 4 : 0.75; // Number of steps for smooth movement
    }

    static get SMOOTH_ANIMATION() {
        return true; // Switch for smooth animation; set to false for default animation
    }

    static get SCORE_INCREMENT() {
        return 10; // Points added to score when snake eats food
    }
}

class Board {
    constructor(gridSize = Config.GRID_SIZE, cellSize = 20) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = gridSize * cellSize;
        this.canvas.height = gridSize * cellSize;
    }

    draw(snake, food) {
        this.clear();
        this.drawSnake(snake);
        this.drawFood(food);
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawSnake(snake) {
        const segments = snake.getSegments();
        const length = segments.length;

        segments.forEach((segment, index) => {
            const opacity = (length - index) / length;
            this.context.fillStyle = `rgba(0, 128, 0, ${opacity})`; // Green with varying opacity
            this.context.strokeStyle = Config.SNAKE_BORDER_COLOR;
            this.context.fillRect(segment.x * this.cellSize, segment.y * this.cellSize, this.cellSize, this.cellSize);
            this.context.strokeRect(segment.x * this.cellSize, segment.y * this.cellSize, this.cellSize, this.cellSize);
        });
    }

    drawFood(food) {
        this.context.fillStyle = Config.FOOD_COLOR;
        this.context.strokeStyle = Config.FOOD_BORDER_COLOR;
        const pos = food.getPosition();
        this.context.fillRect(pos.x * this.cellSize, pos.y * this.cellSize, this.cellSize, this.cellSize);
        this.context.strokeRect(pos.x * this.cellSize, pos.y * this.cellSize, this.cellSize, this.cellSize);
    }

    getGridSize() {
        return this.gridSize;
    }
}

class Food {
    constructor(board) {
        this.board = board;
        this.position = this.generateNewPosition();
    }

    generateNewPosition() {
        const gridSize = this.board.getGridSize();
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        this.position = new Vector(x, y);
        return this.position;
    }

    getPosition() {
        return this.position;
    }
}

class Game {
    constructor(board, snake, food, inputHandler) {
        this.board = board;
        this.snake = snake;
        this.food = food;
        this.inputHandler = inputHandler;
        this.gameInterval = null;
        this.isPaused = false;
        this.isGameOver = false;
        this.updateInterval = Config.UPDATE_INTERVAL;
        this.score = 0;

        this.gameLoop = this.gameLoop.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.updateScore = this.updateScore.bind(this);

        this.inputHandler.setGame(this);

        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('pauseButton').addEventListener('click', () => this.pause());
        document.getElementById('resetButton').addEventListener('click', () => this.reset());
    }

    start() {
        if (this.gameInterval) return;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameInterval = setInterval(this.gameLoop, this.updateInterval);
    }

    pause() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
            this.isPaused = true;
        } else if (this.isPaused) {
            this.start();
        }
    }

    reset() {
        this.isGameOver = false;
        this.isPaused = false;
        clearInterval(this.gameInterval);
        this.snake.reset();
        this.food.generateNewPosition();
        this.score = 0;
        this.updateScore();
        this.start();
    }

    gameLoop() {
        if (this.isGameOver) {
            this.pause();
            return;
        }

        this.update();
        this.render();
    }

    update() {
        this.snake.move();

        if (this.snake.checkCollisionWithWalls(this.board) || this.snake.checkCollisionWithSelf()) {
            this.isGameOver = true;
            return;
        }

        if (this.snake.getHeadPosition().equals(this.food.getPosition())) {
            this.snake.grow();
            this.food.generateNewPosition();
            this.score += Config.SCORE_INCREMENT;
            this.updateScore();
        }
    }

    render() {
        this.board.clear();
        this.board.draw(this.snake, this.food);
    }

    handleInput(direction) {
        this.snake.setDirection(direction);
    }

    updateScore() {
        document.getElementById('score').innerText = this.score;
    }
}

class InputHandler {
    constructor() {
        this.keyMap = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            Enter: 'ok',
            // Add more mappings if needed
        };
        this.game = null;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }

    setGame(game) {
        this.game = game;
    }

    handleKeyPress(event) {
        const direction = this.keyMap[event.key];
        if (direction && this.game) {
            if (direction === 'ok') {
                // Handle OK button press (start/pause/reset)
                if (this.game.isPaused) {
                    this.game.start();
                } else if (this.game.isGameOver) {
                    this.game.reset();
                } else {
                    this.game.pause();
                }
            } else {
                this.game.handleInput(direction);
            }
        }
    }
}

class Snake {
    constructor(initialPosition, initialLength = Config.INITIAL_SNAKE_LENGTH) {
        this.initialPosition = initialPosition;
        this.initialLength = initialLength;
        this.reset();
    }

    reset() {
        this.position = [this.initialPosition];
        this.length = this.initialLength;
        this.direction = new Vector(0, -1);
        this.intermediatePositions = [];
        this.step = 0;
        this.stepsPerMove = Config.SNAKE_STEP_COUNT; // Use value from Config
    }

    move() {
        if (this.intermediatePositions.length === 0) {
            const newHead = this.position[0].add(this.direction);
            this.intermediatePositions = this.calculateIntermediatePositions(this.position[0], newHead);
            this.position.unshift(newHead);
            while (this.position.length > this.length) {
                this.position.pop();
            }
        } else {
            this.step++;
            if (this.step >= this.stepsPerMove) {
                this.intermediatePositions.shift();
                this.step = 0;
            }
        }
    }

    grow() {
        this.length += 1;
    }

    setDirection(direction) {
        const newDirection = this.getDirectionVector(direction);
        if (!this.position[1] || !this.position[0].add(newDirection).equals(this.position[1])) {
            this.direction = newDirection;
        }
    }

    getDirectionVector(direction) {
        switch (direction) {
            case 'up': return new Vector(0, -1);
            case 'down': return new Vector(0, 1);
            case 'left': return new Vector(-1, 0);
            case 'right': return new Vector(1, 0);
            default: return this.direction;
        }
    }

    checkCollisionWithWalls(board) {
        const head = this.position[0];
        const gridSize = board.getGridSize();
        return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
    }

    checkCollisionWithSelf() {
        const [head, ...body] = this.position;
        return body.some(segment => segment.equals(head));
    }

    getHeadPosition() {
        return this.position[0];
    }

    getSegments() {
        if (this.intermediatePositions.length > 0) {
            return [this.intermediatePositions[0], ...this.position.slice(1)];
        }
        return this.position;
    }

    calculateIntermediatePositions(from, to) {
        const positions = [];
        for (let i = 1; i <= this.stepsPerMove; i++) {
            const x = from.x + (to.x - from.x) * (i / this.stepsPerMove);
            const y = from.y + (to.y - from.y) * (i / this.stepsPerMove);
            positions.push(new Vector(x, y));
        }
        return positions;
    }
}

class Vector {
    constructor(x, y) {this.x = x;
        this.y = y;
    }

    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
}

class Resizer {
    constructor(canvas, board, game) {
        this.canvas = canvas;
        this.board = board;
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => this.resizeCanvas());
        this.canvas.addEventListener('touchstart', (event) => this.handleTouchStart(event));
        this.canvas.addEventListener('touchmove', (event) => this.handleTouchMove(event));
        this.canvas.addEventListener('touchend', (event) => this.handleTouchEnd(event));
    }

    resizeCanvas() {
        const width = window.innerWidth * Config.CANVAS_SCALE;
        const height = window.innerHeight * Config.CANVAS_SCALE;
        const size = Math.min(width, height);
        this.canvas.width = size;
        this.canvas.height = size;
        this.board.cellSize = size / this.board.gridSize;
        this.game.render(); // Re-render the canvas after resizing
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(event) {
        if (event.touches.length > 1) return; // Ignore multi-touch

        const touch = event.touches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.game.handleInput('right');
            } else {
                this.game.handleInput('left');
            }
        } else {
            if (deltaY > 0) {
                this.game.handleInput('down');
            } else {
                this.game.handleInput('up');
            }
        }

        // Reset touch start position for the next swipe
        this.touchStartX = touchEndX;
        this.touchStartY = touchEndY;
    }

    handleTouchEnd(event) {
        // Optionally handle touch end event
    }
}

class CanvasManager {
    constructor(canvas, board, game) {
        this.canvas = canvas;
        this.board = board;
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => this.resizeCanvas());
        this.canvas.addEventListener('touchstart', (event) => this.handleTouchStart(event));
        this.canvas.addEventListener('touchmove', (event) => this.handleTouchMove(event));
        this.canvas.addEventListener('touchend', (event) => this.handleTouchEnd(event));
    }

    resizeCanvas() {
        const width = window.innerWidth * Config.CANVAS_SCALE;
        const height = window.innerHeight * Config.CANVAS_SCALE;
        const size = Math.min(width, height);
        this.canvas.width = size;
        this.canvas.height = size;
        this.board.cellSize = size / this.board.gridSize;
        this.game.render(); // Re-render the canvas after resizing
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(event) {
        if (event.touches.length > 1) return; // Ignore multi-touch

        const touch = event.touches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.game.handleInput('right');
            } else {
                this.game.handleInput('left');
            }
        } else {
            if (deltaY > 0) {
                this.game.handleInput('down');
            } else {
                this.game.handleInput('up');
            }
        }

        // Reset touch start position for the next swipe
        this.touchStartX = touchEndX;
        this.touchStartY = touchEndY;
    }

    handleTouchEnd(event) {
        // Optionally handle touch end event
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const board = new Board(Config.GRID_SIZE);
    const snake = new Snake(new Vector(10, 10), Config.INITIAL_SNAKE_LENGTH);
    const food = new Food(board);
    const inputHandler = new InputHandler();

    const game = new Game(board, snake, food, inputHandler);
    const canvasManager = new CanvasManager(canvas, board, game);

    game.start();
});
