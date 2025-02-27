// the game itself
var game;

/* store the various game options */
var gameOptions = {

    // width of the game, in pixels. Height will be calculated accordingly
    gameWidth: 800,

    /* first floor position */
    floorStart: 1 / 8 * 5,

    // gap between two floors, in pixels.
    floorGap: 250,

    // local player gravity, managed by ARCADE physics.
    playerGravity: 10000,

    // player movement speed, in pixels per second
    playerSpeed: 450,

    // player climibng speed, in pixelsp per second
    climbSpeed: 450,

    // force applied to the player when the character jumps
    playerJump: 1800,

    // speed of arrows, in pixels per second
    arrowSpeed: 1000,

    /* probablity of coin produce. If a coin produced decided by if the random
        number ranged from 0 to @coinRation bigger than 0.  */
    coinRatio: 2,

    // monster speed, in pixels per second
    monsterSpeed: 250,

    /*  Similar with coinRatio*/
    doubleSpikeRatio: 1,

    skyColor: 0x89d7fb,

    /*  the radius, in pixel, distance bwtween dangerous object */
    safeRadius: 180,

    /*  the name of the variable where to save game information into local storage.*/
    localStorageName: "ladderzGame",

    // version of the game. Just in case you need to display it somewhere
    versionNumber: "1.0",

    // relative path where to store sprites
    spritesPath: "static/assets/sprites/",

    // relative path where to store fonts
    fontsPath: "static/assets/fonts/",

    // relative path where to store setBounds
    soundPath: "static/assets/sounds/"
}

// it's the first function to be executed
window.onload = function() {

    // windowWidth variable gets the width in pixels of the browser window viewport
    var windowWidth = window.innerWidth;

    // windowHeight variable gets the height in pixels of the browser window viewport
    var windowHeight = window.innerHeight;

    // if windowWidth is greater than windowHeight we are playing in landscape mode
    if(windowWidth > windowHeight){
        windowHeight = windowWidth * 1.8;
    }

    // windowWidth = 750
    // windowHeight = 1334
    // gameOptions.gameWidth = 800 (fixed value)
    // gameHeight = 1334 * 800 / 750 = 1423
    // 750x1334 has the same aspect ratio as 800x1423
    var gameHeight = windowHeight * gameOptions.gameWidth / windowWidth;

    // create the game itself with a new Phaser.Game instance.
    game = new Phaser.Game(gameOptions.gameWidth, gameHeight);

    game.state.add("BootGame", bootGame);

    // creation of "PreloadGame" state
    game.state.add("PreloadGame", preloadGame);

    // creation of "PlayGame" state
    game.state.add("PlayGame", playGame);

    game.state.start("BootGame");
}

/*  bootGame is the first state to be called*/
var bootGame = function(game){}
bootGame.prototype = {

    // create method is automatically executed once the state has been created.
    create: function(){

        // assigning a background color to the game
        game.stage.backgroundColor = gameOptions.skyColor;

        // we'll execute next lines only if the game is not running on a desktop
        if(!Phaser.Device.desktop){

            game.scale.forceOrientation(false, true);

            // this function is executed when the game enters in an incorrect orientation
            game.scale.enterIncorrectOrientation.add(function(){

                // pausing the game. a paused game doesn't update any of its subsystems
                game.paused = true;

                // hiding the canvas
                document.querySelector("canvas").style.display = "none";

                // showing the div with the "wrong orientation" message
                document.getElementById("wrongorientation").style.display = "block";
            })

            // this function is executed when the game enters in an correct orientation
            game.scale.leaveIncorrectOrientation.add(function(){

                // resuming the game
                game.paused = false;

                // showing the canvas
                document.querySelector("canvas").style.display = "block";

                // hiding the div with the "wrong orientation" message
                document.getElementById("wrongorientation").style.display = "none";
            })
        }

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        // centering the canvas horizontally and vertically
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        // prevent the game to pause if it loses focus.
        game.stage.disableVisibilityChange = true;

        // now start "PreloadGame" state
        game.state.start("PreloadGame");
    }
}

// in preloadGame we will preload all game assets
var preloadGame = function(game){}
preloadGame.prototype = {

    // preload method is automatically executed at preload time, before "create" method
    preload: function(){

        game.load.image("floor", gameOptions.spritesPath + "floor.png");
        game.load.image("ladder", gameOptions.spritesPath + "ladder.png");
        game.load.image("coinparticle", gameOptions.spritesPath + "coinparticle.png");
        game.load.image("spike", gameOptions.spritesPath + "spike.png");
        game.load.image("cloud", gameOptions.spritesPath + "cloud.png");
        game.load.image("arrow", gameOptions.spritesPath + "arrow.png");
        game.load.image("monster", gameOptions.spritesPath + "monster.png");
        game.load.image("spikedmonster", gameOptions.spritesPath + "spikedmonster.png");
        game.load.image("tap", gameOptions.spritesPath + "tap.png");

        /*  time to load the sound effects.
            it's the same concept applied to images, with the key/path couple of arguments  */
        game.load.audio("coinsound", gameOptions.soundPath + "coin.mp3");
        game.load.audio("jumpsound", gameOptions.soundPath + "jump.mp3");
        game.load.audio("hurtsound", gameOptions.soundPath + "hurt.mp3");


        game.load.spritesheet("hero", gameOptions.spritesPath + "heroWZ.png", 32, 48);
        game.load.spritesheet("coin", gameOptions.spritesPath + "coin.png", 48, 48);
        game.load.spritesheet("fire", gameOptions.spritesPath + "fire.png", 32, 58);

        game.load.bitmapFont("font", gameOptions.fontsPath + "CNFont_0.png", gameOptions.fontsPath + "CNFont.fnt");
    },

    // create method is automatically executed once the state has been created.
    create: function(){

        // now start "PlayGame" state
        game.state.start("PlayGame");
    }
}

// in playGame
var playGame = function(game){}
playGame.prototype = {

    create: function(){

        this.savedData = localStorage.getItem(gameOptions.localStorageName) == null ? {score : 0, coins: 0} : JSON.parse(localStorage.getItem(gameOptions.localStorageName));

        this.setDefaultProperties();

        // this method will add audio to the game
        this.addAudio();

        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.world.setBounds(0, - 3 * gameOptions.floorGap, game.width, game.height + 3 * gameOptions.floorGap);

        this.defineGroups();

        // this method will create a particle emitter to be used when the player collects a coin
        this.createParticles();

        // this method will create a fixed overlay where we'll place the score
        this.createOverlay();

        // this method will create the menu
        this.createMenu();

        // this method will define the tweens to be used in game
        this.defineTweens();

        // this method will draw the level
        this.drawLevel();

        game.input.onDown.add(this.handleTap, this);
    },

    // method to set default properties
    setDefaultProperties: function(){
        // this property will let us know if it's game over. It starts with "false" value because the game is not over yet
        this.gameOver = false;

        this.reachedFloor = 0;

        // collectedCoins counts the coins the player collects. Starts at zero. No coins.
        this.collectedCoins = 0;

        // flag to determine if the player can jump
        this.canJump = true;

        // flag to determine if the player is climbing a ladder
        this.isClimbing = false;

        // the empty array for floor pooling
        this.floorPool = [];

        // the empty array for ladder pooling
        this.ladderPool = [];

        // the empty array for coin pooling
        this.coinPool = [];

        // the empty array for spike pooling
        this.spikePool = [];

        // the empty array for fire pooling
        this.firePool = [];

        // the empty array for arrow pooling
        this.arrowPool = [];

        // the empty array for monster pooling
        this.monsterPool = [];

        // the empty array for spiked monster pooling
        this.spikedMonsterPool = [];
    },

    // this method will define the sound effects used in the game
    addAudio: function(){

        this.coinSound = game.add.audio("coinsound");
        this.hurtSound = game.add.audio("hurtsound");
        this.jumpSound = game.add.audio("jumpsound");
    },

    // method defines the groups used in the game
    defineGroups: function(){

        this.gameGroup = game.add.group();

        // group which will contain all floors
        this.floorGroup = game.add.group();

        // floorGroup is a child of gameGroup
        this.gameGroup.add(this.floorGroup);

        // group which will contain all ladders, child of gameGroup
        this.ladderGroup = game.add.group();
        this.gameGroup.add(this.ladderGroup);

        // group which will contain all coins, child of gameGroup
        this.coinGroup = game.add.group();
        this.gameGroup.add(this.coinGroup);

        // group which will contain all flames, monsters and spikes, child of gameGroup
        this.deadlyGroup = game.add.group();
        this.gameGroup.add(this.deadlyGroup);

        // group which will contain all arrows, child of gameGroup
        this.arrowGroup = game.add.group();
        this.gameGroup.add(this.arrowGroup);

        // group which will contain overlay information
        this.overlayGroup = game.add.group();

        // group which will contain the menu
        this.menuGroup = game.add.group();
    },

    // method to create a particle emitter
    createParticles: function(){

        this.emitter = game.add.emitter(0, 0, 80);

        // telling the emitter we will be using the image with "coinparticle" key
        this.emitter.makeParticles("coinparticle");

        this.emitter.setAlpha(0.4, 0.6);

        this.emitter.setScale(0.4, 0.6, 0.4, 0.6);

        // the emitter is added to gameGroup group
        this.gameGroup.add(this.emitter);
    },

    // method to create the overlay
    createOverlay: function(){

        var cloud = game.add.sprite(0, game.height, "cloud");

        cloud.anchor.set(0, 1);

        cloud.tint = gameOptions.skyColor;

        // adding the cloud to overlayGroup
        this.overlayGroup.add(cloud);

        var highScoreText = game.add.bitmapText(game.width - 10, game.height - 10, "font", "最佳分数：" + this.savedData.score.toString(), 30);

        // bitmap texts can also have their registration point set
        highScoreText.anchor.set(1, 1);

        // scoreText is also added to overlayGroup
        this.overlayGroup.add(highScoreText);

        // same concept applies to the bitmap text which shows the amount of coins collected
        var coinsText = game.add.bitmapText(game.width / 2, game.height - 10, "font", "金币" + this.savedData.coins.toString(), 30);
        coinsText.anchor.set(0.5, 1);
        this.overlayGroup.add(coinsText);

        this.scoreText = game.add.bitmapText(10, game.height - 10, "font", "分数：0", 30);
        this.scoreText.anchor.set(0, 1);
        this.overlayGroup.add(this.scoreText);
    },

    // method to create the menu
    createMenu: function(){

        // adding "tap" image, setting its registration point and adding it to "menuGroup" group
        var tap = game.add.sprite(game.width / 2, game.height - 150, "tap");
        tap.anchor.set(0.5);
        this.menuGroup.add(tap);

        var tapTween = game.add.tween(tap).to({
            alpha: 0
        }, 200, Phaser.Easing.Cubic.InOut, true, 0, -1, true);

        // adding a bitmap text with in-game instructions ("tap to jump"), setting its anchor and add it to menuGroup group
        var tapText = game.add.bitmapText(game.width / 2, tap.y - 120, "font", "史上死得最快游戏", 45);
        tapText.anchor.set(0.5);
        this.menuGroup.add(tapText);

        // adding a bitmap text with game title, setting its anchor and add it to menuGroup group
        var titleText = game.add.bitmapText(game.width / 2, tap.y - 200, "font", "抓住那个肥球", 90);
        titleText.anchor.set(0.5);
        this.menuGroup.add(titleText);
    },

    // method to define the tween which scrolls the level as the player climbs the ladders
    defineTweens: function(){

        // we keep a counter to reming us how many tweens we have to go, starting at zero
        this.tweensToGo = 0;

        this.scrollTween = game.add.tween(this.gameGroup);
        this.scrollTween.to({
            y: gameOptions.floorGap
        }, 500, Phaser.Easing.Cubic.Out);

        // this is another tween feature: we can add a callback function to be executed when the tween is complete
        this.scrollTween.onComplete.add(function(){

            this.gameGroup.y = 0;

            // now we loop through all gameGroup children executing the function having "item" argument = the child of the group
            this.gameGroup.forEach(function(item){

                if(item.length > 0){

                    // we loop through all the children of the child. Now "subItem" is the child of the child
                    item.forEach(function(subItem) {

                        subItem.y += gameOptions.floorGap;

                        if(subItem.y > game.height){

                            switch(subItem.key){
                                case "floor":

                                    // removing the floor
                                    this.killFloor(subItem);
                                    break;
                                case "ladder":

                                    // removing the ladder
                                    this.killLadder(subItem);
                                    break;
                                case "coin":

                                    // removing the coin
                                    this.killCoin(subItem);
                                    break;
                                case "spike":

                                    // removing the spike
                                    this.killSpike(subItem);
                                    break;
                                case "fire":

                                    // removing the fire
                                    this.killFire(subItem);
                                    break;
                                case "arrow":

                                    // removing the arrow
                                    this.killArrow(subItem);
                                    break;
                                case "monster":

                                    // removing the monster
                                    this.killMonster(subItem);
                                    break;
                                case "spikedmonster":

                                    // removing the spiked monster
                                    this.killSpikedMonster(subItem);
                                    break;
                            }
                        }
                    }, this);
                }
                else{

                    // if the item has length equal to zero, that is has not children, move it down by "floorGap"
                    item.y += gameOptions.floorGap;
                }
            }, this);

            // this method will populate the floor with enemies
            this.populateFloor(true);

            // if we have more tweens to go...
            if(this.tweensToGo > 0){

                // decrease tweens to go...
                this.tweensToGo --;

                // ...and start the tween
                this.scrollTween.start();
            }
        }, this);
    },

    // method to draw the level, that is the entire game with all floors
    drawLevel: function(){

        // creation of a local variable which keep tracks of current floor
        var currentFloor = 0;

        this.highestFloorY = game.height * gameOptions.floorStart;

        while(this.highestFloorY > - 2 * gameOptions.floorGap){

                this.populateFloor(currentFloor > 0);

                // at this time we added a floor, so it's time to update highestFloorY value
                this.highestFloorY -= gameOptions.floorGap;

                // increasing currentFloor counter
                currentFloor ++;
        }

        this.highestFloorY += gameOptions.floorGap;

        // this method will add the hero to the game
        this.addHero();
    },

    // method to populate a floor, with a Boolean argument telling us if we also have to add stuff
    populateFloor: function(addStuff){

        // first, we call addFloor method which will add the floor itself
        this.addFloor();

        if(addStuff){

            this.safeZone = [];
            this.safeZone.length = 0;

            this.addLadder();

            this.addCoin(null);

            var deadlyItems = game.rnd.integerInRange(1, 2)

            // loop executed deadlyItems times
            for(var i = 0; i < deadlyItems; i++){

                var stuffToAdd = game.rnd.integerInRange(0, 4);

                // which deadly item are we going to add?
                switch(stuffToAdd){
                    case 0:

                        // addSpike method  will add a spike
                        this.addSpike();
                        break;
                    case 1:

                        // addFire method will add the fire
                        this.addFire();
                        break;
                    case 2:

                        // addArrow method will add an arrow
                        this.addArrow();
                        break;
                    case 3:

                        // addMonster method will add a killable monster
                        this.addMonster();
                        break;
                    case 4:

                        // addSpikedMonster method will add a monster which can't be killed
                        this.addSpikedMonster();
                        break;
                }
            }
        }
    },

    // method to add a floor
    addFloor: function(){

        // first, we see if we already have a floor sprite in the pool
        if(this.floorPool.length > 0){

            // if we find a floor in the pool, let's remove it from the pool
            var floor = this.floorPool.pop();

            // placing the floor at the vertical highest floor position allowed in the game
            floor.y = this.highestFloorY;

            // make the floor revive, setting its "alive", "exists" and "visible" properties all set to true
            floor.revive();
        }

        // this is the case we did not find any floor in the pool
        else{

            // adding the floor sprite
            var floor = game.add.sprite(0, this.highestFloorY, "floor");

            // adding floor sprite to floor group
            this.floorGroup.add(floor);

            // enabling ARCADE physics to the floor
            game.physics.enable(floor, Phaser.Physics.ARCADE);

            /*  setting floor body to immovable.
                an immovable Body will not receive any impacts from other bodies  */
            floor.body.immovable = true;

            floor.body.checkCollision.down = false;
        }
    },

    // method to add a ladder
    addLadder: function(){

        // ladderXPosition is the random horizontal placement of the ladder, with a 50 pixels margin from game borders
        var ladderXPosition = game.rnd.integerInRange(50, game.width - 50);

        // first, we see if we already have a ladder sprite in the pool
        if(this.ladderPool.length > 0){

            // if we find a floor in the pool, let's remove it from the pool
            var ladder = this.ladderPool.pop();

            // placing the ladder at horizontal ladderXPosition
            ladder.x = ladderXPosition;

            // placing the ladder at the vertical highest floor position allowed in the game
            ladder.y = this.highestFloorY;

            // make the ladder revive, setting its "alive", "exists" and "visible" properties all set to true
            ladder.revive();
        }

        // this is the case we did not find any ladder in the pool
        else{

            // adding the ladder sprite
            var ladder = game.add.sprite(ladderXPosition, this.highestFloorY, "ladder");

            // adding ladder to ladder group
            this.ladderGroup.add(ladder);

            // changing ladder registration point to horizontal:center and vertical:top
            ladder.anchor.set(0.5, 0);

            // enabling ARCADE physics to the floor
            game.physics.enable(ladder, Phaser.Physics.ARCADE);

            // setting ladder's body as immovable
            ladder.body.immovable = true;
        }

        this.safeZone .push({
            start: ladderXPosition - gameOptions.safeRadius,
            end: ladderXPosition + gameOptions.safeRadius
        });
    },

    // method to add an arrow
    addArrow: function(){

        /*  arrowX can take two values:
            * 0 if the arrow will be placed on the left side
            * 1 is the arrow will be placed on the right side  */
        var arrowX = game.rnd.integerInRange(0, 1);

        // arrowY is the vertical position where to place the arrow
        var arrowY = this.highestFloorY - 20;

        // first, we see if we already have an arrow sprite in the pool
        if(this.arrowPool.length > 0){

            // if we find an arrow in the pool, let's remove it from the pool
            var arrow = this.arrowPool.pop();

            arrow.reset(game.width * arrowX, arrowY);

            // custom property to tell us if the arrow is firing, initially set to false
            arrow.isFiring = false;

            /*  this line will just flip the arrow horizontally if it's on the right side of the game.
                you can flip horizontally a sprite by setting its x scale to -1  */
            arrow.scale.x = 1 - 2 * arrowX;

            // make the arrow revive, setting its "alive", "exists" and "visible" properties all set to true
            arrow.revive();
        }

        // this is the case we did not find any arrow in the pool
        else{

            // adding the ladder sprite
            var arrow = game.add.sprite(game.width * arrowX, arrowY, "arrow");

            // custom property to tell us if the arrow is firing, initially set to false
            arrow.isFiring = false;

            // setting arrow registration point to center both horizontally and vertically
            arrow.anchor.set(0.5);

            // this line will just flip the arrow horizontally if it's on the right side of the game.
            arrow.scale.x = 1 - 2 * arrowX;

            // enabling ARCADE physics to the arrow
            game.physics.enable(arrow, Phaser.Physics.ARCADE);

            // setting arrow's body as immovable
            arrow.body.immovable = true;

            // adding arrow to arrow group
            this.arrowGroup.add(arrow);
        }
    },

    // method to add a monster
    addMonster: function(){

        // monsterX is the random horizontal placement of the monster, with a 50 pixels margin from game borders
        var monsterX = game.rnd.integerInRange(50, game.width - 50);

        // monsterY is the vertical position where to place the monster
        var monsterY = this.highestFloorY - 20;

        // first, we see if we already have a monster sprite in the pool
        if(this.monsterPool.length > 0){

            // if we find a monster in the pool, let's remove it from the pool
            var monster = this.monsterPool.pop();

            // setting monster x coordinate
            monster.x = monsterX;

            // setting monster y coordinate
            monster.y = monsterY;

            // make the monster revive, setting its "alive", "exists" and "visible" properties all set to true
            monster.revive();
        }

        // this is the case we did not find any monster in the pool
        else{

            // adding the monster sprite
            var monster = game.add.sprite(monsterX, monsterY, "monster");

            // setting monster registration point to center both horizontally and vertically
            monster.anchor.set(0.5);

            // enabling ARCADE physics to the monster
            game.physics.enable(monster, Phaser.Physics.ARCADE);

            // setting monster's body as immovable
            monster.body.immovable = true;

            /*  an ARCADE physics body can be set to collide against the world bounds automatically
                and rebound back into the world if collideWorldBounds property is set to true  */
            monster.body.collideWorldBounds = true;

            // setting the velocity of the monster, in pixels per second.
            monster.body.velocity.x = gameOptions.monsterSpeed;

            monster.body.onWorldBounds = new Phaser.Signal();

            monster.body.onWorldBounds.add(function(sprite, up, down, left, right){

                // collision against the left bound of the game
                if(left){

                    // adjusting the velocity so that the sprite moves to the right
                    sprite.body.velocity.x = gameOptions.monsterSpeed;

                    // do not horizontally flip the sprite (the original image is with the sprite looking to the right)
                    sprite.scale.x = 1;
                }

                // collision against the right bound of the game
                if(right){

                    // adjusting the velocity so that the sprite moves to the left
                    sprite.body.velocity.x = -gameOptions.monsterSpeed;

                    // horizontally flip the sprite (the original image is with the sprite looking to the right)
                    sprite.scale.x = -1;
                }
            });

            // adding monster to the group of deadly objects
            this.deadlyGroup.add(monster);
        }
    },

    // method to add a spiked monster
    addSpikedMonster: function(){

        // monsterX is the random horizontal placement of the spiked monster, with a 50 pixels margin from game borders
        var monsterX = game.rnd.integerInRange(50, game.width - 50);

        // monsterY is the vertical position where to place the spiked monster
        var monsterY = this.highestFloorY - 25;

        // first, we see if we already have a spiked monster sprite in the pool
        if(this.spikedMonsterPool.length > 0){

            // if we find a spiked monster in the pool, let's remove it from the pool
            var monster = this.spikedMonsterPool.pop();

            // setting spiked monster x coordinate
            monster.x = monsterX;

            // setting spiked monster y coordinate
            monster.y = monsterY;

            // make the spiked monster revive, setting its "alive", "exists" and "visible" properties all set to true
            monster.revive();
        }

        // this is the case we did not find any spiked monster in the pool
        else{

            // adding the spiked monster sprite
            var monster = game.add.sprite(monsterX, monsterY, "spikedmonster");

            // setting spiked monster registration point to center both horizontally and vertically
            monster.anchor.set(0.5);

            // enabling ARCADE physics to the spiked monster
            game.physics.enable(monster, Phaser.Physics.ARCADE);

            // setting spiked monster's body as immovable
            monster.body.immovable = true;

            /*  an ARCADE physics body can be set to collide against the world bounds automatically
                and rebound back into the world if collideWorldBounds property is set to true  */
            monster.body.collideWorldBounds = true;

            // setting the velocity of the spiked monster, in pixels per second.
            monster.body.velocity.x = gameOptions.monsterSpeed;

            monster.body.onWorldBounds = new Phaser.Signal();

            monster.body.onWorldBounds.add(function(sprite, up, down, left, right){

                // collision against the left bound of the game
                if(left){

                    // adjusting the velocity so that the sprite moves to the right
                    sprite.body.velocity.x = gameOptions.monsterSpeed;

                    // do not horizontally flip the sprite (the original image is with the sprite looking to the right)
                    sprite.scale.x = 1;
                }

                // collision against the right bound of the game
                if(right){

                    // adjusting the velocity so that the sprite moves to the left
                    sprite.body.velocity.x = -gameOptions.monsterSpeed;

                    // horizontally flip the sprite (the original image is with the sprite looking to the right)
                    sprite.scale.x = -1;
                }
            });

            // adding spiked monster to the group of deadly objects
            this.deadlyGroup.add(monster);
        }
    },

    // method to add a coin
    addCoin: function(creationPoint){

        if(game.rnd.integerInRange(0, gameOptions.coinRatio) != 0 || creationPoint != null){

            // coinX is the random horizontal placement of the coin, with a 50 pixels margin from game borders
            var coinX = game.rnd.integerInRange(50, game.width - 50);

            // coinY is the vertical position where to place the coin, it should appear in the middle height of a floor
            var coinY = this.highestFloorY - gameOptions.floorGap / 2;

            // if creation point is not null, that is we have a given coordinate where to place the coin...
            if(creationPoint != null){

                // overwrite coinX
                coinX = creationPoint.x;

                // overwrite coinY
                coinY = creationPoint.y;
            }

            // first, we see if we already have a coin sprite in the pool
            if(this.coinPool.length > 0){

                // if we find a coin in the pool, let's remove it from the pool
                var coin = this.coinPool.pop();

                // setting coin x coordinate
                coin.x = coinX;

                // setting coin y coordinate
                coin.y = coinY;

                // make the coin revive, setting its "alive", "exists" and "visible" properties all set to true
                coin.revive();
            }

            // this is the case we did not find any coin in the pool
            else{

                // adding the coin sprite
                var coin = game.add.sprite(coinX, coinY, "coin");

                var coinAnimation = coin.animations.add("rotate");

                coin.animations.play("rotate", 15, true);

                // setting coin registration point to center both horizontally and vertically
                coin.anchor.set(0.5);

                // enabling ARCADE physics to the coin
                game.physics.enable(coin, Phaser.Physics.ARCADE);

                // setting coin's body as immovable
                coin.body.immovable = true;

                // adding the coin to the group of coins
                this.coinGroup.add(coin);
            }
        }
    },

    // method to add a spike
    addSpike: function(){

        // normally we are placing one spike
        var spikes = 1;

        // but if a random integer number between zero and doubleSpikeRatio (both included) is equal to zero...
        if(game.rnd.integerInRange(0, gameOptions.doubleSpikeRatio) == 0){

            // we will be placing two spikes
            spikes = 2;
        }

        // exectuing this loop "spikes" times
        for(var i = 1; i <= spikes; i++){

            var spikeXPosition = this.findSafePosition();

            // setting spike y coordinate
            var spikeYPosition = this.highestFloorY - 20;

            // if we have a safe position where to place the spike...
            if(spikeXPosition){

                // first, we see if we already have a spike sprite in the pool
                if(this.spikePool.length > 0){

                    // if we find a spike in the pool, let's remove it from the pool
                    var spike = this.spikePool.pop();

                    // setting spike x coordinate
                    spike.x = spikeXPosition;

                    // setting spike y coordinate
                    spike.y = spikeYPosition;

                    // make the spike revive, setting its "alive", "exists" and "visible" properties all set to true
                    spike.revive();
                }

                // this is the case we did not find any spike in the pool
                else{

                    // adding the spike sprite
                    var spike = game.add.sprite(spikeXPosition, spikeYPosition, "spike");

                    // changing spike registration point to horizontal:center and vertical:top
                    spike.anchor.set(0.5, 0);

                    // enabling ARCADE physics to the spike
                    game.physics.enable(spike, Phaser.Physics.ARCADE);

                    // setting spike's body as immovable
                    spike.body.immovable = true;

                    // adding the spike to the group of deadly objects
                    this.deadlyGroup.add(spike);
                }
            }
        }
    },

    // method to add fire
    addFire: function(){
        // normally we are placing one fireplace
        var firePlaces = 1;

        // but if a random integer number between zero and doubleSpikeRatio (both included) is equal to zero...
        if(game.rnd.integerInRange(0, gameOptions.doubleSpikeRatio) == 0){

            // we will be placing two fires
            firePlaces = 2;
        }

        // exectuing this loop "firePlaces" times
        for(var i = 1; i <= firePlaces; i++){

            var fireXPosition = this.findSafePosition();

            // setting fire y coordinate
            var fireYPosition = this.highestFloorY - 58;

            // if we have a safe position where to place the fire...
            if(fireXPosition){

                // first, we see if we already have a fire sprite in the pool
                if(this.firePool.length > 0){

                    // if we find a fire in the pool, let's remove it from the pool
                    var fire = this.firePool.pop();

                    // setting fire x coordinate
                    fire.x = fireXPosition;

                    // setting fire  y coordinate
                    fire.y = fireYPosition;

                    // make the fire revive, setting its "alive", "exists" and "visible" properties all set to true
                    fire.revive();
                }

                // this is the case we did not find any fire in the pool
                else{

                    // adding the fire sprite
                    var fire = game.add.sprite(fireXPosition, fireYPosition, "fire");

                    var fireAnimation = fire.animations.add("burn");

                    fire.animations.play("burn", 15, true);

                    // changing fire registration point to horizontal:center and vertical:top
                    fire.anchor.set(0.5, 0);

                    // enabling ARCADE physics to the fire
                    game.physics.enable(fire, Phaser.Physics.ARCADE);

                    // setting fire's body as immovable
                    fire.body.immovable = true;

                    // adding the fire to the group of deadly objects
                    this.deadlyGroup.add(fire);
                }
            }
        }
    },

    // method to find a safe position where to place a spike or a fire
    findSafePosition: function(){

        var attempts = 0;

        // ok let's start finding the safe position
        do{

            // updating the amount of attempts
            attempts ++;

            // tossing a random position, with a 150 pixels margin from game borders
            var posX = game.rnd.integerInRange(150, game.width - 150);

        } while(!this.isSafe(posX) && attempts < 10);

        // did we find a safe position?
        if(this.isSafe(posX)){

            // adding the new range to safeZone array
            this.safeZone.push({
                start: posX - gameOptions.safeRadius,
                end: posX + gameOptions.safeRadius
            });

            // return the position itself
            return posX;
        }

        // if we did not find a safe position, return false
        return false;
    },

    // method to check if a position is safe, the argument is the x coordinate
    isSafe: function(n){

        // looping through all safeZone array items
        for(var i = 0; i < this.safeZone.length; i++){

            // if the x coordinate is inside a safeZone item interval...
            if(n > this.safeZone[i].start && n < this.safeZone[i].end){

                // ... then it's not a safe zone, return false
                return false;
            }
        }

        return true;
    },

    // method to add the hero
    addHero: function(){

        // adding the hero sprite
        this.hero = game.add.sprite(game.width / 2, game.height * gameOptions.floorStart - 48, "hero");

        this.hero.animations.add("walk", [0, 1, 2, 3]);

        // following the same concept, "climb" animation uses frames 2 and 3
        this.hero.animations.add("climb", [4, 5]);

        // start playing "walk" animation, at 15 frames per second, in loop mode
        this.hero.animations.play("walk", 15, true);

        // adding the hero to game group
        this.gameGroup.add(this.hero);

        // setting hero registration point to horizontal: center and vertical: top
        this.hero.anchor.set(0.5, 0);

        // enabling ARCADE physics for the hero
        game.physics.enable(this.hero, Phaser.Physics.ARCADE);

        // the hero will collide on world bounds
        this.hero.body.collideWorldBounds = true;

        /*  this is how we apply a local gravity to a body.
            the hero is the only sprite in game with a gravity  */
        this.hero.body.gravity.y = gameOptions.playerGravity;

        // setting the velocity of the hero, in pixels per second
        this.hero.body.velocity.x = gameOptions.playerSpeed;

        this.hero.body.onWorldBounds = new Phaser.Signal();

        this.hero.body.onWorldBounds.add(function(sprite, up, down, left, right){

            // collision against the left bound of the game
            if(left){

                // adjusting the velocity so that the sprite moves to the right
                this.hero.body.velocity.x = gameOptions.playerSpeed;

                // do not horizontally flip the sprite (the original image is with the sprite looking to the right)
                this.hero.scale.x = 1;
            }

            // collision against the right bound of the game
            if(right){

                // adjusting the velocity so that the sprite moves to the left
                this.hero.body.velocity.x = -gameOptions.playerSpeed;

                 // horizontally flip the sprite (the original image is with the sprite looking to the right)
                this.hero.scale.x = -1;
            }

            // collision against the bottom bound of the game
            if(down){

                localStorage.setItem(gameOptions.localStorageName,JSON.stringify({

                        // score takes the highest value between currently saved score and the amount of floors climbed
                        score: Math.max(this.reachedFloor, this.savedData.score),

                        // collected coins are added to previoulsy saved coins
                        coins: this.collectedCoins + this.savedData.coins
                }));

                // and finally the game restarts. yes, when you touch the bottom bound of the game it's game over
                game.state.start("PlayGame");
            }
        }, this)
    },

    // this method handles player input
    handleTap: function(){

        // if menu is still in the game...
        if(this.menuGroup != null){

            // then remove it
            this.menuGroup.destroy();
        }

        if(this.canJump && !this.isClimbing && !this.gameOver){

            this.hero.body.velocity.y = -gameOptions.playerJump;

            // playing jump sound
            this.jumpSound.play();

            // the hero now is jumping so at the moment it cannot jump again
            this.canJump = false;
        }
    },

    // update method is atuomatically executed at each frame
    update: function(){

        // if it's not game over...
        if(!this.gameOver){

            // method to fire an arrow
            this.fireArrow();

            // method to check for hero Vs floor collision
            this.checkFloorCollision();

            // method to check for hero Vs ladder collision
            this.checkLadderCollision();

            // method to check for hero Vs coin collision
            this.checkCoinCollision();

            // method to chech for hero Vs deadly enemies collision
            this.checkDeadlyCollision();

            // method to check for hero Vs arrow collision
            this.checkArrowCollision();
        }
    },

    // this method will fire an arrow
    fireArrow(){

        // now we loop through all arrowGroup children executing the function having "item" argument = the arrow child of the group
        this.arrowGroup.forEach(function(item){

            // we check if the arrow has about the same vertical position as the hero
            if(Math.abs(item.y - this.hero.y) < 10){

                // is the arrow already firing?
                if(!item.isFiring){

                    game.time.events.add(game.rnd.integerInRange(500, 1500), function(){

                        // giving arrow body a x velocity keeping an eye on arrow scale which changes according to arrow direction
                        item.body.velocity.x = gameOptions.arrowSpeed * item.scale.x;
                    }, this);

                    // ok, now the arrow is firing
                    item.isFiring = true;
                }
                return;
            }
        }, this)
    },

    // this method checks for collision between hero and floors
    checkFloorCollision: function(){

        game.physics.arcade.collide(this.hero, this.floorGroup, function(){

            // if the hero collided with a floor, it can jump again
            this.canJump = true;
        }, null, this);
    },

    // this method checks for collision between hero and ladders
    checkLadderCollision: function(){

        // if the hero is not climbing...
        if(!this.isClimbing){

            game.physics.arcade.overlap(this.hero, this.ladderGroup, function(player, ladder){

                /*  checking if the hero is within a 10 pixels radius from the ladder,
                    we will climb it if it's true  */
                if(Math.abs(player.x - ladder.x) < 10){

                    // saving the ladder we are going to climb into ladderToClimb property
                    this.ladderToClimb = ladder;

                    // stop moving the hero horizontally
                    this.hero.body.velocity.x = 0;

                    // moving the hero vertically, up at climbSpeed pixels/second
                    this.hero.body.velocity.y = - gameOptions.climbSpeed;

                    // stop applying gravity to the hero, to avoid climb speed to decrease
                    this.hero.body.gravity.y = 0;

                    // the hero is climbing
                    this.isClimbing = true;

                    // playing "climb" animation, at 15 frames per second in loop mode
                    this.hero.animations.play("climb", 15, true);

                    if(this.scrollTween.isRunning){

                        // in this case don't do anything, just update tweensToGo
                        this.tweensToGo ++;
                    }
                    else{

                        // if we don't have scrollTween already running, then start it
                        this.scrollTween.start();
                    }
                }
            }, null, this);
        }

        // this is the case the hero is already climbing
        else{

            // we are checking hero y position to see if the hero completely climbed the stair
            if(this.hero.y < this.ladderToClimb.y - 40){

                // restoring player gravity
                this.hero.body.gravity.y = gameOptions.playerGravity;

                // restoring player horizontal speed
                this.hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x;

                // setting player vertical speed to zero - no more climbing
                this.hero.body.velocity.y = 0;

                // the hero is not climbing now
                this.isClimbing = false;

                // let's start play "walk" animation again
                this.hero.animations.play("walk", 15, true);

                // updating reachedFloor property as we climbed one more floor
                this.reachedFloor ++;

                // updating text property of a bitmap text will update the text it shows
                this.scoreText.text = this.reachedFloor.toString();
            }
        }
    },

    // this method checks for collision between hero and coins
    checkCoinCollision: function(){

        game.physics.arcade.overlap(this.hero, this.coinGroup, function(player, coin){

            // placing particle emitter in the same x coordinate of the coin
            this.emitter.x = coin.x;

            // placing particle emitter in the same y coordinate of the coin
            this.emitter.y = coin.y;

            this.emitter.start(true, 1000, null, 20);

            // increasing the amount of collected coins
            this.collectedCoins ++;

            // calling killCoin method which will remove the coin
            this.killCoin(coin);

            // playing coin sound
            this.coinSound.play();
        }, null, this);
    },

    // this method checks for collision between hero and arrows
    checkArrowCollision: function(){

        game.physics.arcade.overlap(this.hero, this.arrowGroup, function(hero, arrow){

            if(arrow.body.velocity.x != 0){

                /*  the hero has been hit by an arrow, it's game over, managed by
                    prepareToGameOver method  */
                this.prepareToGameOver();
            }
        }, null, this);
    },

    // this method checks for collision between hero and deadly objects
    checkDeadlyCollision: function(){

        game.physics.arcade.collide(this.hero, this.deadlyGroup, function(hero, deadly){

            if(deadly.key != "monster"){

                /*  the hero has been hit by something deadly, it's game over, managed by
                    prepareToGameOver method  */
                this.prepareToGameOver();
            }

            /*  this is the case the hero collided with a killable monster.
                let's see if the monster can be killed  */
            else{

                if(deadly.body.touching.up && hero.body.touching.down){

                    // making the player jump again, making it bounce over enemy's head
                    this.hero.body.velocity.y = -gameOptions.playerJump;

                    // playing jump sound
                    this.jumpSound.play();

                    // we are adding a coin at monster's position to reward the hero which bravely killed a monster
                    this.addCoin(deadly.position);

                    // removing the monster
                    this.killMonster(deadly);
                }
                else{

                    /*  the hero did not jump on monster's head, it's game over, managed by
                        prepareToGameOver method  */
                    this.prepareToGameOver();
                }
            }
        }, null, this);
    },

    // this method is called when the game is over
    prepareToGameOver: function(){

        // yes, it's game over
        this.gameOver = true;

        // playing hurt sound. losing a game hurts.
        this.hurtSound.play();

        // applying a random horizontal velocity to the player
        this.hero.body.velocity.x =  game.rnd.integerInRange(-20, 20);

        /*  making the player jump. this way the player will jump in a random direction
            giving emphasis to the death  */
        this.hero.body.velocity.y = -gameOptions.playerJump;

        /*  setting player gravity to its default value, just in case death happened
            on a ladder, where the player has no gravity  */
        this.hero.body.gravity.y = gameOptions.playerGravity;
    },

    // method to remove a floor
    killFloor: function(floor){

        /*  kill methos kills a a game objects, setting its "alive", "exists" and "visible" properties to false.
            killing a game object is a way to quickly recycle it in an object pool, like we are going to do  */
        floor.kill();

        // inserting floor sprite into floor pool by adding it into floorPool array
        this.floorPool.push(floor);
    },

    // method to remove a ladder
    killLadder: function(ladder){

        // killing the ladder
        ladder.kill();

        // inserting ladder sprite into ladder pool by adding it into ladderPool array
        this.ladderPool.push(ladder);
    },

    // method to remove a coin
    killCoin: function(coin){

        // killing the coin
        coin.kill();

        // inserting coin sprite into coin pool by adding it into coinPool array
        this.coinPool.push(coin);
    },

    // method to remove a spike
    killSpike: function(spike){

        // killing the spike
        spike.kill();

        // inserting spike sprite into spike pool by adding it into spikePool array
        this.spikePool.push(spike);
    },

    // method to remove a fire
    killFire: function(fire){

        // killing the fire
        fire.kill();

        // inserting fire sprite into fire pool by adding it into firePool array
        this.firePool.push(fire);
    },

    // method to remove an arrow
    killArrow: function(arrow){

        // killing the arrow
        arrow.kill();

        // inserting arrow sprite into arrow pool by adding it into arrowPool array
        this.arrowPool.push(arrow);
    },

    // method to remove a monster
    killMonster: function(monster){

        // killing the monster
        monster.kill();

        // inserting monster sprite into monster pool by adding it into monsterPool array
        this.monsterPool.push(monster);
    },

    // method to remove a spiked monster
    killSpikedMonster: function(spikedMonster){

        // killing the spiked monster
        spikedMonster.kill();

        // inserting spiked monster sprite into spiked monster pool by adding it into spikedMonsterPool array
        this.spikedMonsterPool.push(spikedMonster);
    }
}
