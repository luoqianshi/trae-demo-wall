/* ==========================================
   Game Manager
========================================== */

const GameManager = (() => {

    const games = {};

    let currentGame = null;

    function register(name, config) {
        games[name] = config;
    }

    function open(name) {

        if (currentGame && games[currentGame]) {
            games[currentGame].close?.();
        }

        currentGame = name;

        if (games[name]) {
            games[name].open?.();
        }

    }

    function close() {

        if (!currentGame) return;

        games[currentGame]?.close?.();

        currentGame = null;

    }

    return {

        register,

        open,

        close

    };

})();