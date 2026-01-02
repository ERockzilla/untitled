// Word lists organized by category for Word Search game

export interface WordCategory {
    name: string;
    words: string[];
    color: string;
}

export const WORD_CATEGORIES: WordCategory[] = [
    {
        name: 'Animals',
        color: '#22c55e',
        words: [
            'LION', 'TIGER', 'BEAR', 'WOLF', 'EAGLE', 'SHARK', 'WHALE', 'ZEBRA',
            'HORSE', 'SNAKE', 'HAWK', 'DEER', 'FROG', 'DUCK', 'GOAT', 'SEAL',
            'CRAB', 'FISH', 'BIRD', 'MOTH', 'ANT', 'BEE', 'CAT', 'DOG', 'FOX',
            'OWL', 'BAT', 'RAT', 'PIG', 'COW',
        ],
    },
    {
        name: 'Technology',
        color: '#3b82f6',
        words: [
            'CODE', 'DATA', 'CLOUD', 'CYBER', 'DEBUG', 'PIXEL', 'CACHE', 'STACK',
            'ARRAY', 'LOOP', 'NODE', 'PORT', 'BYTE', 'CHIP', 'DISK', 'FILE',
            'HASH', 'HOST', 'JAVA', 'LINK', 'LINUX', 'MACRO', 'QUEUE', 'RUST',
            'SWIFT', 'TOKEN', 'UNIX', 'VIRUS', 'WIFI', 'API',
        ],
    },
    {
        name: 'Colors',
        color: '#f43f5e',
        words: [
            'RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BLACK',
            'WHITE', 'GRAY', 'BROWN', 'GOLD', 'SILVER', 'CYAN', 'TEAL', 'NAVY',
            'CORAL', 'LIME', 'OLIVE', 'PLUM', 'ROSE', 'RUBY', 'SAGE', 'TAN',
            'AMBER', 'AZURE', 'BEIGE', 'BRONZE', 'CREAM', 'IVORY',
        ],
    },
    {
        name: 'Food',
        color: '#eab308',
        words: [
            'APPLE', 'BREAD', 'CAKE', 'DONUT', 'EGG', 'FISH', 'GRAPE', 'HONEY',
            'ICE', 'JAM', 'KALE', 'LEMON', 'MANGO', 'NUTS', 'OLIVE', 'PASTA',
            'RICE', 'SOUP', 'TACO', 'PIZZA', 'STEAK', 'SALAD', 'BACON', 'BERRY',
            'CANDY', 'CHIPS', 'CREAM', 'JUICE', 'TOAST', 'BAGEL',
        ],
    },
    {
        name: 'Space',
        color: '#8b5cf6',
        words: [
            'STAR', 'MOON', 'MARS', 'EARTH', 'SUN', 'ORBIT', 'COMET', 'GALAXY',
            'NOVA', 'QUASAR', 'NEBULA', 'COSMOS', 'VENUS', 'PLUTO', 'TITAN',
            'SOLAR', 'LUNAR', 'ALIEN', 'ROCKET', 'SPACE', 'VOID', 'PULSE',
            'LIGHT', 'DARK', 'RING', 'DUST', 'GAS', 'CORE', 'BEAM', 'WAVE',
        ],
    },
    {
        name: 'Sports',
        color: '#10b981',
        words: [
            'GOLF', 'SWIM', 'RUN', 'JUMP', 'KICK', 'THROW', 'CATCH', 'GOAL',
            'SCORE', 'TEAM', 'BALL', 'BAT', 'NET', 'CLUB', 'RACE', 'WIN',
            'GAME', 'PLAY', 'MATCH', 'FIELD', 'COURT', 'TRACK', 'POOL', 'RING',
            'SURF', 'SKATE', 'SKI', 'DIVE', 'CLIMB', 'HIKE',
        ],
    },
    {
        name: 'Music',
        color: '#ec4899',
        words: [
            'SONG', 'BEAT', 'DRUM', 'BASS', 'NOTE', 'TUNE', 'JAZZ', 'ROCK',
            'POP', 'SOUL', 'FUNK', 'BLUES', 'CHORD', 'TEMPO', 'RHYTHM', 'MELODY',
            'PIANO', 'GUITAR', 'VOCAL', 'TRACK', 'ALBUM', 'AUDIO', 'SOUND',
            'ECHO', 'TONE', 'BAND', 'SOLO', 'DUET', 'LOOP', 'MIX',
        ],
    },
    {
        name: 'Nature',
        color: '#84cc16',
        words: [
            'TREE', 'LEAF', 'FLOWER', 'GRASS', 'RIVER', 'OCEAN', 'LAKE', 'HILL',
            'ROCK', 'SAND', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'SUN', 'MOON',
            'STORM', 'WAVE', 'FOREST', 'FIELD', 'DESERT', 'ISLAND', 'VALLEY',
            'CAVE', 'CLIFF', 'SHORE', 'POND', 'CREEK', 'MARSH', 'PEAK',
        ],
    },
];

// Get random words from a category
export function getRandomWords(
    category: WordCategory,
    count: number,
    minLength: number = 3,
    maxLength: number = 7
): string[] {
    const validWords = category.words.filter(
        w => w.length >= minLength && w.length <= maxLength
    );

    const shuffled = [...validWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Get random category
export function getRandomCategory(): WordCategory {
    return WORD_CATEGORIES[Math.floor(Math.random() * WORD_CATEGORIES.length)];
}
