// Wordle word lists - solutions and valid guesses

// Common 5-letter words used as solutions (~500 words for variety)
export const SOLUTION_WORDS = [
    'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
    'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE',
    'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMONG', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART',
    'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'ARRAY', 'ARROW', 'ASIDE', 'ASSET',
    'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE', 'BADLY', 'BAKER', 'BASES', 'BASIC', 'BASIN',
    'BASIS', 'BATCH', 'BEACH', 'BEARD', 'BEAST', 'BEGIN', 'BEING', 'BELOW', 'BENCH', 'BERRY',
    'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLAZE', 'BLEND', 'BLESS', 'BLIND',
    'BLOCK', 'BLOOD', 'BLOOM', 'BLOWN', 'BOARD', 'BONUS', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND',
    'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BROAD',
    'BROKE', 'BROWN', 'BRUSH', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'BUYER', 'CABLE', 'CANDY',
    'CARGO', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHAOS', 'CHARM', 'CHART', 'CHASE',
    'CHEAP', 'CHECK', 'CHESS', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE', 'CHUNK', 'CLAIM',
    'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIFF', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD', 'COACH',
    'COAST', 'COLON', 'COLOR', 'COUCH', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRACK', 'CRAFT',
    'CRANE', 'CRASH', 'CRAWL', 'CRAZY', 'CREAM', 'CREEK', 'CRIME', 'CRISP', 'CROSS', 'CROWD',
    'CROWN', 'CRUDE', 'CRUSH', 'CURVE', 'CYCLE', 'DAILY', 'DAIRY', 'DANCE', 'DEALT', 'DEATH',
    'DEBUT', 'DECAY', 'DECOR', 'DELAY', 'DELTA', 'DENSE', 'DEPTH', 'DEVIL', 'DIARY', 'DIGIT',
    'DIRTY', 'DISCO', 'DITCH', 'DONOR', 'DOUBT', 'DOUGH', 'DOZEN', 'DRAFT', 'DRAIN', 'DRAMA',
    'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRIED', 'DRIFT', 'DRILL', 'DRINK', 'DRIVE', 'DROWN',
    'DRUNK', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EATER', 'EIGHT', 'ELBOW', 'ELDER', 'ELECT',
    'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'ESSAY', 'ETHIC',
    'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FANCY', 'FATAL', 'FAULT',
    'FAVOR', 'FEAST', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED',
    'FLAME', 'FLASH', 'FLESH', 'FLOAT', 'FLOOD', 'FLOOR', 'FLOUR', 'FLUID', 'FLUSH', 'FOCUS',
    'FORCE', 'FORGE', 'FORTH', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT',
    'FROST', 'FRUIT', 'FULLY', 'FUNNY', 'GHOST', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GLORY',
    'GOING', 'GRACE', 'GRADE', 'GRAIN', 'GRAND', 'GRANT', 'GRAPE', 'GRASP', 'GRASS', 'GRAVE',
    'GREAT', 'GREEN', 'GREET', 'GRIEF', 'GRILL', 'GRIND', 'GROSS', 'GROUP', 'GROVE', 'GROWN',
    'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILD', 'GUILT', 'HABIT', 'HAPPY', 'HARDY', 'HARSH',
    'HASTE', 'HAVEN', 'HEART', 'HEAVY', 'HELLO', 'HENCE', 'HERBS', 'HIRED', 'HONOR', 'HORSE',
    'HOTEL', 'HOUSE', 'HUMAN', 'HUMOR', 'HURRY', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX', 'INNER',
    'INPUT', 'IRONY', 'ISSUE', 'IVORY', 'JEANS', 'JEWEL', 'JOINT', 'JONES', 'JOURN', 'JUDGE',
    'JUICE', 'KARMA', 'KHAKI', 'KNIFE', 'KNOCK', 'KNOWN', 'LABEL', 'LABOR', 'LARGE', 'LASER',
    'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON', 'LEVEL',
    'LEVER', 'LIGHT', 'LIMIT', 'LINEN', 'LINKS', 'LIVER', 'LIVES', 'LOCAL', 'LODGE', 'LOGIC',
    'LOSER', 'LOVER', 'LOWER', 'LOYAL', 'LUCKY', 'LUNCH', 'LYRIC', 'MAGIC', 'MAJOR', 'MAKER',
    'MANGA', 'MARCH', 'MARRY', 'MARSH', 'MATCH', 'MAYOR', 'MEDAL', 'MEDIA', 'MELON', 'MERCY',
    'MERGE', 'MERIT', 'MERRY', 'METAL', 'METER', 'MICRO', 'MIGHT', 'MINOR', 'MINUS', 'MIXED',
    'MODEL', 'MODEM', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVED',
    'MOVIE', 'MUSIC', 'NAIVE', 'NAKED', 'NAMED', 'NERVE', 'NEVER', 'NEWLY', 'NIGHT', 'NINTH',
    'NOBLE', 'NOISE', 'NORTH', 'NOTCH', 'NOTED', 'NOVEL', 'NURSE', 'NYLON', 'OCCUR', 'OCEAN',
    'OFFER', 'OFTEN', 'OLIVE', 'ONSET', 'OPERA', 'ORBIT', 'ORDER', 'ORGAN', 'OTHER', 'OUGHT',
    'OUTER', 'OWNED', 'OWNER', 'OXIDE', 'OZONE', 'PAINT', 'PANEL', 'PANIC', 'PAPER', 'PARTY',
    'PASTA', 'PASTE', 'PATCH', 'PAUSE', 'PEACE', 'PEACH', 'PEARL', 'PENNY', 'PHASE', 'PHONE',
    'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PINCH', 'PITCH', 'PIZZA', 'PLACE', 'PLAIN', 'PLANE',
    'PLANT', 'PLATE', 'PLAZA', 'PLEAD', 'PLAZA', 'PLUMB', 'PLUNGE', 'PLUSH', 'POEM', 'POINT',
    'POLAR', 'PORCH', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR',
    'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'PROXY', 'PULSE', 'PUNCH', 'PUPIL', 'QUEEN', 'QUERY',
    'QUEST', 'QUICK', 'QUIET', 'QUITE', 'QUOTA', 'QUOTE', 'RADAR', 'RADIO', 'RAISE', 'RALLY',
    'RANCH', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'REACT', 'READY', 'REALM', 'REBEL', 'REFER',
    'REIGN', 'RELAX', 'RELAY', 'REPLY', 'REPUB', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT', 'RIGID',
    'RISEN', 'RISKY', 'RIVAL', 'RIVER', 'ROAST', 'ROBOT', 'ROCKY', 'ROMAN', 'ROTOR', 'ROUGH',
    'ROUND', 'ROUTE', 'ROYAL', 'RUGBY', 'RULER', 'RURAL', 'SADLY', 'SAINT', 'SALAD', 'SALES',
    'SAUCE', 'SCALE', 'SCARE', 'SCENE', 'SCENT', 'SCORE', 'SCOUT', 'SCREW', 'SEIZE', 'SENSE',
    'SERVE', 'SETUP', 'SEVEN', 'SHADE', 'SHAKE', 'SHALL', 'SHAME', 'SHAPE', 'SHARE', 'SHARP',
    'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORE', 'SHORT',
    'SHOUT', 'SHOWN', 'SIGHT', 'SIGMA', 'SILLY', 'SINCE', 'SIXTH', 'SKILL', 'SKULL', 'SLAVE',
    'SLEEP', 'SLICE', 'SLIDE', 'SLOPE', 'SMALL', 'SMART', 'SMELL', 'SMILE', 'SMOKE', 'SNAKE',
    'SOLAR', 'SOLID', 'SOLVE', 'SONIC', 'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPARK',
    'SPEAK', 'SPEAR', 'SPEED', 'SPELL', 'SPEND', 'SPENT', 'SPICE', 'SPILL', 'SPINE', 'SPOKE',
    'SPORT', 'SPRAY', 'SQUAD', 'STACK', 'STAFF', 'STAGE', 'STAIN', 'STAKE', 'STAMP', 'STAND',
    'STARE', 'START', 'STATE', 'STEAK', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STERN', 'STICK',
    'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STOVE', 'STRIP', 'STUCK',
    'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SURGE', 'SWAMP', 'SWEAR',
    'SWEAT', 'SWEEP', 'SWEET', 'SWEPT', 'SWIFT', 'SWING', 'SWORD', 'SYNTH', 'TABLE', 'TASTE',
    'TEACH', 'TEETH', 'TEMPO', 'TENTH', 'TERMS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE',
    'THESE', 'THICK', 'THIEF', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW',
    'THUMB', 'TIGHT', 'TIMER', 'TIRED', 'TITLE', 'TODAY', 'TOKEN', 'TOPIC', 'TORCH', 'TOTAL',
    'TOUCH', 'TOUGH', 'TOWER', 'TOXIC', 'TRACE', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN', 'TRAIT',
    'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TROOP', 'TRUCK', 'TRULY',
    'TRUNK', 'TRUST', 'TRUTH', 'TUMOR', 'TUNER', 'TURBO', 'TWICE', 'TWIST', 'ULTRA', 'UNCLE',
    'UNDER', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID',
    'VALUE', 'VAULT', 'VENUE', 'VERSE', 'VIDEO', 'VIGOR', 'VIRAL', 'VIRUS', 'VISIT', 'VITAL',
    'VIVID', 'VOCAL', 'VOICE', 'VOILA', 'VOTER', 'WAGON', 'WASTE', 'WATCH', 'WATER', 'WEARY',
    'WHEAT', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WIDTH', 'WIRED',
    'WITCH', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND',
    'WRATH', 'WRECK', 'WRIST', 'WRITE', 'WRONG', 'WROTE', 'YACHT', 'YEARN', 'YIELD', 'YOUNG',
    'YOUTH', 'ZEBRA', 'ZONES', 'PIANO', 'FLAME', 'CRANE', 'GRAPE', 'BLAME', 'BRAVE', 'CHASE',
];

// Additional valid 5-letter words that can be used as guesses but not solutions
// This is a subset for demonstration - a full implementation would have ~10,000 words
export const VALID_GUESSES = new Set([
    ...SOLUTION_WORDS,
    'AAHED', 'AALII', 'AARGH', 'ABACA', 'ABACI', 'ABACK', 'ABAFT', 'ABAMP', 'ABASE', 'ABASH',
    'ABATE', 'ABAYA', 'ABBAS', 'ABBES', 'ABBEY', 'ABBOT', 'ABELE', 'ABETS', 'ABHOR', 'ABIDE',
    'ABLED', 'ABLER', 'ABLES', 'ABMAS', 'ABMHO', 'ABODE', 'ABOHM', 'ABOIL', 'ABOMA', 'ABOON',
    'ABORT', 'ABOUT', 'ABOVE', 'ABRIS', 'ABUSE', 'ABUTS', 'ABUZZ', 'ABYES', 'ABYSM', 'ABYSS',
    'ACARI', 'ACERB', 'ACERS', 'ACHED', 'ACHES', 'ACHOO', 'ACIDS', 'ACIDY', 'ACING', 'ACINI',
    'ACKEE', 'ACMES', 'ACMIC', 'ACNED', 'ACNES', 'ACOCK', 'ACOLD', 'ACORN', 'ACRED', 'ACRES',
    'ACRID', 'ACTED', 'ACTIN', 'ACTOR', 'ACUTE', 'ADAGE', 'ADAPT', 'ADDAX', 'ADDED', 'ADDER',
    'ADDLE', 'ADEEM', 'ADEPT', 'ADIEU', 'ADIOS', 'ADITS', 'ADMIT', 'ADMIX', 'ADOBE', 'ADOBO',
    'ADOPT', 'ADORE', 'ADORN', 'ADULT', 'ADUNC', 'ADUST', 'ADZES', 'AEGIS', 'AEONS', 'AERIE',
    'AFFIX', 'AFIRE', 'FLOAT', 'BOARD', 'WEAVE', 'PEARL', 'SWIRL', 'GLEAM', 'BLOOM', 'FROST',
    'CRISP', 'BLEND', 'DWELL', 'GLADE', 'PRISM', 'QUEST', 'LUNAR', 'EMBER', 'SPRIG', 'HAVEN',
    'CREST', 'WISPY', 'FJORD', 'KNACK', 'PLUMB', 'GUSTY', 'CHUNK', 'SHORN', 'TWEED', 'BLOWN',
]);

// Get a deterministic word for a given date (daily mode)
export function getDailyWord(date: Date = new Date()): string {
    const dateString = date.toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash + dateString.charCodeAt(i)) | 0;
    }
    return SOLUTION_WORDS[Math.abs(hash) % SOLUTION_WORDS.length];
}

// Get a random word
export function getRandomWord(): string {
    return SOLUTION_WORDS[Math.floor(Math.random() * SOLUTION_WORDS.length)];
}

// Check if a word is valid (can be guessed)
export function isValidWord(word: string): boolean {
    return VALID_GUESSES.has(word.toUpperCase());
}
