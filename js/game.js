const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
let KEY_SPACE = false;
let KEY_UP = false;
let KEY_DOWN = false;
let canvas;
let ctx;
let backgroundImage = new Image();
let bullets = [];
let canShoot = true;
let ufos = [];
let score = 0;
let explosions = [];
let explosionUfoImg;
let explosionRocketImg;
let ufoExplosions = [];
let soundShoot;
let soundExplosion;
let soundHit;
let soundBackground;
let backgroundStarted = false;
let musicVolume = 0.3;
let sfxVolume = 0.7;
let showHUD = true;
const UFO_TOP_MARGIN = 60;
const UFO_BOTTOM_MARGIN = 60;
let lastUfoSpawn = 0;
const UFO_SPAWN_DELAY = 2000;
let lives = 5;
let gameState = 'PLAYING';
let rocket = {
  x: 50,
  y: 50,
  width: 100,
  height: 80,
  src: 'Bilder/new_rocket.png',
  img: null,
  hitboxPadding: 10,
};

let ufoTemplate = {
  width: 80,
  height: 20,
  img: null,
  hitboxPadding: 8,
};

//setup
function startGame() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  loadImages();
  loadSounds();
  gameLoop();
  canvas.focus();
}

function loadImages() {
  backgroundImage.src = 'Bilder/space1.jpg';
  rocket.img = new Image();
  rocket.img.src = rocket.src;
  ufoTemplate.img = new Image();
  ufoTemplate.img.src = 'Bilder/ufo.png';
  explosionRocketImg = new Image();
  explosionRocketImg.src = 'Bilder/explosion_rocket.png';
  explosionUfoImg = new Image();
  explosionUfoImg.src = 'Bilder/explosion-ufo.jpg';
}

function loadSounds() {
  soundShoot = new Audio('sounds/shoot.wav');
  soundExplosion = new Audio('sounds/explosion.wav');
  soundHit = new Audio('sounds/hit.wav');
  soundBackground = new Audio('sounds/background-sound.mp3');
  soundBackground.loop = true;
  applyVolumes();
}

// functions for setup
function gameLoop() {
  update();
  updateUfoExplosions();
  draw();
  drawUfoExplosions();
  requestAnimationFrame(gameLoop);
}
function applyVolumes() {
  soundBackground.volume = musicVolume;
  soundShoot.volume = sfxVolume;
  soundExplosion.volume = sfxVolume;
  soundHit.volume = sfxVolume;
}

//input
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

//functions for input
function handleKeyDown(e) {
  startBackgroundSoundOnce();
  handleVolumeKeys(e.code);
  handleHUDToggle(e.code);
  if (e.code === 'Space') {
    KEY_SPACE = true;
  }

  if (e.code === 'ArrowUp') {
    KEY_UP = true;
  }

  if (e.code === 'ArrowDown') {
    KEY_DOWN = true;
  }
  if (e.code === 'KeyR' && gameState !== 'PLAYING') {
    resetGame();
  }
}

function handleKeyUp(e) {
  if (e.code === 'Space') {
    KEY_SPACE = false;
    canShoot = true;
  }

  if (e.code === 'ArrowUp') {
    KEY_UP = false;
  }

  if (e.code === 'ArrowDown') {
    KEY_DOWN = false;
  }
}

function startBackgroundSoundOnce() {
  if (!backgroundStarted) {
    soundBackground.play();
    backgroundStarted = true;
  }
}

function handleVolumeKeys(code) {
  if (code === 'KeyM') {
    musicVolume = Math.max(0, musicVolume - 0.1);
    applyVolumes();
  }

  if (code === 'KeyN') {
    musicVolume = Math.max(0, musicVolume + 0.1);
    applyVolumes();
  }
  if (code === 'KeyJ') {
    sfxVolume = Math.max(0, sfxVolume - 0.1);
    applyVolumes();
  }

  if (code === 'KeyK') {
    sfxVolume = Math.min(1, sfxVolume + 0.1);
    applyVolumes();
  }
}

function handleHUDToggle(code) {
  if (code === 'KeyH') {
    showHUD = !showHUD;
  }
}

function isPlaying() {
  return gameState === 'PLAYING';
}

//update
function update() {
  if (!isPlaying()) return;
  handleUfoSpawning();
  handleShooting();
  updateRocket();
  updateBullets();
  updateUfos();
  handleCollisions();
  handleExplosions();
  if (score >= 1000 && gameState === 'PLAYING') {
    gameState = 'WON';
  }
}

//functions for update
function handleUfoSpawning() {
  if (Date.now() - lastUfoSpawn < UFO_SPAWN_DELAY) return;
  spawnUfo();
  lastUfoSpawn = Date.now();
}

function handleShooting() {
  if (KEY_SPACE && canShoot) {
    soundShoot.currentTime = 0;
    soundShoot.play();
    bullets.push({
      x: rocket.x + rocket.width,
      y: rocket.y + rocket.height / 2 - 5,
      width: 10,
      height: 4,
      speed: 8,
    });
    canShoot = false;
  }
}

function updateRocket() {
  if (KEY_UP) {
    rocket.y -= 4;
  }
  if (KEY_DOWN) {
    rocket.y += 4;
  }
  rocket.y = Math.max(0, Math.min(canvas.height - rocket.height, rocket.y));
}

function updateBullets() {
  bullets.forEach((bullet) => {
    bullet.x += bullet.speed;
  });
  bullets = bullets.filter((bullet) => bullet.x < canvas.width);
}

function updateUfos() {
  ufos.forEach((ufo) => {
    ufo.x -= ufo.speed;
  });
  ufos = ufos.filter((ufo) => ufo.x + ufo.width > 0);
}

function updateUfoExplosions() {
  for (let i = ufoExplosions.length - 1; i >= 0; i--) {
    const exp = ufoExplosions[i];

    exp.size += 3;
    exp.frame++;

    if (exp.frame >= exp.maxFrames) {
      ufoExplosions.splice(i, 1);
    }
  }
}

function handleCollisions() {
  bullets.forEach((bullet, bIndex) => {
    ufos.forEach((ufo, uIndex) => {
      if (isBulletColliding(bullet, ufo)) {
        soundHit.currentTime = 0;
        soundHit.play();
        score += 50;

        spawnUfoExplosion(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2);

        bullets.splice(bIndex, 1);
        ufos.splice(uIndex, 1);
      }
    });
  });

  ufos.forEach((ufo, index) => {
    if (isColliding(rocket, ufo)) {
      handleRocketHit(index);
    }
  });
}

function handleExplosions() {
  explosions = explosions.filter((ex) => Date.now() - ex.createdAt < 300);
}

function handleRocketHit(ufoIndex) {
  if (!isPlaying()) return;
  lives--;
  spawnExplosion(
    rocket.x + rocket.width / 2,
    rocket.y + rocket.height / 2,
    'rocket',
  );
  soundExplosion.currentTime = 0;
  soundExplosion.play();
  ufos.splice(ufoIndex, 1);
  if (lives <= 0) {
    gameState = 'GAME_OVER';
  }
}

function isColliding(a, b) {
  return (
    a.x + a.hitboxPadding < b.x + b.width - b.hitboxPadding &&
    a.x + a.width - a.hitboxPadding > b.x + b.hitboxPadding &&
    a.y + a.hitboxPadding < b.y + b.height - b.hitboxPadding &&
    a.y + a.height - a.hitboxPadding > b.y + b.hitboxPadding
  );
}

function isBulletColliding(bullet, ufo) {
  return (
    bullet.x < ufo.x + ufo.width &&
    bullet.x + bullet.width > ufo.x &&
    bullet.y < ufo.y + ufo.height &&
    bullet.y + bullet.height > ufo.y
  );
}

//draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  if (gameState === 'GAME_OVER') {
    drawGameOverScreen();
    return;
  }

  if (gameState === 'WON') {
    drawWinScreen();
    return;
  }

  drawScore();
  drawRocket();
  drawBullets();
  drawUfos();
  drawExplosions();
  drawHUD();
  drawLives();
}

//functions for draw
function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Roboto';
  ctx.fillText('Punkte: ' + score, canvas.width - 120, 30);
}

function drawRocket() {
  ctx.drawImage(rocket.img, rocket.x, rocket.y, rocket.width, rocket.height);
}

function drawBullets() {
  ctx.fillStyle = 'red';
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawUfos() {
  ufos.forEach((u) => {
    ctx.drawImage(u.img, u.x, u.y, u.width, u.height);
  });
}

function drawExplosions() {
  explosions.forEach((ex) => {
    ctx.drawImage(ex.img, ex.x, ex.y, ex.width, ex.height);
  });
}

function drawUfoExplosions() {
  ufoExplosions.forEach((exp) => {
    ctx.drawImage(
      exp.img,
      exp.x - exp.size / 2,
      exp.y - exp.size / 2,
      exp.size,
      exp.size,
    );
  });
}

function drawHUD() {
  if (!showHUD) return;

  const boxWidth = 200;
  const boxHeight = 130;
  const x = 10;
  const y = canvas.height - boxHeight - 10;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x, y, boxWidth, boxHeight);

  ctx.fillStyle = 'white';
  ctx.font = '12px Roboto';

  let line = y + 25;

  ctx.fillText('Tastenbelegung:', x + 10, line);
  line += 20;

  ctx.fillText('Bewegen: ↑ / ↓', x + 10, line);
  line += 18;

  ctx.fillText('Schießen: Space', x + 10, line);
  line += 18;

  ctx.fillText('Musik leiser:M /Musik lauter:N', x + 10, line);
  line += 18;

  ctx.fillText('Effekte leiser:J /Effekte lauter:K', x + 10, line);
  line += 18;
  ctx.fillText('Steuerung ein / aus:H', x + 10, line);
}

function drawLives() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Roboto';
  ctx.fillText('Leben: ' + lives, 20, 30);
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'red';
  ctx.textAlign = 'center';

  ctx.font = '48px Roboto';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = 'white';
  ctx.font = '22px Roboto';
  ctx.fillText(
    'Drücke R für Neustart',
    canvas.width / 2,
    canvas.height / 2 + 20,
  );

  ctx.font = '24px Roboto';
  ctx.fillText('Punkte: ' + score, canvas.width / 2, canvas.height / 2 + 55);

  ctx.textAlign = 'left';
}

function drawWinScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = 'lime';
  ctx.font = '42px Roboto';
  ctx.fillText('GEWONNEN!', canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = 'white';
  ctx.font = '22px Roboto';
  ctx.fillText(
    'Drücke R für Neustart',
    canvas.width / 2,
    canvas.height / 2 + 20,
  );

  ctx.textAlign = 'left';
}

//spawn
function spawnUfo() {
  if (!isPlaying()) return;
  const minY = UFO_TOP_MARGIN;
  const maxY = canvas.height - ufoTemplate.height - UFO_BOTTOM_MARGIN;

  ufos.push({
    x: canvas.width,
    y: Math.random() * (maxY - minY) + minY,
    width: ufoTemplate.width,
    height: ufoTemplate.height,
    speed: 4,
    img: ufoTemplate.img,
    hitboxPadding: 8,
  });
}

function spawnExplosion(x, y, type) {
  const img = type === 'ufo' ? explosionUfoImg : explosionRocketImg;
  explosions.push({
    x: x - 30,
    y: y - 30,
    width: 60,
    height: 60,
    img: img,
    createdAt: Date.now(),
  });
}

function spawnUfoExplosion(x, y) {
  ufoExplosions.push({
    x: x,
    y: y,
    size: 0,
    maxSize: 60,
    frame: 0,
    maxFrames: 20,
    img: explosionUfoImg,
  });
}

//reset
function resetGame() {
  bullets = [];
  canShoot = true;
  ufos = [];
  score = 0;
  explosions = [];
  lives = 5;
  rocket.y = 50;
  lastUfoSpawn = Date.now();
  gameState = 'PLAYING';
}

//responsive
function resizeCanvas() {
  const scale = Math.min(
    window.innerWidth / GAME_WIDTH,
    window.innerHeight / GAME_HEIGHT,
  );

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  canvas.style.width = GAME_WIDTH * scale + 'px';
  canvas.style.height = GAME_HEIGHT * scale + 'px';
}
