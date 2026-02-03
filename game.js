(() => {
  "use strict";

  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const TICK_MS = 120;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const statusEl = document.getElementById("status");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  const Direction = Object.freeze({
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  });

  const state = {
    snake: [],
    direction: Direction.right,
    nextDirection: Direction.right,
    food: { x: 0, y: 0 },
    score: 0,
    running: false,
    paused: false,
    gameOver: false,
  };

  let timerId = null;

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function cellKey(cell) {
    return `${cell.x},${cell.y}`;
  }

  function spawnFood(snake) {
    const occupied = new Set(snake.map(cellKey));
    const maxCells = GRID_SIZE * GRID_SIZE;
    if (occupied.size >= maxCells) {
      return null;
    }

    let food;
    do {
      food = { x: randomInt(GRID_SIZE), y: randomInt(GRID_SIZE) };
    } while (occupied.has(cellKey(food)));

    return food;
  }

  function resetState() {
    const mid = Math.floor(GRID_SIZE / 2);
    state.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
    ];
    state.direction = Direction.right;
    state.nextDirection = Direction.right;
    state.score = 0;
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.food = spawnFood(state.snake);
    updateHud("Ready");
  }

  function updateHud(message) {
    scoreEl.textContent = String(state.score);
    statusEl.textContent = message;
    statusEl.classList.toggle("game-over", state.gameOver);
  }

  function isOpposite(a, b) {
    return a.x + b.x === 0 && a.y + b.y === 0;
  }

  function setDirection(next) {
    if (!next || isOpposite(next, state.direction)) {
      return;
    }
    state.nextDirection = next;
  }

  function stepGame() {
    if (!state.running || state.paused || state.gameOver) {
      return;
    }

    state.direction = state.nextDirection;

    const head = state.snake[0];
    const newHead = {
      x: head.x + state.direction.x,
      y: head.y + state.direction.y,
    };

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      endGame("Game Over");
      return;
    }

    const bodyKeys = new Set(state.snake.map(cellKey));
    if (bodyKeys.has(cellKey(newHead))) {
      endGame("Game Over");
      return;
    }

    state.snake.unshift(newHead);

    if (state.food && newHead.x === state.food.x && newHead.y === state.food.y) {
      state.score += 1;
      state.food = spawnFood(state.snake);
      if (!state.food) {
        endGame("You Win");
        return;
      }
    } else {
      state.snake.pop();
    }

    updateHud(state.paused ? "Paused" : "Running");
    render();
  }

  function endGame(message) {
    state.gameOver = true;
    state.running = false;
    stopLoop();
    updateHud(message);
    render();
  }

  function startLoop() {
    if (timerId) {
      return;
    }
    timerId = window.setInterval(stepGame, TICK_MS);
  }

  function stopLoop() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startGame() {
    if (state.running && !state.paused) {
      return;
    }
    if (state.gameOver) {
      resetState();
    }
    state.running = true;
    state.paused = false;
    updateHud("Running");
    startLoop();
    render();
  }

  function togglePause() {
    if (!state.running || state.gameOver) {
      return;
    }
    state.paused = !state.paused;
    updateHud(state.paused ? "Paused" : "Running");
  }

  function restartGame() {
    stopLoop();
    resetState();
    render();
  }

  function drawCell(cell, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = stroke;
    ctx.strokeRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        drawCell({ x, y }, "#fafaf7", "#e7e5de");
      }
    }

    if (state.food) {
      drawCell(state.food, "#d1a858", "#9b7d3f");
    }

    state.snake.forEach((cell, index) => {
      const isHead = index === 0;
      drawCell(cell, isHead ? "#2b5c5a" : "#4f7b79", "#1f3f3c");
    });
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
    }

    switch (key) {
      case "arrowup":
      case "w":
        setDirection(Direction.up);
        break;
      case "arrowdown":
      case "s":
        setDirection(Direction.down);
        break;
      case "arrowleft":
      case "a":
        setDirection(Direction.left);
        break;
      case "arrowright":
      case "d":
        setDirection(Direction.right);
        break;
      case " ":
        togglePause();
        break;
      default:
        break;
    }
  }

  function handleControlClick(event) {
    const dir = event.target.getAttribute("data-dir");
    if (!dir || !Direction[dir]) {
      return;
    }
    setDirection(Direction[dir]);
  }

  document.addEventListener("keydown", handleKey);
  document.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("click", handleControlClick);
  });

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", restartGame);

  resetState();
  render();
})();
