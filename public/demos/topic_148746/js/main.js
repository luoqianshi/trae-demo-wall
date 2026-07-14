document.addEventListener('DOMContentLoaded', async () => {
    Storage.init();
    await initModules();
    Router.init();
});

async function initModules() {
    await VocabularyModule.init();
    await GrammarModule.init();
    await ReadingModule.init();
    await ListeningModule.init();
    await SpeakingModule.init();
    await MathModule.init();
    await ChineseModule.init();
    await RecordsModule.init();
    await GamesModule.init();
    
    Router.register('home', () => VocabularyModule.render());
    Router.register('english', () => EnglishModule.render());
    Router.register('math', () => MathModule.render());
    Router.register('chinese', () => ChineseModule.render());
    Router.register('records', () => RecordsModule.render());
    Router.register('games', () => GamesModule.render());
}

function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分钟`;
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
