function Memory() {
    var self = this;

    /**
     * Array of all card elements on the game board
     *
     * @type {Array}
     */
    self.cards = [];

    /**
     * CSS Background property for card back
     * @type {string}
     */
    self.background = 'url("src/img/box-back.png")';

    /**
     * CSS Background properties for the available fronts
     * @type {string[]}
     */
    self.fronts = [
        'url("src/img/alakir.png")',
        'url("src/img/anubarak.png")',
        'url("src/img/bolvar.png")',
        'url("src/img/deathwing.png")',
        'url("src/img/gruul.png")',
        'url("src/img/rivendare.png")'
    ];

    /**
     * Counter for used fronts
     *
     * @type {Array}
     */
    self.usedOnce  = [];

    /**
     * Second counter for used fronts
     *
     * @type {Array}
     */
    self.usedAgain = [];

    /**
     * Previously opened card
     *
     * @type {null}
     */
    self.open = null;

    /**
     * Currently opened card
     *
     * @type {null}
     */
    self.current = null;

    /**
     * Flag to allow or block for processing more than one card at a time
     *
     * @type {boolean}
     */
    self.processing = false;

    /**
     * Base element in which to build the game board
     *
     * @type {null}
     */
    self.base = null;

    /**
     * Total number of matches found in the current game
     *
     * @type {number}
     */
    self.matches = 0;

    /**
     * Total number of cards in the game
     *
     * @type {number}
     */
    self.cardTotal = 0;

    /**
     * jQuery element for the game board
     *
     * @type {null}
     */
    self.gameBoard = null;

    /**
     * Current player
     *
     * @type {number}
     */
    self.activePlayer = 1;

    self.registered = false;

    /**
     * Initialize the memory game board
     *
     * @param element
     * @param options
     */
    self.init = function(element, options) {
        self.base = element;

        if (typeof options === 'undefined') {
            options = {};
        }

        self.cardTotal = options.cardTotal || self.fronts.length * 2;

        if (self.cardTotal/2 > self.fronts.length) {
            console.log('Not enough card fronts to make a game this size, returning to default size');
            self.cardTotal = self.fronts.length * 2;
        }

        self.buildMenu();

        self.registerEvents();

    };

    /**
     * Build start menu html
     */
    self.buildMenu = function() {
        var menu = $('<div>', {'class': 'menu'});
        self.base.append(menu);
        menu.append($('<div>', {'class': 'start', 'html': 'Start'}));
    };

    self.start = function() {
        //self.p1 = new AI(1);
        self.p2 = new AI(2, self.cardTotal);
        self.p1 = new Player(1, self.cardTotal);
        //self.p2 = new Player(2);

        self.buildGame();
        self.cards = self.gameBoard.children(".card");

        self.shuffleData();

        setTimeout(self.getActivePlayer().play, 1000);

    };

    /**
     * Builds the game board and cards
     *
     * @todo refactor code
     */
    self.buildGame = function() {
        self.gameBoard = $("<div>", {'class' : 'game-board'});

        var header = $("<div>", {'class': 'header'});

        var p1 = self.p1.buildPlayerStatsElement();

        header.append(p1);

        var p2 = self.p2.buildPlayerStatsElement();

        header.append(p2);

        self.gameBoard.append(header);
        var clear = $("<div>", {'class': 'clear'});
        self.gameBoard.append(clear);

        for (var i = 0; i < self.cardTotal; i++) {
            self.gameBoard.append($("<div>", {'class': 'card', 'data-index': i}));
        }

        self.base.append(self.gameBoard);
    };

    /**
     * Return random index for self.cards where each index may only be used twice
     *
     * @returns {number}
     */
    self.random = function () {
        var rand = Math.floor(Math.random() * self.cardTotal / 2);

        if (-1 != self.usedOnce.indexOf(rand) && -1 != self.usedAgain.indexOf(rand)) {
            /** If the selected index is already used twice, generate new index **/
            rand = self.random();
        } else if (-1 != self.usedOnce.indexOf(rand)  && -1 == self.usedAgain.indexOf(rand)) {
            /** If the index is only used once, add it to the usedAgain array **/
            self.usedAgain.push(rand);
        } else {
            /** If the number has never been used, add it to the usedOnce array **/
            self.usedOnce.push(rand);
        }

        return rand;
    };

    /**
     * Assign a random card front to each card
     */
    self.shuffleData = function() {
        self.cards.each(function () {
            $(this).data('img', self.fronts[self.random()]);
        });
    };

    /**
     * Process a match
     */
    self.matched = function() {
        /** Set success and animate current card **/
        self.current.data('success', true);
        self.current.css('animation', 'pulse 1s');

        /** Set success and animate previously opened card **/
        self.open.data('success', true);
        self.open.css('animation', 'pulse 1s');

        /** Clear current and previously opened cards **/
        self.open = null;
        self.current = null;

        self.getActivePlayer().scores();

        self.matches++;

        if (self.matches == self.cardTotal / 2) {
            self.end();
        }

        /** Allow for processing of clicks to resume **/
        self.processing = false;
    };

    /**
     * Process completion of game
     */
    self.end = function() {
        self.p1.complete();
        self.p2.complete();

        if (self.p1.score > self.p2.score) {
            self.winner = self.p1;
        } else if (self.p2.score > self.p1.score) {
            self.winner = self.p2;
        } else {
            self.winner = false;
        }

        self.buildScoreBoard();
    };

    self.buildScoreBoard = function() {
        self.base.find('.game-board .card').remove();

        var menu = $('<div>', {'class': 'menu'});
        self.base.append(menu);
        menu.append($('<div>', {'class': 'winner', 'html' : 'Winner: ' + self.winner.getName()}));

        menu.append($('<div>', {'class': 'restart', 'html': 'Restart'}));
    };

    /**
     * Reset selected cards
     */
    self.reset = function() {
        /** Set both current en previous cards back to default **/
        self.open.css("background-image", self.background);
        self.current.css("background-image", self.background);

        /** Clear current and previously opened cards **/
        self.open = null;
        self.current = null;

        /** Allow for processing of clicks to resume **/
        self.processing = false;
    };

    /**
     * Returns active player
     *
     * @returns {Player|*}
     */
    self.getActivePlayer = function() {
        if (self.activePlayer == 1) {
            return self.p1;
        } else {
            return self.p2;
        }
    };

    /**
     * Changes the active player
     */
    self.changeActivePlayer = function() {
        if (self.activePlayer == 1) {
            self.base.find('.game-board .card').removeClass(self.getActivePlayer().prefix + '-active');
            self.activePlayer = 2;
        } else {
            self.base.find('.game-board .card').removeClass(self.getActivePlayer().prefix + '-active');
            self.activePlayer = 1;
        }
    };

    /**
     * Register necessary events
     */
    self.registerEvents = function() {
        if (self.registered) {
            return true;
        }

        self.registered = true;

        /** Register click on start menu **/
        $(document).on('click', '.start', function () {
            $(this).parent().remove();
            self.start();
        });

        /** Animate Active Card with player color **/
        $(document).on('mouseover', '.game-board .card', function () {
            $(this).addClass(self.getActivePlayer().prefix + '-active');
        });

        /** Register click on restart button **/
        $(document).on('click', '.menu .restart', function () {
            $(this).parent().remove();
            self.base.find('.game-board').remove();
            self.cards = [];
            self.open = null;
            self.current = null;
            self.processing = false;
            self.matches = 0;
            self.gameBoard = null;
            self.activePlayer = 1;
            self.p1 = null;
            self.p2 = null;
            self.usedOnce  = [];
            self.usedAgain = [];
            $(document).off('click', '.game-board .card', false);
            self.start();
        });

        $(document).on('click', '.game-board .card', function () {
            if (self.processing || true == $(this).data('success') || $(this).is(self.open)) {
                /**
                 * If a click is already being processed,
                 * or a click is on an already revealed card,
                 * or on a successfully matched card
                 * don't do anything
                 **/
                self.getActivePlayer().invalidMove();
                return;
            }

            self.getActivePlayer().moves();

            /** Currently processing click, so stop all other processing **/
            self.processing = true;

            /** Set currently selected card **/
            self.current = $(this);

            /** Reveal currently selected card **/
            self.current.css("background-image", self.current.data('img'));
            $(this).removeClass(self.getActivePlayer().prefix + '-active');

            if (self.open == null) {
                /** If this is the first card selected, only register it as being open and allow for new clicks **/
                self.open = self.current;
                self.processing = false;
            } else if (self.open.data('img') == self.current.data('img')) {
                /** If the currently selected card, matches the open card, animate **/
                setTimeout(self.matched, 500);
            } else {
                /** If the currently selected card does not match the open card, reset both cards**/
                setTimeout(self.reset, 500);
                self.changeActivePlayer();
            }

            setTimeout(self.getActivePlayer().play, 1000);
        });
    };
}

function Player(number) {
    var self = this;

    /**
     * Players number
     */
    self.number = number;

    /**
     * Player prefix
     *
     * @type {string}
     */
    self.prefix = 'p' + number;

    /**
     * Players current move count
     *
     * @type {number}
     */
    self.move = 0;

    /**
     * Players current score
     *
     * @type {number}
     */
    self.score = 0;

    /**
     * Base html element for the player stats
     *
     * @type {null}
     */
    self.base = null;

    /**
     * Build and return the html elements for this player
     *
     * @returns {null|*}
     */
    self.buildPlayerStatsElement = function () {
        var playerStats = $("<div>", {'class': 'p' + self.number});

        playerStats.append($("<div>", {'class' : 'player-name', 'html' : 'Player ' + self.number}));
        playerStats.append(self.generateScoringElement('score', 'Score: ', 0));
        playerStats.append(self.generateScoringElement('moves', 'Moves: ', 0));
        playerStats.append(self.generateScoringElement('high-score', 'High Score: ', self.getHighScoreCount()));

        self.base = playerStats;

        return self.base;
    };

    /**
     * Build a scoring element
     *
     * @param type
     * @param title
     * @param count
     * @returns {*|jQuery|HTMLElement}
     */
    self.generateScoringElement = function(type, title, count) {
        var scoringElement = $("<div>", {'class': type});
        var highScoreTitle = $("<span>", {'class': 'title', 'html': title});
        var highScoreCount = $("<span>", {'class': 'count', 'html': count});

        scoringElement.append(highScoreTitle);
        scoringElement.append(highScoreCount);

        return scoringElement;
    };

    /**
     * Load high score from local storage
     */
    self.getHighScoreCount = function () {
        var highScore = 0;
        if (localStorage[self.prefix + 'highScore']) {
            highScore = Number(localStorage[self.prefix + 'highScore']);
        }
        return highScore;
    };

    /**
     * Update High Score
     */
    self.complete = function() {
        var highScore = self.base.find('.high-score > .count');
        if (localStorage[self.prefix + 'highScore'] && Number(localStorage[self.prefix + 'highScore']) < self.score) {
            localStorage[self.prefix + 'highScore'] = self.score;
            highScore.html(self.score);
        } else if (!localStorage[self.prefix + 'highScore']) {
            localStorage[self.prefix + 'highScore'] = self.score;
            highScore.html(self.score);
        }
    };

    /**
     * Updates the player with a move
     */
    self.moves = function() {
        self.move++;
        var counter = self.base.find('.moves > .count');
        counter.html(self.move);
    };

    /**
     * Scores for the player
     */
    self.scores = function() {
        self.score++;
        var counter = self.base.find('.score > .count');
        counter.html(self.score);
    };

    /**
     * Check if player is AI or not
     *
     * @returns {boolean}
     */
    self.isAI = function() {
        return false;
    };

    /**
     * Play a move
     *
     * @returns {*}
     */
    self.play = function() {
        return true;
    };

    /**
     * Registers an invalid move
     */
    self.invalidMove = function() {
        return true;
    };

    /**
     * Returns player name
     *
     * @returns {string}
     */
    self.getName = function() {
        return 'Player ' + self.number;
    }
}

/**
 * AI player class
 *
 * @todo add configurable difficulty levels
 *
 * @param number
 * @param cardTotal
 * @constructor
 */
function AI(number, cardTotal) {
    var self = this;

    /**
     * Players number
     */
    self.number = number;

    /**
     * Player prefix
     *
     * @type {string}
     */
    self.prefix = 'p' + number;

    /**
     * Players current move count
     *
     * @type {number}
     */
    self.move = 0;

    /**
     * Players current score
     *
     * @type {number}
     */
    self.score = 0;

    /**
     * Base html element for the player stats
     *
     * @type {null}
     */
    self.base = null;

    /**
     * Total number of cards in the game
     */
    self.cardTotal = cardTotal;

    /**
     * Object containing all cards seen and their index
     * @type {{}}
     */
    self.cardMemory = {};

    /**
     * Currently visible card
     *
     * @type {null}
     */
    self.visibleCard = null;

    /**
     * Flag to indicate an invalid move
     *
     * @type {boolean}
     */
    self.invalid = false;

    /**
     * Flag to indicate the game is finished
     *
     * @type {boolean}
     */
    self.finished = false;

    /**
     * Index for a recognized matching card
     *
     * @type {boolean|number}
     */
    self.matchedIndex = false;

    /**
     * Build and return the html elements for this player
     *
     * @returns {null|*}
     */
    self.buildPlayerStatsElement = function () {
        var playerStats = $("<div>", {'class': 'p' + self.number});

        playerStats.append($("<div>", {'class' : 'player-name', 'html' : 'Player ' + self.number}));
        playerStats.append(self.generateScoringElement('score', 'Score: ', 0));
        playerStats.append(self.generateScoringElement('moves', 'Moves: ', 0));

        self.base = playerStats;

        return self.base;
    };

    /**
     * Build a scoring element
     *
     * @param type
     * @param title
     * @param count
     * @returns {*|jQuery|HTMLElement}
     */
    self.generateScoringElement = function(type, title, count) {
        var scoringElement = $("<div>", {'class': type});
        var highScoreTitle = $("<span>", {'class': 'title', 'html': title});
        var highScoreCount = $("<span>", {'class': 'count', 'html': count});

        scoringElement.append(highScoreTitle);
        scoringElement.append(highScoreCount);

        return scoringElement;
    };

    /**
     * Complete the game for this player
     *
     * @returns {boolean}
     */
    self.complete = function(){
        self.finished = true;
        return true;
    };

    /**
     * Updates the player with a move
     */
    self.moves = function() {
        self.move++;
        var counter = self.base.find('.moves > .count');
        counter.html(self.move);
    };

    /**
     * Scores for the player
     */
    self.scores = function() {
        self.score++;
        var counter = self.base.find('.score > .count');
        counter.html(self.score);
    };

    /**
     * Check if player is AI or not
     *
     * @returns {boolean}
     */
    self.isAI = function() {
        return true;
    };

    /**
     * Play a move
     *
     * @returns {*}
     */
    self.play = function() {
        if (self.finished) {
            return false;
        }

        self.matchedIndex = false;
        $.each(self.cardMemory, function(index, value) {
            if (index != self.visibleCardIndex && value == self.visibleCard) {
                self.matchedIndex = index;
            }
        });

        if (self.matchedIndex === false) {
            self.matchedIndex = self.random();
        }

        var selectedCard = $('.game-board .card').eq(self.matchedIndex);

        selectedCard.trigger('click');

        if (self.invalid) {
            self.invalid = false;
            return self.play();
        }

        if (null === self.visibleCard) {
            self.visibleCard = selectedCard.data('img');
            self.visibleCardIndex = selectedCard.data('index');
        } else {
            self.visibleCard = null;
            self.visibleCardIndex = null;
        }

        if (!self.cardMemory[selectedCard.data('index')] && selectedCard.data('img') !== null){
            self.cardMemory[selectedCard.data('index')] = selectedCard.data('img');
        }
    };

    /**
     * Return random index for self.cards where each index may only be used twice
     *
     * @returns {number}
     */
    self.random = function () {
        var rand = Math.floor(Math.random() * self.cardTotal);

        var match = false;
        var memoryCount = 0;
        $.each(self.cardMemory, function(index) {
            if (index == rand) {
                match = true
            }
            memoryCount++;
        });

        if (match && memoryCount != self.cardTotal) {
            rand = self.random();
        }

        return rand;
    };

    /**
     * Registers an invalid move
     */
    self.invalidMove = function() {
        self.invalid = true;
    };

    /**
     * Returns player name
     *
     * @returns {string}
     */
    self.getName = function() {
        return 'AI ' + self.number;
    };
}
