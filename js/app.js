/**
 * Random number generator between range
 * @param min
 * @param max
 * @returns {number}
 */
function randomIntBetween(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Animate sprite at independent frame rate from game loop. Don't overwrite internal options.
 * Logic taken and semi-modified from here:
 * http://www.williammalone.com/articles/create-html5-canvas-javascript-sprite-animation/
 *   @param options
 *   options.canvasX - x position to draw on canvas
 *   options.canvasY - y position to draw on canvas
 *   options.width - full width of sprite sheet, individual frame widths computed internally
 *   options.height - height of sprite sheet
 *   options.sprite (string) - image path to sprite sheet
 *   options.loopAnimation (boolean) - default false
 *   options.fps - number of game loops until next frame should be displayed for controlling animation separate from game loop
 *   options.numberOfFrames - total number of frames in animation
 *
 *   options.currentFrame - internal, current frame displayed
 *   options.frameRate - internal, number of game loops since currentFrame was displayed
 *   options.animationComplete - internal, default false and set to true when not looping
 * @constructor
 */
var SpriteAnimation = function (options) {
    this.canvasX = options.canvasX ? options.canvasX : 0;
    this.canvasY = options.canvasY ? options.canvasY : 0;
    this.width = options.width;
    this.height = options.height;
    this.sprite = options.sprite;
    this.loopAnimation = options.loopAnimation ? options.loopAnimation : false;
    this.fps = options.fps ? options.fps : 0;
    this.numberOfFrames = options.numberOfFrames ? options.numberOfFrames : 1;

    this.currentFrame = -1; // -1 so 0th index of sprite is drawn on first iteration
    this.frameRate = 0;
    this.animationComplete = false;
    this.type = 'animation';
};

/**
 * Required for game loop
 * @param dt - delta time of game loop
 */
SpriteAnimation.prototype.update = function (dt) {
    if (this.loopAnimation) {
        this.frameRate += 1;

        if (this.frameRate > this.fps * dt) {
            this.frameRate = 0;
            // -1 from numberOfFrames to correct for 0 based index,
            // so a blank frame is never drawn
            if (this.currentFrame < this.numberOfFrames - 1) {
                this.currentFrame += 1;
            } else {
                this.currentFrame = 0; // loop
            }
        }
    } else {
        this.frameRate += 1;

        if (this.frameRate > this.fps * dt) {
            this.frameRate = 0;
            // use the actual numberOfFrames so last frame drawn is blank
            if (this.currentFrame < this.numberOfFrames) {
                this.currentFrame += 1;
                if (this.numberOfFrames === this.currentFrame) {
                    this.animationComplete = true;
                }
            }
        }
    }
};
/**
 * Required for game loop
 */
SpriteAnimation.prototype.render = function () {
    ctx.drawImage(
        Resources.get(this.sprite),
        this.currentFrame * this.width / this.numberOfFrames,
        0,
        this.width / this.numberOfFrames,
        this.height,
        this.canvasX,
        this.canvasY,
        this.width / this.numberOfFrames,
        this.height
    );
};

var Entity = function (rowCenter, speed, spriteBounds) {
    this.rowCenter = rowCenter ? rowCenter : 55;
    this.speed = speed ? speed : 1;
    this.isOutOfView = false;
    this.spriteBounds = spriteBounds ? spriteBounds : {
        width: 101,
        height: 171,
        x: 0,
        y: 171,
        dx: 101,
        dy: 171
    };
    this.spriteBounds.xOffset = this.spriteBounds.width / 2;
    this.spriteBounds.yOffset = (this.spriteBounds.dy - this.spriteBounds.y) / 2;

    this.x = -this.spriteBounds.width;
    this.y = rowCenter - this.spriteBounds.y - this.spriteBounds.yOffset;
    this.type = 'entity';
};

/**
 * Required for game loop
 */
Entity.prototype.update = function(dt) {};

/**
 * Required for game loop
 */
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * Make sure entity is out of view
 * @returns {boolean}
 */
Entity.prototype.outOfBounds = function() {
    return (this.x > window.game.board.width);
};

/**
 * Enemy class
 * @param rowCenter - the center y position of row to draw enemy in
 * @param speed - default 1, multiplier to speed up movement
 * @extends Entity
 * @constructor
 */
var Enemy = function(rowCenter, speed) {
    this.spriteBounds = {
        width: 101,
        height: 171,
        x: 1,
        y: 77,
        dx: 99,
        dy: 155
    };
    Entity.call(this, rowCenter, speed, this.spriteBounds);
    this.sprite = 'images/enemy-bug.png';
    this.type = 'enemy';
};

Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;

/**
 * Required for game loop
 * @param dt - delta time of game loop
 */
Enemy.prototype.update = function(dt) {
    this.x += this.spriteBounds.width * dt * this.speed;
    this.isOutOfView = false;

    if (this.outOfBounds()) {
        this.x = -this.spriteBounds.width;
        this.isOutOfView = true;
    }

    // collision detection
    if (window.player.x < this.x + this.spriteBounds.xOffset &&
        window.player.x + window.player.spriteBounds.xOffset > this.x &&
        window.player.y < this.y + this.spriteBounds.yOffset &&
        window.player.y + window.player.spriteBounds.yOffset > this.y)
    {
        window.player.setToStartPosition();
        window.game.lives--;
    }
};

/**
 * Collectible class: items for a player to collect to score additional points
 * @param rowCenter - the center y position of row to draw collectible in
 * @param speed - default 1, multiplier to speed up movement
 * @extends Entity
 * @constructor
 */
var Collectible = function(rowCenter, speed) {
    this.spriteBounds = {
        width: 101,
        height: 171,
        x: 1,
        y: 53,
        dx: 99,
        dy: 152
    };
    Entity.call(this, rowCenter, speed, this.spriteBounds);
    this.sprite = 'images/Star.png';
    this.points = 20;
    this.type = 'collectible';
};

Collectible.prototype = Object.create(Entity.prototype);
Collectible.prototype.constructor = Collectible;

/**
 * Required for game loop
 * @param dt - delta time of game loop
 */
Collectible.prototype.update = function(dt) {
    this.x += this.spriteBounds.width * dt * this.speed;
    this.isOutOfView = this.outOfBounds();

    // add points if a collision occurs
    if (window.player.x < this.x + this.spriteBounds.xOffset &&
        window.player.x + window.player.spriteBounds.xOffset > this.x &&
        window.player.y < this.y + this.spriteBounds.yOffset &&
        window.player.y + window.player.spriteBounds.yOffset > this.y)
    {
        var collected = window.game.removeFromQueue(this);
        var animation = new SpriteAnimation({
            canvasX: collected[0].x,
            canvasY: collected[0].y,
            width: 2525,
            height: 171,
            numberOfFrames: 25,
            fps: 65,
            sprite: 'images/Star-sprite.png'
        });
        window.entityQueue.push(animation);
        window.game.addToScore(this.points * collected[0].speed)
    }
};

/**
 * Player class
 * @constructor
 */
var Player = function() {
    this.boardBounds = {xMin: 0, xMax: 404, yMin: -40, yMax: 388.5};
    this.spriteBounds = {
        width: 101,
        height: 171,
        x: 17,
        y: 63,
        dx: 68,
        dy: 150
    };
    this.spriteBounds.xOffset = this.spriteBounds.width / 2;
    this.spriteBounds.yOffset = (this.spriteBounds.dy - this.spriteBounds.y ) / 2;
    this.sprite = 'images/char-boy.png';

    this.type = 'player';
    this.setToStartPosition();
};

/**
 * Required for game loop
 */
Player.prototype.update = function() {
    // if player reaches water
    if (this.y < window.game.getRowCenter(0) - this.spriteBounds.y - this.spriteBounds.yOffset) {
        window.game.addToScore(10);
        this.setToStartPosition();
    }
};

/**
 * Required for game loop
 */
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * Control player movement
 * @param movement (string) - up, down, left, right
 */
Player.prototype.handleInput = function(movement) {
    switch (movement) {
        case 'up':
            if (this.y === this.boardBounds.yMin) {
                return;
            }
            this.y -= this.spriteBounds.dy - this.spriteBounds.y;
            break;
        case 'down':
            if (this.y === this.boardBounds.yMax) {
                return;
            }
            this.y += this.spriteBounds.dy - this.spriteBounds.y;
            break;
        case 'left':
            if (this.x === this.boardBounds.xMin) {
                return;
            }
            this.x -= this.spriteBounds.width;
            break;
        case 'right':
            if (this.x === this.boardBounds.xMax) {
                return;
            }
            this.x += this.spriteBounds.width;
            break;
    }
};

/**
 * Set player to bottom row, center column
 */
Player.prototype.setToStartPosition = function () {
    this.x = (window.game.board.width / 2) - this.spriteBounds.xOffset;
    this.y = window.game.getRowCenter(5) - this.spriteBounds.y - this.spriteBounds.yOffset;
};

/**
 * Draw player out of visual bounds of canvas
 */
Player.prototype.hide = function () {
    this.x = 2000;
    this.y = 2000;
};

/**
 * Game board shading to visually hint game has ended
 * @constructor
 */
var GameOverShading = function () {
    this.fill = 'rgba(0, 0, 0, 0.2)';
};
/**
 * Required for game loop
 */
GameOverShading.prototype.update = function () {};

/**
 * Required for game loop
 */
GameOverShading.prototype.render = function () {
    ctx.fillStyle = this.fill;
    ctx.fillRect(0, 0, window.game.board.width, window.game.board.height - 20);
};

/**
 * Game class
 * @constructor
 */
var Game = function() {
    this.lives = 3;
    this.score = 0;
    this.gameHasEnded = false;
    this.newScore = 0;
    this.lifeSprite = 'images/life-sprite.png';
    this.board = {
        width: 505,
        height: 606,
        rows: 6,
        cols: 5,
        x: 0,
        y: 606,
        dx: 505,
        dy: 536
    };
    this.rowSpriteBounds = {
        width: 101,
        height: 171,
        x: 0,
        y: 50,
        dx: 101,
        dy: 131
    };

    document.addEventListener('keyup', function(e) {
        var allowedKeys = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down'
        };

        window.player.handleInput(allowedKeys[e.keyCode]);
    });
};

/**
 * Generate enemies and collectibles
 */
Game.prototype.init = function() {
    this.populateEnemies();
    this.randomizeCollectibles();
};

/**
 * Compute y coordinate of row center
 * @param row (number) - zero indexed, row to get coordinate from
 * @returns {number}
 */
Game.prototype.getRowCenter = function (row) {
    if (row < 0 || row > this.board.rows - 1) {
        row = 1;
    }
    return ((this.rowSpriteBounds.dy - this.rowSpriteBounds.y) * row) +
        (this.rowSpriteBounds.height - this.rowSpriteBounds.dy) + this.rowSpriteBounds.y;
};

/**
 * Randomly populate different enemy speeds across board rows
 */
Game.prototype.populateEnemies = function() {
    while (window.entityQueue.length < 3) {
        var row = randomIntBetween(1, 3);
        var speed = randomIntBetween(1, 4);
        var newEnemy = new Enemy(this.getRowCenter(row), speed);
        // only add enemies if their rows/speeds aren't equal
        if (!this.enemyExistsInQueue(newEnemy)) {
            window.entityQueue.push(newEnemy);
        }
    }
};

/**
 * Check whether enemy with equal row or speed already exists on canvas
 * @param enemy - Enemy object
 * @returns {boolean}
 */
Game.prototype.enemyExistsInQueue = function(enemy) {
    var found = false;
    window.entityQueue.forEach(function (containedEnemy) {
        // console.log(enemy, containedEnemy, allEnemies, allEnemies.length);
        if (containedEnemy.type === 'enemy') {
            if (enemy.y === containedEnemy.y) {
                found = true;
            }
            if (enemy.speed === containedEnemy.speed) {
                found = true;
            }
        }
    });

    return found;
};

/**
 * Create collectible item with random row location and speed
 */
Game.prototype.createCollectible = function () {
    var row = randomIntBetween(1, 3);
    var speed = randomIntBetween(1, 4);
    var collectible = new Collectible(this.getRowCenter(row), speed);
    window.entityQueue.push(collectible);
};

/**
 * Continually create collectible items randomly until game has ended
 */
Game.prototype.randomizeCollectibles = function () {
    var _this = this;
    var delay = randomIntBetween(4000, 13000);
    var timeout = setTimeout(function() {
        if (!_this.gameHasEnded) {
            _this.createCollectible();
            _this.randomizeCollectibles();
            _this.cleanUpQueue();
        } else {
            clearTimeout(timeout); // don't draw the last created collectible if game ended
        }
    }, delay);
};

/**
 * Remove an entity from the queue
 * @param obj - Enemy, Collectible, SpriteAnimation objects
 * @returns {Array} - of the objects removed
 */
Game.prototype.removeFromQueue = function (obj) {
    var removed = [];
    for(var i = 0; i < window.entityQueue.length; i++) {
        if (obj === window.entityQueue[i]) {
            removed = window.entityQueue.splice(i, 1);
            break;
        }
    }
    return removed;
};

/**
 * Remove entities in queue that are no longer displayed so queue doesn't grow infinitely
 */
Game.prototype.cleanUpQueue = function() {
    for(var i = 0; i < window.entityQueue.length; i++) {
        if (window.entityQueue[i].type === 'collectible' && window.entityQueue[i].isOutOfView === true) {
            window.entityQueue.splice(i, 1);
        }
        if (window.entityQueue[i].type === 'animation' && window.entityQueue[i].animationComplete === true) {
            window.entityQueue.splice(i, 1);
        }
    }
};

/**
 * Draw lives player has left
 * @see engine.js renderEntities() function
 */
Game.prototype.drawLives = function () {
    var x = this.board.width;
    var y = 5;

    for (var i = 0; i <= this.lives; i++){
        ctx.drawImage(Resources.get(this.lifeSprite), 0, 0, 25, 33, x, y, 25, 33);
        x -= 5 + 25; // 5px between + lifeSprite width
    }

    // only call gameOver() once
    if (this.lives === 0 && !this.gameHasEnded) {
        this.gameOver();
        this.gameHasEnded = true;
    }
};

/**
 * Animate score
 * @param dt - delta time of game loop
 * @see engine.js updateEntities() function
 */
Game.prototype.updateScore = function (dt) {
    if (this.score < this.newScore) {
        this.score += 1;
    }
};

Game.prototype.addToScore = function (num) {
    this.newScore += num;
};

/**
 * Draw score
 * @see engine.js renderEntities() function
 */
Game.prototype.renderScore = function () {
    var x = 0;
    var y = 5 + 16; // lifeSprite y location + font size
    ctx.font = '16px serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText('Score: ' + this.score, x, y);
};

Game.prototype.addInstructions = function () {
    var instructionsHtml = '<h1>Instructions</h1><ul class="instructions">' +
                            '<li>Earn 10 points by crossing the board to the water</li>' +
                            '<li>Reaching the water will reset you to the grass</li>' +
                            '<li>Collect stars to earn additional points, faster stars equal more points</li>' +
                            '<li>You have 3 lives, hitting a bug will take one life and reset you to the grass</li>' +
                           '</ul>';

    document.addEventListener('DOMContentLoaded', function () {
        var wrapper = document.getElementsByClassName('wrapper')[0];
        var instructions = document.createElement('div');
        instructions.id = 'instructions';
        instructions.innerHTML = instructionsHtml;
        wrapper.appendChild(instructions);
    });
};

Game.prototype.restart = function () {
    window.entityQueue = [];
    this.score = 0;
    this.newScore = 0;
    this.lives = 3;
    this.gameHasEnded = false;
    this.init();
    window.player.setToStartPosition();

    var gameOver = document.getElementsByClassName('game-over')[0];
    gameOver.remove();
};

Game.prototype.gameOver = function () {
    window.entityQueue = [];
    window.player.hide();
    var shading = new GameOverShading();
    window.entityQueue.push(shading);

    // use this.newScore in message in case the game ends and this.score isn't finished animating
    var message = '<h2>You scored <span class="score">' + this.newScore + '</span> points!</h2><a href="#" class="restart">Play again?</a>';
    var wrapper = document.getElementsByClassName('wrapper')[0];

    var gameOverHTML = document.createElement('div');
    gameOverHTML.classList.add('game-over');
    gameOverHTML.innerHTML = message;
    wrapper.appendChild(gameOverHTML);

    var _this = this;
    var playAgain = document.getElementsByClassName('restart')[0];
    playAgain.addEventListener('click', function () {
        _this.restart();
    });
};


// Set up required variables and start the game
var entityQueue = [];
window.entityQueue = entityQueue;

var game = new Game();
window.game = game;

var player = new Player();
window.player = player;

game.init();
game.addInstructions();
