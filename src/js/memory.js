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
     * @type {Array}
     */
    self.usedOnce  = [];

    /**
     * Second counter for used fronts
     * @type {Array}
     */
    self.usedAgain = [];

    /**
     * Previously opened card
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

    self.base = null;

    self.clicks = 0;

    self.matches = 0;

    /**
     * Initialize the memory game board
     *
     * @param element
     */
    self.init = function(element) {
        self.base = element;
        self.cards = self.base.children(".card");

        self.loadHighScore();

        self.shuffleData();
        self.registerEvents();
    };

    /**
     * Load high score from local storage
     */
    self.loadHighScore = function () {
        if (localStorage.highscore) {
            var high_score = self.base.find('.high_score > .count');
            high_score.html(Number(localStorage.highscore));
        }
    };

    /**
     * Return random index for self.cards where each index may only be used twice
     *
     * @returns {number}
     */
    self.random = function () {
        var rand = Math.floor(Math.random() * self.cards.length / 2);

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

        self.matches++;

        if (self.matches == self.cards.length / 2) {
            self.complete();
        }

        /** Allow for processing of clicks to resume **/
        self.processing = false;
    };

    /**
     * Process completion of game
     */
    self.complete = function() {
        var high_score = self.base.find('.high_score > .count');
        if (localStorage.highscore && Number(localStorage.highscore) > self.clicks) {
            localStorage.highscore = self.clicks;
            high_score.html(self.clicks);
        } else {
            localStorage.highscore = self.clicks;
            high_score.html(self.clicks);
        }
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
     * Update move counter
     */
    self.updateScore = function() {
        var counter = self.base.find('.score > .count');
        counter.html(self.clicks);
    };

    /**
     * Register necessary events
     */
    self.registerEvents = function() {
        $(document).on('click', '.game-board .card', function () {
            if (self.processing || true == $(this).data('success') || $(this).is(self.open)) {
                /**
                 * If a click is already being processed,
                 * or a click is on an already revealed card,
                 * or on a successfully matched card
                 * don't do anything
                 **/
                return;
            }

            self.clicks++;
            self.updateScore();

            /** Currently processing click, so stop all other processing **/
            self.processing = true;

            /** Set currently selected card **/
            self.current = $(this);

            /** Reveal currently selected card **/
            self.current.css("background-image", self.current.data('img'));

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
            }
        });
    };
}
