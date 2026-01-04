import type { ForumRegion, Pack, User, Character, Thread } from '../types';

export const packs: Pack[] = [
  {
    id: 'adunati-rangers',
    name: 'Adunati Rangers',
    ranks: ['Alpha', 'Beta', 'Ranger', 'Scout', 'Omega'],
    colors: { primary: '#4a5d23', secondary: '#8a9a5b' }
  },
  {
    id: 'firewing-brotherhood',
    name: 'Firewing Brotherhood',
    ranks: ['Inferno', 'Flame', 'Spark', 'Ash'],
    colors: { primary: '#8b0000', secondary: '#ff4500' }
  },
  {
    id: 'hillside-sanctuary',
    name: 'Hillside Sanctuary',
    ranks: ['Guardian', 'Healer', 'Keeper', 'Ward'],
    colors: { primary: '#2e8b57', secondary: '#98fb98' }
  },
  {
    id: 'imperial-faction',
    name: 'Imperial Faction',
    ranks: ['Emperor', 'General', 'Soldier', 'Citizen'],
    colors: { primary: '#4b0082', secondary: '#9370db' }
  }
];

export const regions: ForumRegion[] = [
  {
    id: 'eastern-wasteland',
    name: 'Eastern Wasteland',
    description: 'A desolate place where few dare to tread.',
    subareas: [
      { id: 'adder-creek', name: 'Adder Creek' },
      { id: 'sandstone-gorge', name: 'Sandstone Gorge' }
    ]
  },
  {
    id: 'verdant-hills',
    name: 'Verdant Hills',
    description: 'Lush green hills rolling as far as the eye can see.',
    subareas: [
      { id: 'fossil-butte', name: 'Fossil Butte' },
      { id: 'riverside-hollow', name: 'Riverside Hollow' }
    ]
  },
  {
    id: 'rolling-prairies',
    name: 'Rolling Prairies',
    description: 'Open fields perfect for running.',
    subareas: [
      { id: 'harlequin-meadow', name: 'Harlequin Meadow' }
    ]
  },
  {
    id: 'cloudmirror-lake',
    name: 'Cloudmirror Lake',
    description: 'A crystal clear lake reflecting the sky.',
    subareas: [
      { id: 'willowed-glade', name: 'Willowed Glade' },
      { id: 'wormwood-grove', name: 'Wormwood Grove' },
      { id: 'heckled-holt', name: 'Heckled Holt' }
    ]
  },
  {
    id: 'starlight-peaks',
    name: 'Starlight Peaks',
    description: 'High mountains touching the stars.',
    subareas: [
      { id: 'grand-rapids', name: 'Grand Rapids' },
      { id: 'crystal-shore', name: 'Crystal Shore' },
      { id: 'kingsfall-cascade', name: 'Kingsfall Cascade' }
    ]
  },
  {
    id: 'moonrise-bay',
    name: 'Moonrise Bay',
    description: 'A mysterious bay illuminated by the moon.',
    subareas: [
      { id: 'brittle-wetland', name: 'Brittle Wetland' },
      { id: 'pearl-isle', name: 'Pearl Isle' }
    ]
  },
  {
    id: 'firefly-woods',
    name: 'Firefly Woods',
    description: 'Forests glowing with bioluminescent life.',
    subareas: [
      { id: 'shrouded-pines', name: 'Shrouded Pines' },
      { id: 'emerald-labyrinth', name: 'Emerald Labyrinth' }
    ]
  },
  {
    id: 'evergreen-forest',
    name: 'Evergreen Forest',
    description: 'Ancient trees that never lose their leaves.',
    subareas: [
      { id: 'white-geysers', name: 'White Geysers' },
      { id: 'everlasting-caverns', name: 'Everlasting Caverns' },
      { id: 'the-clearing', name: 'The Clearing' }
    ]
  },
  {
    id: 'western-plains',
    name: 'Western Plains',
    description: 'Vast plains in the west.',
    subareas: []
  },
  {
    id: 'falter-glen',
    name: 'Falter Glen',
    description: 'A tricky terrain that challenges even the sure-footed.',
    subareas: [
      { id: 'shadowed-dell', name: 'Shadowed Dell' },
      { id: 'guarded-falls', name: 'Guarded Falls' }
    ]
  },
  {
    id: 'strongwind-range',
    name: 'Strongwind Range',
    description: 'Windy peaks and valleys.',
    subareas: [
      { id: 'falcon-rise', name: 'Falcon Rise' },
      { id: 'thunder-creek', name: 'Thunder Creek' },
      { id: 'oak-savanna', name: 'Oak Savanna' }
    ]
  },
  {
    id: 'skyrise-pass',
    name: 'Skyrise Pass',
    description: 'A high pass through the mountains.',
    subareas: [
      { id: 'lake-melody', name: 'Lake Melody' },
      { id: 'oversea-lookout', name: 'Oversea Lookout' },
      { id: 'moonglade-springs', name: 'Moonglade Springs' },
      { id: 'hellmaw-caverns', name: 'Hellmaw Caverns' },
      { id: 'starshatter-basin', name: 'Starshatter Basin' }
    ]
  },
  {
    id: 'sundown-coast',
    name: 'Sundown Coast',
    description: 'Where the sun sets over the ocean.',
    subareas: [
      { id: 'hidden-cove', name: 'Hidden Cove' },
      { id: 'wavehaven-gorge', name: 'Wavehaven Gorge' }
    ]
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'WolfLover99',
    email: 'wolf@example.com',
    characters: ['1', '2'],
    activeCharacterId: '1'
  }
];

export const mockCharacters: Character[] = [
  {
    id: '1',
    userId: '1',
    name: 'Fenrir',
    sex: 'Male',
    age: '4 years',
    healthStatus: '100%',
    imageUrl: 'https://via.placeholder.com/150',
    skillPoints: 150,
    achievements: [],
    packId: 'adunati-rangers',
    rank: 'Ranger',
    bio: 'A loyal ranger of the Adunati.'
  },
  {
    id: '2',
    userId: '1',
    name: 'Luna',
    sex: 'Female',
    age: '2 years',
    healthStatus: '90%',
    imageUrl: 'https://via.placeholder.com/150',
    skillPoints: 50,
    achievements: [],
    packId: 'hillside-sanctuary',
    rank: 'Healer',
    bio: 'A gentle soul learning the healing arts.'
  }
];

export const mockThreads: Thread[] = [
  {
    id: 'thread1',
    title: 'No wonder they call it a wasteland',
    authorId: '1',
    regionId: 'eastern-wasteland',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T12:00:00Z',
    views: 120,
    replies: [
      {
        id: 'reply1',
        threadId: 'thread1',
        authorId: '2',
        content: 'It really is dry out here.',
        createdAt: '2026-01-02T11:00:00Z'
      }
    ]
  }
];
