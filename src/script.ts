import { createHash } from 'crypto';

type Board = boolean[][];

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

const TILE_SIZE = 10;
const TILES_X = width / TILE_SIZE;
const TILES_Y = height / TILE_SIZE;

ctx.fillStyle = 'rgb(100, 240, 150)';
ctx.strokeStyle = 'rgb(90, 90, 90)';
ctx.lineWidth = 0.5;

let isGamePaused = false;
let gameSpeed = 500;
let isDrawMode = true;
let isMouseDown = false;
let HISTORY: [Board] = [[]];

const prepareBoard = (): Board => {
    const board: Array<boolean[]> = [];

    for (let x = 0; x < TILES_X; x++) {
        const row: boolean[] = [];
        for (let y = 0; y < TILES_Y; y++) {
            row.push(false);
        }
        board.push(row);
    }

    return board;
};

let BOARD = prepareBoard();

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

function hashArray(array: any[]): string {
    const hash = createHash('sha256'); // You can use other algorithms like 'md5', 'sha1', etc.
    hash.update(JSON.stringify(array));
    return hash.digest('hex');
}

function compareArraysUsingHash(array1: any[], array2: any[]): boolean {
    const hash1 = hashArray(array1);
    const hash2 = hashArray(array2);
    return hash1 === hash2;
}

const addToHistory = (board: Board) => {
    if (compareArraysUsingHash(board, [...HISTORY].pop() ?? [])) {
        return;
    }

    if ([...HISTORY].length === 100) {
        HISTORY.pop();
    }

    HISTORY.push(board);
    console.log(HISTORY.length);
};

const printHistory = () => {
    console.log(HISTORY);
};

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
        for (let y = 0; y < TILES_Y; y++) {
            if (!isAlive(x, y)) {
                continue;
            }

            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
};

const computeNextGeneration = (): Board => {
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
    //drawBorders(); //draw grid lines on screen
}

const nextGen = (manual: boolean = false) => {
    if (isGamePaused && manual === false) {
        return;
    }
    BOARD = computeNextGeneration();
    addToHistory(BOARD);
    drawAll();
}

const nextGenLoop = () => {
    nextGen();
    setTimeout(nextGenLoop, gameSpeed);
}

const prepareRandomBoard = (): Board => {
    const board = prepareBoard();

    for (let x = 0; x < TILES_X; x++) {
        for (let y = 0; y < TILES_Y; y++) {
            board[x][y] = Math.random() < 0.33;
        }
    }

    return board;
};

const getPositionFromEvent = (e) => {
    const x = Math.floor((e.clientX - canvas.offsetLeft) / TILE_SIZE);
    const y = Math.floor((e.clientY - canvas.offsetTop) / TILE_SIZE);
    return [x, y];
}

document.addEventListener("keydown", e => {
    switch (e.key) {
        case "p":
            isGamePaused = !isGamePaused;
            break;
        case "r":
            BOARD = prepareRandomBoard();
            nextGen(true);
            break;
        case "c":
            BOARD = prepareBoard();
            clear();
            isGamePaused = true;
            break;
        case "h":
            printHistory();
            break;
        case "-":
        case "_":
            gameSpeed = Math.min(2000, gameSpeed + 50);
            break;
        case "=":
        case "+":
            gameSpeed = Math.max(100, gameSpeed - 50);
            break;
        case "ArrowLeft":
            isGamePaused = true;
            BOARD = HISTORY.pop() ?? [];
            drawAll();
        default:
            break;
    }
});

canvas.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    if (!isGamePaused) {
        isGamePaused = true;
    }
    const [x, y] = getPositionFromEvent(e);
    isDrawMode = !BOARD[x][y];
    BOARD[x][y] = isDrawMode;
    drawAll();
});

canvas.addEventListener("mousemove", e => {
    if (!isMouseDown) {
        return;
    }
    const [x, y] = getPositionFromEvent(e);
    BOARD[x][y] = isDrawMode;
    drawAll();
});

canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
    if (!isGamePaused) {
        isGamePaused = true;
    }
});

nextGenLoop();
