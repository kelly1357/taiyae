/**
 * Spirit Symbol Quiz Data
 * 
 * Scoring axes:
 * - order: positive = lawful, negative = chaotic
 * - morality: positive = good, negative = evil/self-serving
 * 
 * Symbol mapping (order x morality):
 * 
 *              GOOD        NEUTRAL     EVIL
 * LAWFUL      Hoof        Eye         Antler
 * NEUTRAL     Leaf        Stone       Bone
 * CHAOTIC     Feather     Print       Fang
 */

export interface QuizOption {
  id: string;
  label: string;
  score: {
    order: number;    // positive = lawful, negative = chaotic
    morality: number; // positive = good, negative = evil
  };
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export interface SpiritSymbol {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  orderBucket: 'lawful' | 'neutral' | 'chaotic';
  moralityBucket: 'good' | 'neutral' | 'evil';
}

// Spirit Symbol definitions with descriptions from wiki
export const spiritSymbols: SpiritSymbol[] = [
  {
    id: 'hoof',
    name: 'Hoof',
    description: 'Committed to serving the greater good through order and loyalty, a Hoof is compassionate and fiercely loyal to those he serves. He operates behind a strong moral compass or personal code of honor, and endeavors to protect those weaker than him. He believes there is order to the world, and that upholding this order is necessary for there to be good in the world.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/hoof_d.png',
    orderBucket: 'lawful',
    moralityBucket: 'good',
  },
  {
    id: 'leaf',
    name: 'Leaf',
    description: 'A Leaf tries to do what he believes is right, and values both order and personal freedom, whichever is necessary to contribute to good and uphold the natural balance he sees in the world. A Leaf appreciates life in all its forms. He is happy to stand up for those weaker than him, but also realizes the importance of his own well-being.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/leaf_d.png',
    orderBucket: 'neutral',
    moralityBucket: 'good',
  },
  {
    id: 'feather',
    name: 'Feather',
    description: 'Acting according to her conscience, a Feather is kind and benevolent, naturally independent, and makes her own way. She plans little and tends to follow her heart. A Feather believes that true satisfaction and happiness are the reasons for living. She respects individual life, resents confinement, and values personal liberty above all.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/feather_d.png',
    orderBucket: 'chaotic',
    moralityBucket: 'good',
  },
  {
    id: 'eye',
    name: 'Eye',
    description: 'An Eye acts according to law, tradition, or personal code. She is not naturally inclined toward helping or hurting others, and may do either if it supports whatever law she follows. She disdains rebelliousness, as she likely believes all life must have order. She believes that law and order trumps all.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/eye_d.png',
    orderBucket: 'lawful',
    moralityBucket: 'neutral',
  },
  {
    id: 'stone',
    name: 'Stone',
    description: 'A Stone has no bias toward helping others or hurting them, or toward order or independence. He follows his own path, and lets the situation at hand influence his actions. A Stone does what he wants, and values acting naturally without prejudice. He judges each situation on its own merits.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/stone_d.png',
    orderBucket: 'neutral',
    moralityBucket: 'neutral',
  },
  {
    id: 'print',
    name: 'Print',
    description: 'A Print is an individualist first and foremost, and is not naturally inclined toward or against the greater good. He mostly follows his own whims. He is loyal to himself above all others. He avoids authority and restriction, respecting absolute freedom instead. Overall, he values his own ability to have a choice in all matters.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/print_d.png',
    orderBucket: 'chaotic',
    moralityBucket: 'neutral',
  },
  {
    id: 'antler',
    name: 'Antler',
    description: 'An Antler values order and authority, and is methodical rather than merciful or compassionate in serving those to whom he\'s sworn. He values his own life above the lives of others. He is comfortable in a hierarchy, and may be even more comfortable as a leader. He values discipline for himself and others.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/antler_d.png',
    orderBucket: 'lawful',
    moralityBucket: 'evil',
  },
  {
    id: 'bone',
    name: 'Bone',
    description: 'A Bone does whatever she can get away with to advance her own goals, and may choose either independence or cooperation, whichever suits her at the moment. A Bone pursues her wants and needs without regard for others. She has no trouble lying or manipulating to get what she wants.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/bone_d.png',
    orderBucket: 'neutral',
    moralityBucket: 'evil',
  },
  {
    id: 'fang',
    name: 'Fang',
    description: 'Motivated by personal gain, a Fang cares primarily about fulfilling his own desires— chaos and disorder among them— in any way he can. A Fang serves himself only, and rarely helps others without some ulterior motive. He is committed to disorder, and values his own freedom above all else.',
    imageUrl: 'https://taiyaefiles.blob.core.windows.net/web/fang_d.png',
    orderBucket: 'chaotic',
    moralityBucket: 'evil',
  },
];

// Quiz questions with scoring
// 
// SCORING PHILOSOPHY:
// - Each axis scored independently: order (lawful+/chaotic-) and morality (good+/evil-)
// - Most options should affect ONE axis strongly and the other weakly or not at all
// - Use scores from -2 to +2, with 0 being common for the "off" axis
// - This ensures players can reach all 9 outcomes, not just corners
//
// NORMALIZED THRESHOLDS (±0.35 per question average):
// - Avg > +0.35 = positive bucket (lawful/good)
// - Avg < -0.35 = negative bucket (chaotic/evil)  
// - Avg between = neutral bucket

export const quizQuestions: QuizQuestion[] = [
  // Q1: ORDER-focused (how you handle secrets/authority)
  {
    id: 'q1',
    prompt: "You witness your leader murdering his mate, and you're the only one who knows. What do you do?",
    options: [
      { id: 'q1a', label: "Tell my leader I know what happened— promise him I won't tell anyone, and keep my promise.", score: { order: 1, morality: -1 } },
      { id: 'q1b', label: "Keep my mouth shut and speak nothing of it to anyone.", score: { order: 1, morality: 0 } },
      { id: 'q1c', label: "Tell only one wolf, my closest friend in the pack, to try and gain some insight.", score: { order: 0, morality: 0 } },
      { id: 'q1d', label: "Spread the news individually to every pack mate I encounter.", score: { order: -1, morality: 0 } },
      { id: 'q1e', label: "Announce it at the next pack meeting with everyone there.", score: { order: -1, morality: 1 } },
    ],
  },
  // Q2: MORALITY-focused (sharing vs selfishness)
  {
    id: 'q2',
    prompt: "You've just killed a rabbit. Where are you taking it?",
    options: [
      { id: 'q2a', label: "To deposit it in the pack's cache.", score: { order: 1, morality: 1 } },
      { id: 'q2b', label: "I've already eaten some, but I'm going to take the rest to the pack when I'm done.", score: { order: 0, morality: 1 } },
      { id: 'q2c', label: "Right over here, where I'll probably eat until I'm full and leave the rest behind.", score: { order: 0, morality: -1 } },
    ],
  },
  // Q3: ORDER-focused (follow procedure vs act alone)
  {
    id: 'q3',
    prompt: "The pack den is being destroyed by a flood, and there are puppies inside. What do you do?",
    options: [
      { id: 'q3a', label: "Call for help!", score: { order: 2, morality: 0 } },
      { id: 'q3b', label: "Rush inside to save the pups myself!", score: { order: -1, morality: 1 } },
    ],
  },
  // Q4: ORDER-focused (duty vs personal choice)
  {
    id: 'q4',
    prompt: "You're on your way to a pack meeting, but you happen across a baby deer left on its own. What do you do?",
    options: [
      { id: 'q4a', label: "Pass it up because it's important you get to the meeting on time.", score: { order: 2, morality: 0 } },
      { id: 'q4b', label: "Linger around and decide, but leave eventually, making you just a little late.", score: { order: 0, morality: 0 } },
      { id: 'q4c', label: "Kill and eat it, and arrive late to the meeting.", score: { order: -1, morality: 0 } },
    ],
  },
  // Q5: MIXED - reveals past behavior
  {
    id: 'q5',
    prompt: "You've been demoted to the lowest rank in your pack. Why?",
    options: [
      { id: 'q5a', label: "You attacked a trespasser at the borders, even though he claimed to be the leader's friend.", score: { order: 1, morality: 0 } },
      { id: 'q5b', label: "You lied to your leader to save your own reputation.", score: { order: 0, morality: -1 } },
      { id: 'q5c', label: "You deviated from the plan during a hunt, endangering the lives of your pack mates.", score: { order: -2, morality: 0 } },
    ],
  },
  // Q6: ORDER-focused (respect for hierarchy)
  {
    id: 'q6',
    prompt: "Your leader has promoted your pack mate to Second, even though you're more skilled. How do you feel about this?",
    options: [
      { id: 'q6a', label: "The leader has his reasons and knows what he's doing, even if I can't understand his actions.", score: { order: 2, morality: 0 } },
      { id: 'q6b', label: "It isn't my place to decide the ranks.", score: { order: 1, morality: 0 } },
      { id: 'q6c', label: "Someone should keep an eye on the new Second to make sure he's doing a good job.", score: { order: 0, morality: 0 } },
      { id: 'q6d', label: "The leader is making a big mistake.", score: { order: -1, morality: 0 } },
      { id: 'q6e', label: "The new Second isn't the only wolf unfit for his position.", score: { order: -1, morality: -1 } },
    ],
  },
  // Q7: ORDER-focused (working within system vs against it)
  {
    id: 'q7',
    prompt: "About that new Second— what are you going to do about it?",
    options: [
      { id: 'q7a', label: "Nothing, I'm going to accept my position for now.", score: { order: 2, morality: 0 } },
      { id: 'q7b', label: "I'm going to ask the leader if I can challenge for the rank.", score: { order: 1, morality: 0 } },
      { id: 'q7c', label: "Forget the leader— I'm going to challenge the Second without asking the leader.", score: { order: -2, morality: 0 } },
    ],
  },
  // Q8: Pure ORDER question (pack structure - travel)
  {
    id: 'q8',
    prompt: "You're the leader of a pack. Which is most accurate about the way your pack operates regarding travel?",
    options: [
      { id: 'q8a', label: "Nobody strays far from the pack lands except on specific errands.", score: { order: 2, morality: 0 } },
      { id: 'q8b', label: "Wolves travel outside the pack lands if necessary, though they don't go far and always report back quickly.", score: { order: 1, morality: 0 } },
      { id: 'q8c', label: "Wolves travel outside the pack lands at will, but there are repercussions for those who vanish for too long.", score: { order: 0, morality: 0 } },
      { id: 'q8d', label: "Wolves may travel anywhere they please, as long as they show up at hunts and gatherings and defend their pack.", score: { order: -1, morality: 0 } },
      { id: 'q8e', label: "Wolves can travel anytime and anywhere for as long as they please, but should encounter one another occasionally.", score: { order: -2, morality: 0 } },
    ],
  },
  // Q9: Pure ORDER question (pack structure - roles)
  {
    id: 'q9',
    prompt: "You're the leader of a pack. Which is most accurate about the way your pack operates regarding roles?",
    options: [
      { id: 'q9a', label: "Wolves only perform duties relevant to their pack roles, which they have earned.", score: { order: 2, morality: 0 } },
      { id: 'q9b', label: "Pack roles are skill-based specific, but hunters may double as warriors if needed.", score: { order: 1, morality: 0 } },
      { id: 'q9c', label: "Pack roles are not always assigned based on skill, and while some wolves have multiple roles, most stick to their assigned duties.", score: { order: 0, morality: 0 } },
      { id: 'q9d', label: "Pack roles are awarded based on skill, but any wolf can perform duties outside his role if the time is right.", score: { order: -1, morality: 0 } },
      { id: 'q9e', label: "There are few to no solid pack roles; everyone simply does what they do best.", score: { order: -2, morality: 0 } },
    ],
  },
  // Q10: Pure MORALITY question (compassion for stranger)
  {
    id: 'q10',
    prompt: "You find a dying, bleeding wolf on the ground, a stranger. He's conscious, but seems beyond help. What do you do?",
    options: [
      { id: 'q10a', label: "Offer to kill him to put him out of his misery.", score: { order: 0, morality: 1 } },
      { id: 'q10b', label: "Sit with him until he passes.", score: { order: 0, morality: 2 } },
      { id: 'q10c', label: "Don't get involved.", score: { order: 0, morality: 0 } },
      { id: 'q10d', label: "Just kill him, why not.", score: { order: 0, morality: -1 } },
      { id: 'q10e', label: "Make his wounds a little deeper and leave him on his own.", score: { order: 0, morality: -2 } },
    ],
  },
  // Q11: MIXED (loyalty/order vs morality)
  {
    id: 'q11',
    prompt: "A neighboring pack was trespassing on your pack's hunting grounds— because of this, war has broken out. Your brother is part of the enemy pack. Which side do you choose?",
    options: [
      { id: 'q11a', label: "Choose the side who's doing the least wrong.", score: { order: 0, morality: 1 } },
      { id: 'q11b', label: "Choose the side on which your loyalties lie most.", score: { order: 1, morality: 0 } },
      { id: 'q11c', label: "Stay away from the fight and hope nothing happens to him.", score: { order: -1, morality: 1 } },
      { id: 'q11d', label: "Choose the side that seems the most likely to win.", score: { order: 0, morality: -1 } },
    ],
  },
  // Q12: Pure MORALITY question (treatment of weak)
  {
    id: 'q12',
    prompt: "You've got a young, shy new pack mate. How do you treat them?",
    options: [
      { id: 'q12a', label: "Help introduce him to the rest of your pack mates and take him under your wing.", score: { order: 0, morality: 2 } },
      { id: 'q12b', label: "Be a friend to him and help him out if he asks.", score: { order: 0, morality: 1 } },
      { id: 'q12c', label: "Help him out sometimes, but only if it's no skin off your back.", score: { order: 0, morality: 0 } },
      { id: 'q12d', label: "Don't assist him in any way; he's not worth your time.", score: { order: 0, morality: -1 } },
      { id: 'q12e', label: "Beat him up and boss him around. It's just so easy.", score: { order: 0, morality: -2 } },
    ],
  },
  // Q13: Pure MORALITY question (generosity)
  {
    id: 'q13',
    prompt: "You're a hungry lone wolf carrying a fresh kill. You run into another, very emaciated loner. What do you do?",
    options: [
      { id: 'q13a', label: "Give him all of your kill.", score: { order: 0, morality: 2 } },
      { id: 'q13b', label: "Give him half of your kill.", score: { order: 0, morality: 1 } },
      { id: 'q13c', label: "Give him none of your kill.", score: { order: 0, morality: -1 } },
    ],
  },
  // Q14: Pure MORALITY question (bravery/selflessness)
  {
    id: 'q14',
    prompt: "A mother bear has attacked your pack mate, whom you barely know, to protect her cubs. You have the chance to jump in, but you'll be in great danger.",
    options: [
      { id: 'q14a', label: "Get in there and fight— to save the other wolf!", score: { order: 0, morality: 2 } },
      { id: 'q14b', label: "Stay away. Too dangerous.", score: { order: 0, morality: 0 } },
      { id: 'q14c', label: "Get in there and fight— to kill the bear!", score: { order: 0, morality: -1 } },
    ],
  },
  // Q15: MIXED (order and morality both)
  {
    id: 'q15',
    prompt: "You're approached with a plot to assassinate a leader. How do you respond?",
    options: [
      { id: 'q15a', label: "No!", score: { order: 1, morality: 1 } },
      { id: 'q15b', label: "What's in it for me?", score: { order: 0, morality: -1 } },
      { id: 'q15c', label: "Sounds fun!", score: { order: -1, morality: -1 } },
    ],
  },
  // Q16: MORALITY-focused (justification for violence)
  {
    id: 'q16',
    prompt: "You've just helped kill a wolf. Why?",
    options: [
      { id: 'q16a', label: "He was killing and torturing innocent wolves, including pups.", score: { order: 0, morality: 2 } },
      { id: 'q16b', label: "He killed a friend of mine.", score: { order: 0, morality: 0 } },
      { id: 'q16c', label: "We had a personal debt to settle.", score: { order: 0, morality: -1 } },
      { id: 'q16d', label: "He was a threat to me.", score: { order: 0, morality: -1 } },
      { id: 'q16e', label: "I wanted to kill someone.", score: { order: 0, morality: -2 } },
    ],
  },
  // Q17: MIXED (ambition and motivation)
  {
    id: 'q17',
    prompt: "You're challenging for leadership of a pack. Why?",
    options: [
      { id: 'q17a', label: "I'm the best wolf for the job.", score: { order: 1, morality: 1 } },
      { id: 'q17b', label: "I'd like to be in power.", score: { order: 1, morality: -1 } },
      { id: 'q17c', label: "I need a pack so I can get what I want.", score: { order: -1, morality: -1 } },
    ],
  },
];

// Total number of questions for progress calculation
export const TOTAL_QUESTIONS = quizQuestions.length;

/*
SCORING SYSTEM OVERVIEW:

Each question primarily targets ONE axis:
- Q3, Q4, Q5, Q6, Q7, Q8, Q9 = ORDER axis (lawful vs chaotic)
- Q10, Q12, Q13, Q14, Q16 = MORALITY axis (good vs evil)
- Q1, Q2, Q11, Q15, Q17 = MIXED (both axes, but moderate scores)

AXIS BALANCE:
- ORDER questions: 7 pure + 5 mixed = plenty of opportunity to differentiate lawful/neutral/chaotic
- MORALITY questions: 5 pure + 5 mixed = plenty of opportunity to differentiate good/neutral/evil

NORMALIZED SCORING (threshold ±0.35):
- With 17 questions, threshold is ~6 raw points
- Most options score 0-1 on each axis (moderate)
- Only truly extreme options score ±2

PATH EXAMPLES:
- Hoof (Lawful+Good): Pick lawful options (Q3a, Q4a, Q6a, Q7a, Q8a) + good options (Q10b, Q12a, Q13a)
- Eye (Lawful+Neutral): Pick lawful options + neutral morality options
- Antler (Lawful+Evil): Pick lawful options + evil options (Q17b for power)
- Leaf (Neutral+Good): Pick neutral order options + good options
- Stone (Neutral+Neutral): Pick middle options throughout
- Bone (Neutral+Evil): Pick neutral order + evil options (Q5b lie, Q11d win)
- Feather (Chaotic+Good): Pick chaotic options (Q3b, Q7c) + good options
- Print (Chaotic+Neutral): Pick chaotic options + neutral morality
- Fang (Chaotic+Evil): Pick chaotic options + evil options (Q10e, Q12e, Q16e)
*/
