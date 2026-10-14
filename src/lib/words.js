// Word bank. The host's browser picks the words for a match (no server on the free plan).
// Entry format: [crewWord, clueForImposter, difficulty(1 easy, 2 medium, 3 hard)]
// The imposter NEVER sees the crew word or a sibling word (like Coffee when the crew has Tea).
// They only get a vague clue about the crew's word, plus the topic, and must bluff from that.
// Rule for every clue: it describes the word without containing it.
export const CATEGORY_LABELS = {
  FOOD: 'Food & drink',
  ANIMALS: 'Animals',
  MOVIES: 'Movies & TV',
  PLACES: 'Places',
  SPORTS: 'Sports & games',
  TECHNOLOGY: 'Technology',
  EVERYDAY: 'Everyday objects',
  NATURE: 'Nature',
  JOBS: 'Jobs',
  MUSIC: 'Music',
  CLOTHING: 'Clothes & fashion',
  TRANSPORT: 'Transport',
  SCHOOL: 'School & office',
  FESTIVALS: 'Festivals & celebrations',
};

export const BANK = {
  FOOD: [
    ['Tea', 'A hot drink made from leaves', 1], ['Coffee', 'A dark, bitter drink that wakes you up', 1],
    ['Pizza', 'Round, cheesy and baked', 1], ['Biryani', 'Spiced rice layered with meat or veg', 1],
    ['Dosa', 'A thin crispy South Indian crepe', 1], ['Chocolate', 'A sweet made from cocoa', 1],
    ['Ice cream', 'A frozen dessert on a hot day', 1], ['Mango', 'A sweet tropical fruit, king of its kind', 1],
    ['Samosa', 'A fried triangular snack', 2], ['Noodles', 'Long strands, often slurped', 2],
    ['Lemonade', 'A sour-sweet cold drink', 2], ['Honey', 'Sticky and sweet, made by insects', 2],
    ['Sandwich', 'Fillings between two slices', 2], ['Pickle', 'Preserved and tangy, served on the side', 3],
    ['Butter', 'A soft dairy spread', 3], ['Popcorn', 'Puffs up when heated', 2],
  ],
  ANIMALS: [
    ['Cat', 'A small pet that purrs', 1], ['Dog', 'A loyal pet that barks', 1],
    ['Elephant', 'The largest land animal', 1], ['Tiger', 'A big striped hunter', 1],
    ['Monkey', 'Swings through trees', 1], ['Peacock', 'A bird with a fancy fan of feathers', 1],
    ['Dolphin', 'A clever sea mammal that jumps', 2], ['Camel', 'Survives in the desert with a hump', 2],
    ['Owl', 'A night bird that hoots', 2], ['Snake', 'Has no legs and slithers', 2],
    ['Bee', 'Makes something sweet and buzzes', 2], ['Crow', 'A smart black bird', 2],
    ['Penguin', 'A bird that cannot fly but loves the cold', 2], ['Crocodile', 'A river reptile with a big jaw', 3],
    ['Bat', 'A flying mammal that hangs upside down', 3],
  ],
  MOVIES: [
    ['Popcorn', 'A snack you eat while watching', 1], ['Cinema', 'A dark hall with a huge screen', 1],
    ['Actor', 'Someone who plays a character', 1], ['Director', 'Calls the shots on set', 2],
    ['Villain', 'The one the hero fights', 1], ['Superhero', 'Has special powers and a costume', 1],
    ['Cartoon', 'Drawn characters that move', 1], ['Sequel', 'The next part of a story', 2],
    ['Trailer', 'A short preview', 2], ['Oscar', 'A golden trophy', 2],
    ['Subtitles', 'Words at the bottom of the screen', 2], ['Script', 'What the actors read from', 3],
    ['Stunt', 'A dangerous move done by a specialist', 3], ['Interval', 'A break in the middle of a film', 3],
  ],
  PLACES: [
    ['Beach', 'Sand, waves and sunshine', 1], ['Airport', 'Where flights take off', 1],
    ['Hospital', 'Doctors and nurses work here', 1], ['Library', 'Quiet and full of shelves', 1],
    ['Temple', 'A place of worship', 1], ['Zoo', 'Animals live here for visitors', 1],
    ['Museum', 'Old and valuable things on display', 2], ['Market', 'Stalls, bargaining and crowds', 2],
    ['Desert', 'Very dry and sandy', 2], ['Island', 'Surrounded by water on every side', 2],
    ['Castle', 'A fortified home of royalty', 2], ['Railway station', 'Platforms and announcements', 2],
    ['Waterfall', 'Water dropping from a height', 3], ['Lighthouse', 'Guides ships at night', 3],
  ],
  SPORTS: [
    ['Cricket', 'Played with a bat and wickets', 1], ['Football', 'Eleven players chase a round ball', 1],
    ['Tennis', 'Played over a net with rackets', 1], ['Chess', 'A board game of kings and pawns', 1],
    ['Swimming', 'Done in a pool', 1], ['Badminton', 'Uses a shuttle, not a ball', 2],
    ['Kabaddi', 'A contact team game where you hold your breath and chant', 2], ['Boxing', 'Fought in a ring with gloves', 2],
    ['Marathon', 'A very long race', 2], ['Archery', 'Aiming arrows at a target', 2],
    ['Hockey', 'Players use sticks on a pitch', 2], ['Carrom', 'A board game flicked with a striker', 3],
    ['Skating', 'Gliding on wheels or blades', 2], ['Golf', 'Hit a tiny ball into a hole', 3],
  ],
  TECHNOLOGY: [
    ['Phone', 'Always in your pocket', 1], ['Laptop', 'A portable computer', 1],
    ['Wifi', 'Wireless internet', 1], ['Keyboard', 'You type on it', 1],
    ['Camera', 'Captures moments', 1], ['Charger', 'Fills up a battery', 1],
    ['Headphones', 'Private listening', 2], ['Robot', 'A machine that follows programs', 2],
    ['Drone', 'Flies without a pilot on board', 2], ['Printer', 'Turns screen into paper', 2],
    ['Password', 'A secret you type to get in', 2], ['Email', 'An online letter', 2],
    ['Satellite', 'Orbits high above the Earth', 3], ['Server', 'A computer that serves others', 3],
  ],
  EVERYDAY: [
    ['Umbrella', 'Useful when it pours', 1], ['Mirror', 'Shows your reflection', 1],
    ['Pillow', 'Rests your head at night', 1], ['Spoon', 'Used for soup', 1],
    ['Clock', 'Tells you the time', 1], ['Key', 'Opens a lock', 1],
    ['Towel', 'Dries you off', 2], ['Candle', 'Gives a small flame of light', 2],
    ['Backpack', 'Carries things on your shoulders', 2], ['Broom', 'Sweeps the floor', 2],
    ['Scissors', 'Two blades that cut paper', 2], ['Wallet', 'Holds notes and cards', 2],
    ['Bucket', 'Carries water', 3], ['Hanger', 'Hangs shirts in a wardrobe', 3],
  ],
  NATURE: [
    ['Rain', 'Falls from the clouds', 1], ['Mountain', 'A very high landform', 1],
    ['River', 'Flows to the sea', 1], ['Sun', 'Our nearest star', 1],
    ['Moon', 'Shines at night and changes shape', 1], ['Forest', 'Thousands of trees together', 1],
    ['Rainbow', 'Colours after a shower', 2], ['Volcano', 'Can erupt with hot rock', 2],
    ['Thunder', 'A loud sound in a storm', 2], ['Cave', 'A hollow inside rock', 2],
    ['Monsoon', 'A season of heavy rain', 2], ['Coral', 'Colourful life under the sea', 3],
    ['Fog', 'Low cloud that blocks the view', 3], ['Earthquake', 'The ground shakes', 3],
  ],
  JOBS: [
    ['Doctor', 'Heals the sick', 1], ['Teacher', 'Explains lessons to a class', 1],
    ['Farmer', 'Grows the crops', 1], ['Pilot', 'Flies high above you', 1],
    ['Chef', 'Works in a busy kitchen', 1], ['Police officer', 'Keeps order and wears a uniform', 1],
    ['Engineer', 'Designs and builds things', 2], ['Tailor', 'Stitches and measures', 2],
    ['Barber', 'Trims hair and beards', 2], ['Photographer', 'Says "smile" a lot', 2],
    ['Lawyer', 'Argues in court', 2], ['Plumber', 'Fixes leaks', 2],
    ['Astronaut', 'Works far beyond the sky', 3], ['Librarian', 'Keeps the books in order', 3],
  ],
  MUSIC: [
    ['Guitar', 'Has strings you strum', 1], ['Drums', 'You hit them with sticks', 1],
    ['Piano', 'Black and white keys', 1], ['Flute', 'Played by blowing across it', 2],
    ['Violin', 'Played with a bow', 2], ['Singer', 'Uses their voice on stage', 1],
    ['Concert', 'A live show with a crowd', 1], ['Microphone', 'Makes a voice louder', 2],
    ['Tabla', 'A pair of hand drums from India', 2], ['Choir', 'Many voices as one', 2],
    ['Lullaby', 'Sung to help a baby sleep', 3], ['Playlist', 'A list of songs lined up', 2],
    ['Whistle', 'Made with your lips', 3], ['Remix', 'An old song made new', 3],
  ],
  CLOTHING: [
    ['Saree', 'A long draped garment', 1], ['Shirt', 'Has buttons and a collar', 1],
    ['Jeans', 'Blue and tough', 1], ['Shoes', 'Worn on your feet', 1],
    ['Cap', 'Shades your eyes from the sun', 1], ['Watch', 'Worn on the wrist', 1],
    ['Scarf', 'Wraps around your neck', 2], ['Sunglasses', 'Stylish eye protection', 2],
    ['Jacket', 'An extra layer for cold weather', 2], ['Slippers', 'Casual and easy to slip on', 2],
    ['Belt', 'Keeps trousers in place', 2], ['Gloves', 'Five fingers each', 2],
    ['Dhoti', 'A traditional wrap worn around the waist', 3], ['Necklace', 'Jewellery that hangs', 3],
  ],
  TRANSPORT: [
    ['Bus', 'Many passengers, fixed stops', 1], ['Train', 'Runs on tracks', 1],
    ['Bicycle', 'Two wheels and pedals', 1], ['Airplane', 'Crosses countries in hours', 1],
    ['Auto rickshaw', 'A three-wheeled taxi', 1], ['Ship', 'Sails across the ocean', 1],
    ['Motorbike', 'Fast, two wheels, a helmet needed', 2], ['Metro', 'Runs underground in big cities', 2],
    ['Helicopter', 'Takes off straight up', 2], ['Ambulance', 'Rushes with sirens', 2],
    ['Boat', 'Floats on a river or lake', 2], ['Tractor', 'Works in the fields', 3],
    ['Scooter', 'Small and handy for the city', 3], ['Truck', 'Carries heavy loads on highways', 3],
  ],
  SCHOOL: [
    ['Pencil', 'Can be erased', 1], ['Notebook', 'Pages for writing', 1],
    ['Blackboard', 'Chalk dust everywhere', 1], ['Exam', 'Makes students nervous', 1],
    ['Homework', 'Work you do after class', 1], ['Uniform', 'Everyone dresses the same', 1],
    ['Calculator', 'Does sums for you', 2], ['Backbench', 'Where some students love to sit', 2],
    ['Timetable', 'Tells you what comes next', 2], ['Principal', 'The head of the institution', 2],
    ['Stapler', 'Clicks pages together', 3], ['Whiteboard', 'Erasable and shiny', 2],
    ['Meeting', 'People gather around a table to talk', 2], ['Printer paper', 'Comes in reams', 3],
  ],
  FESTIVALS: [
    ['Diwali', 'The festival of lights', 1], ['Pongal', 'A harvest celebration with a boiling pot', 1],
    ['Birthday', 'Once a year, with a cake', 1], ['Wedding', 'Two families unite', 1],
    ['Christmas', 'A tree and presents', 1], ['Holi', 'Colours thrown in the air', 1],
    ['Eid', 'Celebrated after a month of fasting', 2], ['Fireworks', 'Bright bursts in the night sky', 2],
    ['Rangoli', 'Colourful patterns on the floor', 2], ['New Year', 'Countdown at midnight', 2],
    ['Gift', 'Wrapped and given with love', 2], ['Garland', 'Flowers strung together', 3],
    ['Procession', 'A crowd moving together with music', 3], ['Sweets', 'Boxes shared with neighbours', 2],
  ],
};

export const CATEGORIES = Object.keys(BANK);
const DIFF = { EASY: 1, MEDIUM: 2, HARD: 3 };
import { pick, shuffle } from './random.js';

/**
 * Pick the crew word and the imposter's clue automatically.
 * With category RANDOM a topic is chosen at random each match (never the same topic twice in a
 * row when avoidable), then a word from it that has not been used recently in this room.
 * @returns {{id:string, word:string, hint:string, imposterWord:string, category:string, categoryLabel:string}}
 */
export function pickWords({ category = 'RANDOM', difficulty = 'ANY', recent = [] } = {}) {
  const lastCat = recent.length ? String(recent[recent.length - 1]).split(':')[0] : null;
  let cats = category === 'RANDOM' || !BANK[category] ? CATEGORIES : [category];
  if (cats.length > 1) cats = cats.filter((c) => c !== lastCat);

  const poolFor = (list, strict) => list.flatMap((c) => BANK[c]
    .map((p, i) => ({ id: `${c}:${i}`, c, p }))
    .filter((x) => (!strict || difficulty === 'ANY' || DIFF[difficulty] === x.p[2])));

  // Choose the topic first (so big topics do not dominate), falling back if it has nothing left.
  const order = shuffle(cats);
  let chosen = null;
  for (const c of order) {
    const fresh = poolFor([c], true).filter((x) => !recent.includes(x.id));
    if (fresh.length) { chosen = pick(fresh); break; }
  }
  if (!chosen) {
    const any = poolFor(cats, true);
    chosen = pick(any.length ? any : poolFor(cats, false));
  }
  const [word, hint] = chosen.p;
  return { id: chosen.id, word, hint, imposterWord: hint, category: chosen.c, categoryLabel: CATEGORY_LABELS[chosen.c] };
}
