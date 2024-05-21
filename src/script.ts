const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
    throw Error('missing canvas');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
    throw Error('missing canvas context');
}

const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const TILE_SIZE = 20;
const TILES_X = width / TILE_SIZE;
const TILES_Y = height / TILE_SIZE;

ctx.fillStyle = 'rgb(100, 240, 150)';
ctx.strokeStyle = 'rgb(90, 90, 90)';
ctx.lineWidth = 0.5;

let isGamePaused = false;
let gameSpeed = 100;

const drawBorders = () => {
    for (let x = 0; x < TILES_X; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE - 0.5, 0);
        ctx.lineTo(x * TILE_SIZE - 0.5, height);
        ctx.stroke();
    }

    for (let y = 0; y < TILES_Y; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE - 0.5);
        ctx.lineTo(width, y * TILE_SIZE - 0.5);
        ctx.stroke();
    }
};

const prepareBoard = (): boolean[][] => {
    const board: Array<boolean[]> = [];
    
    for (let x = 0; x < TILES_X; x ++) {
        const row: boolean[] = [];
        for (let y = 0; y < TILES_Y; y++) {
            row.push(false);
        }
        board.push(row);
    }

    return board;
};

let BOARD = prepareBoard();

const isAlive = (x: number, y: number): number => {
    if (x < 0 || x >= TILES_X || y < 0 || y >= TILES_Y) {
        return 0;
    }

    return BOARD[x][y] ? 1 : 0;
};

const neighborsCount = (x: number, y: number): number => {
    let count = 0;
    for (let i of [-1, 0, 1]) {
        for (let j of [-1, 0, 1]) {
            if (!(i === 0 && j === 0)) {
                count += isAlive(x + i, y + j);
            }
        }
    }
    return count;
}

const drawBoard = () => {
    for (let x = 0; x < TILES_X; x++) {
        for (let y = 0; y < TILES_Y; y ++) {
            if (! isAlive(x, y)) {
                continue;
            }

            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
};

const computeNextGeneration = () => {
    const board = prepareBoard();
    for (let i = 0; i < TILES_X; i++) {
        for (let j = 0; j < TILES_Y; j++) {
            if (!isAlive(i, j)) {
                if (neighborsCount(i, j) === 3) {
                    board[i][j] = true;
                }
            } else {
                const count = neighborsCount(i, j);
                if (count == 2 || count == 3) {
                    board[i][j] = true;
                }
            }
        }
    }
    return board;
}

const clear = () => {
    ctx.clearRect(0, 0, width, height);
};

const drawAll = () => {
    clear();
    drawBoard();
    //drawBorders();
}

const nextGen = () => {
    if (isGamePaused) {
        return;
    }
    BOARD = computeNextGeneration();
    drawAll();
}

const nextGenLoop = () => {
    nextGen();
    setTimeout(nextGenLoop, gameSpeed);
}

canvas.addEventListener("click", e => {
    const x = Math.floor((e.clientX - canvas.offsetLeft) / TILE_SIZE);
    const y = Math.floor((e.clientY - canvas.offsetTop) / TILE_SIZE);
    BOARD[x][y] = !BOARD[x][y];
    drawAll();
});

const prepareRandomBoard = (): boolean[][] => {
    const board = prepareBoard();

    for(let x = 0; x < TILES_X; x++) {
        for (let y = 0; y < TILES_Y; y++) {
            board[x][y] = Math.random() < 0.33;
        }
    }

    return board;
};

document.addEventListener("keydown", e => {
    if (e.key === "p") {
        isGamePaused = !isGamePaused;
    } 

    if (e.key === "r") {
        BOARD = prepareRandomBoard();
    }

    if (e.key === "+") {
        gameSpeed = Math.max(100, gameSpeed - 50);
        console.log("new game speed", gameSpeed);
    }

    if (e.key === "-") {
        gameSpeed = Math.min(2000, gameSpeed + 50);
        console.log("new game speed", gameSpeed);
    }
});

nextGenLoop();
