// Word bank + word picking (single file: copy/paste friendly).
// Words normally come from the Firestore collection "words" (see README). THIS list is the built-in
// fallback AND the source for scripts/seedWords.mjs, so you can also just edit it here.
//
// Entry format in BANK: [crewWord, imposterClue, difficulty]   difficulty: 1 easy, 2 medium, 3 hard
// Rules for every clue: 1-2 words, loosely related, and it must NOT contain the crew word.
// The imposter never sees the crew word or a sibling word; only the clue and the topic name.
import { pick, shuffle } from './random.js';

// To add a topic: add it here AND add a BANK entry below with the same key.
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
    // difficulty 1
    ['Tea', 'Steeped', 1], ['Pizza', 'Round', 1], ['Biryani', 'Layers', 1], ['Chocolate', 'Melts', 1],
    ['Mango', 'Stone', 1], ['Dosa', 'Fermented', 1], ['Ice cream', 'Brain freeze', 1], ['Samosa', 'Triangle', 1],
    ['Noodles', 'Strands', 1], ['Honey', 'Amber', 1], ['Butter', 'Churned', 1], ['Popcorn', 'Cinema', 1],
    // difficulty 2
    ['Lemonade', 'Stand', 2], ['Sandwich', 'Earl', 2], ['Pickle', 'Brine', 2], ['Jalebi', 'Syrup', 2],
    ['Idli', 'Steamed', 2], ['Paneer', 'Curdled', 2], ['Curd rice', 'Cooling', 2], ['Filter coffee', 'Tumbler', 2],
    ['Pancake', 'Flip', 2], ['Burger', 'Stacked', 2], ['Waffle', 'Grid', 2], ['Cheese', 'Aged', 2],
    // difficulty 3
    ['Saffron', 'Threads', 3], ['Vinegar', 'Second life', 3], ['Yeast', 'Rising', 3], ['Jaggery', 'Unrefined', 3],
    ['Leftovers', 'Tomorrow', 3], ['Salt', 'Crystal', 3], ['Tamarind', 'Tangy pods', 3], ['Ghee', 'Clarified', 3],
    ['Sourdough', 'Starter', 3], ['Wasabi', 'Nose', 3], ['Caviar', 'Luxury', 3], ['Truffle', 'Hunted', 3],
  ],
  ANIMALS: [
    // difficulty 1
    ['Elephant', 'Memory', 1], ['Tiger', 'Fingerprint', 1], ['Peacock', 'Display', 1], ['Dolphin', 'Clicks', 1],
    ['Camel', 'Caravan', 1], ['Penguin', 'Tuxedo', 1], ['Monkey', 'Branches', 1], ['Crow', 'Grudge', 1],
    ['Owl', 'Nocturnal', 1], ['Snake', 'Coiled', 1], ['Bee', 'Colony', 1], ['Cat', 'Nine', 1],
    // difficulty 2
    ['Bat', 'Upside', 2], ['Octopus', 'Ink', 2], ['Chameleon', 'Mood', 2], ['Sloth', 'Algae', 2],
    ['Crocodile', 'Tears', 2], ['Kangaroo', 'Hopping', 2], ['Giraffe', 'Reach', 2], ['Hedgehog', 'Curled up', 2],
    ['Flamingo', 'Balance', 2], ['Parrot', 'Echo', 2], ['Squirrel', 'Hoard', 2], ['Cheetah', 'Sprint', 2],
    // difficulty 3
    ['Ant', 'Marching', 3], ['Spider', 'Silk', 3], ['Moth', 'Flame', 3], ['Cuckoo', 'Foster', 3],
    ['Mosquito', 'Whine', 3], ['Earthworm', 'Soil', 3], ['Platypus', 'Oddity', 3], ['Pangolin', 'Armoured', 3],
    ['Axolotl', 'Regrows', 3], ['Narwhal', 'Tusk', 3], ['Vulture', 'Patient', 3], ['Hyena', 'Cackle', 3],
  ],
  MOVIES: [
    // difficulty 1
    ['Villain', 'Nemesis', 1], ['Trailer', 'Teaser', 1], ['Sequel', 'Part two', 1], ['Subtitles', 'Reading', 1],
    ['Cameo', 'Blink', 1], ['Director', 'Megaphone', 1], ['Popcorn', 'Buttery', 1], ['Superhero', 'Cape', 1],
    ['Cartoon', 'Saturday', 1], ['Oscar', 'Statuette', 1], ['Actor', 'Roles', 1], ['Cinema', 'Tickets', 1],
    // difficulty 2
    ['Plot twist', 'Reveal', 2], ['Blockbuster', 'Weekend', 2], ['Soundtrack', 'Score', 2],
    ['Stuntman', 'Falling', 2], ['Spoiler', 'Ending', 2], ['Remake', 'Again', 2], ['Screenplay', 'Pages', 2],
    ['Dubbing', 'Voices', 2], ['Cliffhanger', 'Unresolved', 2], ['Intermission', 'Pause', 2], ['Heist', 'Vault', 2],
    ['Documentary', 'Real', 2],
    // difficulty 3
    ['Plot hole', 'Gap', 3], ['Binge watching', 'All night', 3], ['Montage', 'Compressed', 3],
    ['Prequel', 'Before', 3], ['Noir', 'Shadows', 3], ['Franchise', 'Universe', 3], ['Credits', 'Scroll', 3],
    ['Dystopia', 'Bleak', 3], ['Biopic', 'Life', 3], ['Slapstick', 'Pratfalls', 3], ['Voiceover', 'Unseen', 3],
    ['Auteur', 'Vision', 3],
  ],
  PLACES: [
    // difficulty 1
    ['Airport', 'Gates', 1], ['Library', 'Hush', 1], ['Hospital', 'Wards', 1], ['Market', 'Haggle', 1],
    ['Railway station', 'Whistles', 1], ['Beach', 'Tide', 1], ['Temple', 'Bells', 1], ['Zoo', 'Roaring', 1],
    ['Museum', 'Glass cases', 1], ['Desert', 'Mirage', 1], ['Island', 'Isolated', 1], ['Castle', 'Moat', 1],
    // difficulty 2
    ['Lighthouse', 'Beam', 2], ['Stadium', 'Roar', 2], ['Waterfall', 'Plunge', 2], ['Cemetery', 'Remembrance', 2],
    ['Bakery', 'Dawn', 2], ['Harbour', 'Anchors', 2], ['Orchard', 'Rows', 2], ['Observatory', 'Dome', 2],
    ['Bridge', 'Spanning', 2], ['Monastery', 'Vows', 2], ['Casino', 'Gamble', 2], ['Aquarium', 'Glass tunnels', 2],
    // difficulty 3
    ['Border', 'Lines', 3], ['Attic', 'Dust', 3], ['Crossroads', 'Choices', 3], ['Ruins', 'Echoes', 3],
    ['Waiting room', 'Magazines', 3], ['Rooftop', 'Skyline', 3], ['Lobby', 'Revolving', 3], ['Basement', 'Below', 3],
    ['Courtyard', 'Enclosed', 3], ['Alley', 'Shortcut', 3], ['Bunker', 'Shelter', 3], ['Greenhouse', 'Humid', 3],
  ],
  SPORTS: [
    // difficulty 1
    ['Cricket', 'Five days', 1], ['Chess', 'Sacrifice', 1], ['Kabaddi', 'Breath', 1], ['Archery', 'Release', 1],
    ['Marathon', 'Endurance', 1], ['Carrom', 'Powder', 1], ['Football', 'Offside', 1], ['Tennis', 'Love', 1],
    ['Swimming', 'Laps', 1], ['Hockey', 'Curved', 1], ['Boxing', 'Bell', 1], ['Golf', 'Birdie', 1],
    // difficulty 2
    ['Badminton', 'Feathers', 2], ['Skating', 'Glide', 2], ['Wrestling', 'Pinned', 2], ['Cycling', 'Peloton', 2],
    ['Volleyball', 'Spike', 2], ['Basketball', 'Hoops', 2], ['Rugby', 'Scrum', 2], ['Judo', 'Throws', 2],
    ['Fencing', 'Foil', 2], ['Snooker', 'Baize', 2], ['Polo', 'Mallet', 2], ['Rowing', 'Synchronised', 2],
    // difficulty 3
    ['Referee', 'Blamed', 3], ['Penalty', 'Spot', 3], ['Underdog', 'Odds', 3], ['Warm-up', 'Stretching', 3],
    ['Trophy', 'Gleaming', 3], ['Stopwatch', 'Seconds', 3], ['Decathlon', 'Ten', 3], ['Pole vault', 'Bar', 3],
    ['Javelin', 'Throw', 3], ['Triathlon', 'Three', 3], ['Curling', 'Sweeping', 3], ['Sumo', 'Topknot', 3],
  ],
  TECHNOLOGY: [
    // difficulty 1
    ['Wifi', 'Invisible', 1], ['Password', 'Forgotten', 1], ['Charger', 'Percent', 1], ['Email', 'Regards', 1],
    ['Drone', 'Hovering', 1], ['Keyboard', 'Qwerty', 1], ['Phone', 'Pocket', 1], ['Laptop', 'Lap', 1],
    ['Camera', 'Shutter', 1], ['Headphones', 'Isolation', 1], ['Robot', 'Obedient', 1], ['Printer', 'Jam', 1],
    // difficulty 2
    ['Satellite', 'Orbit', 2], ['Algorithm', 'Steps', 2], ['Bluetooth', 'Viking', 2], ['Cache', 'Remembered', 2],
    ['Firewall', 'Barrier', 2], ['Pixel', 'Tiny', 2], ['Server', 'Racks', 2], ['Router', 'Blinking', 2],
    ['Hashtag', 'Pound', 2], ['Emoji', 'Faces', 2], ['Podcast', 'Episodes', 2], ['Browser', 'Tabs', 2],
    // difficulty 3
    ['Cloud', 'Elsewhere', 3], ['Bug', 'Glitch', 3], ['Notification', 'Buzz', 3], ['Update', 'Restart', 3],
    ['Captcha', 'Crosswalks', 3], ['Backup', 'Insurance', 3], ['Blockchain', 'Ledger', 3],
    ['Firmware', 'Embedded', 3], ['Encryption', 'Scrambled', 3], ['Latency', 'Lag', 3], ['Avatar', 'Alter ego', 3],
    ['Malware', 'Infected', 3],
  ],
  EVERYDAY: [
    // difficulty 1
    ['Umbrella', 'Forgotten', 1], ['Mirror', 'Reversed', 1], ['Key', 'Teeth', 1], ['Pillow', 'Dreams', 1],
    ['Candle', 'Wick', 1], ['Scissors', 'Pair', 1], ['Spoon', 'Stirring', 1], ['Clock', 'Ticking', 1],
    ['Towel', 'Damp', 1], ['Backpack', 'Straps', 1], ['Broom', 'Bristles', 1], ['Wallet', 'Cards', 1],
    // difficulty 2
    ['Hanger', 'Wardrobe', 2], ['Zipper', 'Teeth', 2], ['Bucket', 'Handle', 2], ['Torch', 'Beam', 2],
    ['Remote', 'Lost', 2], ['Receipt', 'Proof', 2], ['Alarm', 'Snooze', 2], ['Doorbell', 'Chime', 2],
    ['Spectacles', 'Frames', 2], ['Toothbrush', 'Morning', 2], ['Comb', 'Tangles', 2], ['Razor', 'Edge', 2],
    // difficulty 3
    ['Thimble', 'Fingertip', 3], ['Funnel', 'Narrowing', 3], ['Hourglass', 'Grains', 3],
    ['Padlock', 'Combination', 3], ['Kettle', 'Whistling', 3], ['Ladder', 'Rungs', 3], ['Abacus', 'Beads', 3],
    ['Magnet', 'Poles', 3], ['Matchbox', 'Strike', 3], ['Needle', 'Eye', 3], ['Plug', 'Socket', 3],
    ['Sieve', 'Holes', 3],
  ],
  NATURE: [
    // difficulty 1
    ['Rainbow', 'Prism', 1], ['Volcano', 'Magma', 1], ['Monsoon', 'Season', 1], ['Moon', 'Phases', 1],
    ['Forest', 'Canopy', 1], ['Earthquake', 'Tremor', 1], ['Rain', 'Puddles', 1], ['Mountain', 'Summit', 1],
    ['River', 'Banks', 1], ['Sun', 'Eclipse', 1], ['Fog', 'Veil', 1], ['Thunder', 'Rumble', 1],
    // difficulty 2
    ['Cave', 'Stalactites', 2], ['Coral', 'Reef', 2], ['Glacier', 'Slow', 2], ['Dew', 'Morning', 2],
    ['Cyclone', 'Eye', 2], ['Tornado', 'Spiral', 2], ['Lightning', 'Forked', 2], ['Savanna', 'Grasslands', 2],
    ['Tundra', 'Frozen', 2], ['Swamp', 'Murky', 2], ['Lagoon', 'Shallows', 2], ['Waterfall', 'Cascade', 2],
    // difficulty 3
    ['Shadow', 'Follower', 3], ['Horizon', 'Unreachable', 3], ['Tide', 'Pull', 3], ['Seed', 'Potential', 3],
    ['Echo', 'Reply', 3], ['Season', 'Cycle', 3], ['Aurora', 'Curtains', 3], ['Drought', 'Cracked', 3],
    ['Avalanche', 'Slide', 3], ['Canyon', 'Carved', 3], ['Estuary', 'Mixing', 3], ['Equinox', 'Balance', 3],
  ],
  JOBS: [
    // difficulty 1
    ['Pilot', 'Cockpit', 1], ['Chef', 'Tasting', 1], ['Tailor', 'Measures', 1], ['Farmer', 'Harvest', 1],
    ['Barber', 'Chair', 1], ['Photographer', 'Frame', 1], ['Doctor', 'Rounds', 1], ['Teacher', 'Chalk', 1],
    ['Police officer', 'Beat', 1], ['Engineer', 'Blueprints', 1], ['Plumber', 'Wrench', 1], ['Lawyer', 'Briefs', 1],
    // difficulty 2
    ['Astronaut', 'Gravity', 2], ['Librarian', 'Shelves', 2], ['Electrician', 'Circuits', 2],
    ['Pharmacist', 'Prescriptions', 2], ['Journalist', 'Deadlines', 2], ['Surgeon', 'Steady', 2],
    ['Carpenter', 'Joints', 2], ['Mechanic', 'Grease', 2], ['Nurse', 'Shifts', 2], ['Accountant', 'Ledgers', 2],
    ['Firefighter', 'Sirens', 2], ['Magician', 'Misdirection', 2],
    // difficulty 3
    ['Interpreter', 'Neutral', 3], ['Auditor', 'Discrepancies', 3], ['Architect', 'Drafts', 3],
    ['Detective', 'Hunches', 3], ['Cartographer', 'Scale', 3], ['Archaeologist', 'Layers', 3],
    ['Sommelier', 'Vintage', 3], ['Curator', 'Selecting', 3], ['Coroner', 'Verdict', 3], ['Locksmith', 'Tumblers', 3],
    ['Midwife', 'Delivery', 3], ['Auctioneer', 'Bids', 3],
  ],
  MUSIC: [
    // difficulty 1
    ['Guitar', 'Frets', 1], ['Piano', 'Pedals', 1], ['Drums', 'Beat', 1], ['Flute', 'Breath', 1],
    ['Violin', 'Rosin', 1], ['Tabla', 'Pair', 1], ['Singer', 'Stage', 1], ['Concert', 'Crowd', 1],
    ['Microphone', 'Feedback', 1], ['Choir', 'Blend', 1], ['Lullaby', 'Bedtime', 1], ['Playlist', 'Queue', 1],
    // difficulty 2
    ['Rhythm', 'Pulse', 2], ['Harmony', 'Agreeing', 2], ['Encore', 'Demanded', 2], ['Karaoke', 'Screen', 2],
    ['Anthem', 'Standing', 2], ['Lyrics', 'Misheard', 2], ['Remix', 'Reworked', 2], ['Orchestra', 'Conductor', 2],
    ['Saxophone', 'Reed', 2], ['Trumpet', 'Valves', 2], ['Sitar', 'Resonance', 2], ['Harmonium', 'Bellows', 2],
    // difficulty 3
    ['Octave', 'Eight', 3], ['Crescendo', 'Swelling', 3], ['Falsetto', 'Higher', 3], ['Acoustic', 'Unplugged', 3],
    ['Opera', 'Arias', 3], ['Metronome', 'Ticking', 3], ['Chorus', 'Hook', 3], ['Ballad', 'Slow', 3],
    ['Overture', 'Opening', 3], ['Vinyl', 'Grooves', 3], ['Baton', 'Wand', 3], ['Duet', 'Pairing', 3],
  ],
  CLOTHING: [
    // difficulty 1
    ['Saree', 'Drape', 1], ['Jeans', 'Rivets', 1], ['Watch', 'Hands', 1], ['Sunglasses', 'Squinting', 1],
    ['Slippers', 'Indoors', 1], ['Scarf', 'Winding', 1], ['Shirt', 'Cuffs', 1], ['Shoes', 'Laces', 1],
    ['Cap', 'Visor', 1], ['Belt', 'Notches', 1], ['Gloves', 'Pairs', 1], ['Jacket', 'Layer', 1],
    // difficulty 2
    ['Dhoti', 'Knotted', 2], ['Uniform', 'Identical', 2], ['Necklace', 'Clasp', 2], ['Button', 'Holes', 2],
    ['Pocket', 'Deep', 2], ['Hem', 'Edge', 2], ['Collar', 'Starched', 2], ['Sole', 'Tread', 2],
    ['Thread', 'Spool', 2], ['Lungi', 'Checks', 2], ['Turban', 'Wound', 2], ['Kurta', 'Tunic', 2],
    // difficulty 3
    ['Cufflinks', 'Formal', 3], ['Corset', 'Laced', 3], ['Poncho', 'Cloak', 3], ['Bandana', 'Paisley', 3],
    ['Sash', 'Across', 3], ['Shawl', 'Wool', 3], ['Waistcoat', 'Layered', 3], ['Apron', 'Splashes', 3],
    ['Veil', 'Concealing', 3], ['Stilettos', 'Spikes', 3], ['Beret', 'Slanted', 3],
  ],
  TRANSPORT: [
    // difficulty 1
    ['Metro', 'Underground', 1], ['Auto rickshaw', 'Meter', 1], ['Helicopter', 'Rotors', 1],
    ['Tractor', 'Furrows', 1], ['Ship', 'Hull', 1], ['Ambulance', 'Urgency', 1], ['Bus', 'Stops', 1],
    ['Train', 'Whistle', 1], ['Bicycle', 'Spokes', 1], ['Airplane', 'Turbulence', 1], ['Motorbike', 'Helmet', 1],
    ['Scooter', 'Kickstand', 1],
    // difficulty 2
    ['Truck', 'Horn', 2], ['Taxi', 'Fare', 2], ['Boat', 'Ripples', 2], ['Canoe', 'Narrow', 2],
    ['Ferry', 'Crossing', 2], ['Submarine', 'Depth', 2], ['Tram', 'Overhead', 2], ['Cable car', 'Suspended', 2],
    ['Rocket', 'Countdown', 2], ['Jeep', 'Rugged', 2], ['Van', 'Sliding', 2], ['Cart', 'Creaking', 2],
    // difficulty 3
    ['Traffic', 'Gridlock', 3], ['Luggage', 'Weigh', 3], ['Ticket', 'Stub', 3], ['Highway', 'Tolls', 3],
    ['Signal', 'Amber', 3], ['Platform', 'Gap', 3], ['Passport', 'Stamped', 3], ['Roundabout', 'Circles', 3],
    ['Parking', 'Reverse', 3], ['Flyover', 'Bypass', 3], ['Runway', 'Lights', 3],
  ],
  SCHOOL: [
    // difficulty 1
    ['Blackboard', 'Duster', 1], ['Homework', 'Excuse', 1], ['Calculator', 'Sums', 1], ['Notebook', 'Margins', 1],
    ['Principal', 'Strict', 1], ['Timetable', 'Periods', 1], ['Pencil', 'Sharpened', 1], ['Exam', 'Hall', 1],
    ['Eraser', 'Smudges', 1], ['Textbook', 'Chapters', 1], ['Bell', 'Ringing', 1], ['Chalk', 'Dust', 1],
    // difficulty 2
    ['Stapler', 'Jaws', 2], ['Whiteboard', 'Squeaky', 2], ['Meeting', 'Agenda', 2], ['Deadline', 'Looming', 2],
    ['Resume', 'Summary', 2], ['Attendance', 'Present', 2], ['Backbench', 'Rebels', 2], ['Intern', 'Apprentice', 2],
    ['Syllabus', 'Contents', 2], ['Break', 'Queue', 2], ['Promotion', 'Climb', 2], ['Fire drill', 'Assembly', 2],
    // difficulty 3
    ['Memo', 'Circulated', 3], ['Printer', 'Toner', 3], ['Spreadsheet', 'Cells', 3], ['Presentation', 'Slides', 3],
    ['Appraisal', 'Review', 3], ['Onboarding', 'Orientation', 3], ['Quorum', 'Minimum', 3],
    ['Minutes', 'Recorded', 3], ['Handout', 'Distributed', 3], ['Thesis', 'Defended', 3], ['Scholarship', 'Merit', 3],
  ],
  FESTIVALS: [
    // difficulty 1
    ['Diwali', 'Lamps', 1], ['Pongal', 'Overflowing', 1], ['Holi', 'Powder', 1], ['Christmas', 'Stockings', 1],
    ['Eid', 'Crescent', 1], ['Wedding', 'Vows', 1], ['Birthday', 'Wishes', 1], ['New Year', 'Midnight', 1],
    ['Fireworks', 'Sparks', 1], ['Rangoli', 'Doorstep', 1], ['Garland', 'Strung', 1], ['Procession', 'Chariot', 1],
    // difficulty 2
    ['Gift', 'Wrapped', 2], ['Reunion', 'Cousins', 2], ['Feast', 'Banquet', 2], ['Tradition', 'Inherited', 2],
    ['Lantern', 'Glowing', 2], ['Prayer', 'Upward', 2], ['Navratri', 'Nine nights', 2], ['Onam', 'Boat races', 2],
    ['Ganesh Chaturthi', 'Immersion', 2], ['Thanksgiving', 'Gratitude', 2], ['Halloween', 'Costumes', 2],
    ['Carnival', 'Masks', 2],
    // difficulty 3
    ['Sweets', 'Boxes', 3], ['Mehndi', 'Intricate', 3], ['Bonfire', 'Embers', 3], ['Pilgrimage', 'Journey', 3],
    ['Confetti', 'Shower', 3], ['Rituals', 'Sequence', 3], ['Parade', 'Floats', 3], ['Anniversary', 'Annual', 3],
    ['Housewarming', 'Threshold', 3], ['Baptism', 'Waters', 3], ['Farewell', 'Speeches', 3],
  ],
};

/** BANK -> flat rows ({category, categoryLabel, word, hint, difficulty}); used by the seed script. */
export const WORD_ROWS = Object.entries(BANK).flatMap(([category, list]) => list.map(([word, hint, difficulty]) => ({
  category, categoryLabel: CATEGORY_LABELS[category] || category, word, hint, difficulty,
})));

/** Firestore rows -> { bank: {CATEGORY: [[word, hint, difficulty, id?]]}, labels: {CATEGORY: label} } */
export function buildBank(rows) {
  const bank = {}; const labels = {};
  rows.forEach((r) => {
    if (!r?.category || !r?.word || !r?.hint) return;
    const d = Number(r.difficulty);
    (bank[r.category] ||= []).push([String(r.word), String(r.hint), d >= 1 && d <= 3 ? d : 2, r.id]);
    labels[r.category] ||= r.categoryLabel || r.category;
  });
  return { bank, labels };
}

const built = { bank: BANK, labels: CATEGORY_LABELS };
export const CATEGORIES = Object.keys(BANK);
const DIFF = { EASY: 1, MEDIUM: 2, HARD: 3 };

/**
 * Pick the crew word and the imposter's clue automatically.
 * With category RANDOM a topic is chosen at random each match (never the same topic twice in a
 * row when avoidable), then a word from it that has not been used recently in this room.
 * `source` is optional ({bank, labels} from Firestore); defaults to the built-in list above.
 * @returns {{id:string, word:string, hint:string, imposterWord:string, category:string, categoryLabel:string, difficulty:number}}
 */
export function pickWords({ category = 'RANDOM', difficulty = 'ANY', recent = [], source = built } = {}) {
  const useSource = source?.bank && Object.keys(source.bank).length ? source : built;
  const { bank, labels } = useSource;
  const all = Object.keys(bank);
  const lastCat = recent.length ? String(recent[recent.length - 1]).split(':')[0] : null;
  let cats = category === 'RANDOM' || !bank[category] ? all : [category];
  if (cats.length > 1) cats = cats.filter((c) => c !== lastCat);

  const poolFor = (list, strict) => list.flatMap((c) => bank[c]
    .map((p, i) => ({ id: p[3] ? `${c}:${p[3]}` : `${c}:${i}`, c, p }))
    .filter((x) => (!strict || difficulty === 'ANY' || DIFF[difficulty] === x.p[2])));

  // Choose the topic first (so big topics do not dominate), falling back if it has nothing left.
  let chosen = null;
  for (const c of shuffle(cats)) {
    const fresh = poolFor([c], true).filter((x) => !recent.includes(x.id));
    if (fresh.length) { chosen = pick(fresh); break; }
  }
  if (!chosen) {
    const any = poolFor(cats, true);
    chosen = pick(any.length ? any : poolFor(cats, false));
  }
  const [word, hint, diff] = chosen.p;
  return { id: chosen.id, word, hint, imposterWord: hint, category: chosen.c, categoryLabel: labels[chosen.c] || chosen.c, difficulty: diff };
}


