export interface PlanetData {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'dwarf' | 'moon';
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  atmosphereColor?: string;
  atmosphereSize?: number;
  rings?: {
    innerRadius: number;
    outerRadius: number;
    color: string;
    opacity: number;
  };
  moons?: MoonData[];
  tilt: number;
  description: string;
  facts: {
    diameter: string;
    distanceFromSun: string;
    orbitalPeriod: string;
    gravity: string;
    temperature: string;
    moons: string;
    funFact: string;
  };
  story: string;
  cloudLayer?: boolean;
  stormBands?: boolean;
  surfaceDetail?: string;
}

export interface MoonData {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  description: string;
}

export const PLANET_DATA: PlanetData[] = [
  {
    id: 'sun',
    name: 'The Sun',
    type: 'star',
    radius: 8,
    orbitRadius: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.003,
    color: '#FDB813',
    emissive: '#FF6600',
    emissiveIntensity: 1.5,
    atmosphereColor: '#FF8C00',
    atmosphereSize: 1.3,
    tilt: 0,
    description: 'Our magnificent star — the gravitational anchor of everything we call home.',
    story: 'At the heart of our solar system burns a star 4.6 billion years old. The Sun contains 99.86% of all matter in our solar system. Every second, it converts 600 million tons of hydrogen into helium through nuclear fusion, releasing more energy in one second than humanity has ever produced.',
    facts: {
      diameter: '1,392,700 km',
      distanceFromSun: '0 km',
      orbitalPeriod: 'N/A',
      gravity: '274 m/s²',
      temperature: '5,778 K (surface) / 15M K (core)',
      moons: '0',
      funFact: 'The Sun\'s core is so dense that a photon of light takes 100,000 years to travel from the core to the surface — then just 8 minutes to reach Earth.'
    }
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    radius: 0.85,
    orbitRadius: 14,
    orbitSpeed: 0.0048,
    rotationSpeed: 0.002,
    color: '#B5B5B5',
    emissive: '#3A3A3A',
    emissiveIntensity: 0.05,
    tilt: 0.034,
    surfaceDetail: 'cratered',
    description: 'The swift messenger of the gods — a world of extremes closest to the Sun.',
    story: 'Scorched by day, frozen by night. Mercury\'s lack of atmosphere means temperatures swing 600°C between its sun-facing and dark sides. Despite being closest to the Sun, it is not the hottest planet — that title belongs to Venus.',
    facts: {
      diameter: '4,879 km',
      distanceFromSun: '57.9 million km',
      orbitalPeriod: '88 Earth days',
      gravity: '3.7 m/s²',
      temperature: '-180°C to 430°C',
      moons: '0',
      funFact: 'A day on Mercury (sunrise to sunrise) takes 176 Earth days — twice as long as its year of 88 days.'
    }
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    radius: 1.2,
    orbitRadius: 20,
    orbitSpeed: 0.0035,
    rotationSpeed: -0.001,
    color: '#E8C170',
    emissive: '#8B6914',
    emissiveIntensity: 0.1,
    atmosphereColor: '#E8A020',
    atmosphereSize: 1.15,
    tilt: 177.4,
    description: 'Earth\'s twin in size, yet a hellish world of crushing pressure and acid clouds.',
    story: 'Venus rotates backwards compared to most planets — the Sun rises in the west and sets in the east. Its thick atmosphere of CO₂ has created the most extreme greenhouse effect in the solar system, making Venus the hottest planet despite being farther from the Sun than Mercury.',
    facts: {
      diameter: '12,104 km',
      distanceFromSun: '108.2 million km',
      orbitalPeriod: '225 Earth days',
      gravity: '8.87 m/s²',
      temperature: '462°C (average)',
      moons: '0',
      funFact: 'One day on Venus (243 Earth days) is longer than one Venusian year (225 Earth days). It rotates so slowly that the Sun barely moves in its sky.'
    }
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    radius: 1.3,
    orbitRadius: 27,
    orbitSpeed: 0.003,
    rotationSpeed: 0.005,
    color: '#2F6DA4',
    emissive: '#0A2040',
    emissiveIntensity: 0.05,
    atmosphereColor: '#4FC3F7',
    atmosphereSize: 1.12,
    tilt: 23.5,
    cloudLayer: true,
    moons: [
      {
        id: 'moon',
        name: 'The Moon',
        radius: 0.35,
        orbitRadius: 3.5,
        orbitSpeed: 0.02,
        color: '#A0A0A0',
        description: 'Earth\'s faithful companion for 4.5 billion years'
      }
    ],
    description: 'Our pale blue dot — the only known harbor of life in the entire universe.',
    story: 'From space, Earth glows like a jewel — blue oceans, white clouds, and patches of green and brown land. Of all the countless worlds in the cosmos, this is the only one confirmed to teem with life. Every species, every civilization, every human story has unfolded on this fragile sphere.',
    facts: {
      diameter: '12,742 km',
      distanceFromSun: '149.6 million km (1 AU)',
      orbitalPeriod: '365.25 days',
      gravity: '9.81 m/s²',
      temperature: '-88°C to 58°C',
      moons: '1 (The Moon)',
      funFact: 'Earth is the densest planet in the solar system. Its inner core is solid iron — hot as the surface of the Sun — yet kept solid by immense pressure.'
    }
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    radius: 0.95,
    orbitRadius: 36,
    orbitSpeed: 0.0024,
    rotationSpeed: 0.0049,
    color: '#C1440E',
    emissive: '#5C1A00',
    emissiveIntensity: 0.05,
    atmosphereColor: '#E07030',
    atmosphereSize: 1.08,
    tilt: 25.2,
    description: 'The Red Planet — humanity\'s next great frontier and our best hope among the stars.',
    story: 'Mars holds the tallest volcano in the solar system (Olympus Mons, 21km high), the longest canyon system (Valles Marineris, 4000km long), and evidence of ancient rivers and lakes. Today, multiple spacecraft and rovers are actively exploring its rust-colored surface, searching for signs of ancient life.',
    facts: {
      diameter: '6,779 km',
      distanceFromSun: '227.9 million km',
      orbitalPeriod: '687 Earth days',
      gravity: '3.72 m/s²',
      temperature: '-125°C to 20°C',
      moons: '2 (Phobos & Deimos)',
      funFact: 'Olympus Mons on Mars is the largest volcano in the solar system — so wide that you could not see its edges from its summit due to the curvature of the planet.'
    }
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    radius: 4.5,
    orbitRadius: 58,
    orbitSpeed: 0.0013,
    rotationSpeed: 0.012,
    color: '#C88B3A',
    emissive: '#4A2000',
    emissiveIntensity: 0.05,
    atmosphereColor: '#E0A040',
    atmosphereSize: 1.06,
    tilt: 3.1,
    stormBands: true,
    description: 'The king of planets — a gas giant so vast it could swallow 1,300 Earths.',
    story: 'Jupiter is a world unto itself — a swirling colossus of hydrogen and helium with no solid surface. Its iconic Great Red Spot is a storm that has raged for over 350 years, wider than planet Earth itself. Jupiter\'s immense gravity acts as a cosmic shield, deflecting asteroids that might otherwise threaten the inner planets.',
    facts: {
      diameter: '139,820 km',
      distanceFromSun: '778.5 million km',
      orbitalPeriod: '11.9 Earth years',
      gravity: '24.79 m/s²',
      temperature: '-110°C (cloud tops)',
      moons: '95 known moons (inc. Europa, Io, Ganymede)',
      funFact: 'Jupiter\'s moon Europa has a liquid water ocean beneath its icy shell containing more water than all Earth\'s oceans combined — making it one of the best candidates for extraterrestrial life.'
    }
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    radius: 3.8,
    orbitRadius: 80,
    orbitSpeed: 0.00096,
    rotationSpeed: 0.009,
    color: '#E8D5A3',
    emissive: '#5A4000',
    emissiveIntensity: 0.05,
    atmosphereColor: '#D4B870',
    atmosphereSize: 1.05,
    tilt: 26.7,
    rings: {
      innerRadius: 5.2,
      outerRadius: 9.5,
      color: '#C8A060',
      opacity: 0.85
    },
    description: 'The jewel of the solar system — adorned with a breathtaking ring system.',
    story: 'Saturn\'s rings span up to 282,000 km in diameter yet are often less than 100 meters thick — proportionally as thin as a sheet of paper scaled to a football field. The rings are composed of billions of ice particles and rocky debris, each piece orbiting Saturn at its own speed.',
    facts: {
      diameter: '116,460 km',
      distanceFromSun: '1.43 billion km',
      orbitalPeriod: '29.5 Earth years',
      gravity: '10.44 m/s²',
      temperature: '-178°C (average)',
      moons: '146 known moons (inc. Titan, Enceladus)',
      funFact: 'Saturn is the least dense planet in the solar system — less dense than water. If you could find a bathtub large enough, Saturn would float.'
    }
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    radius: 2.2,
    orbitRadius: 106,
    orbitSpeed: 0.00068,
    rotationSpeed: 0.007,
    color: '#7FFFD4',
    emissive: '#004040',
    emissiveIntensity: 0.08,
    atmosphereColor: '#40E0D0',
    atmosphereSize: 1.1,
    tilt: 97.8,
    rings: {
      innerRadius: 3.0,
      outerRadius: 4.2,
      color: '#80C0C0',
      opacity: 0.3
    },
    description: 'The tilted giant — rolling through space on its side in a 84-year journey.',
    story: 'Uranus rotates on an axial tilt of 98 degrees — essentially on its side. This extreme tilt means that each pole experiences 42 years of continuous sunlight followed by 42 years of darkness. Scientists believe a massive collision billions of years ago knocked Uranus onto its side.',
    facts: {
      diameter: '50,724 km',
      distanceFromSun: '2.87 billion km',
      orbitalPeriod: '84 Earth years',
      gravity: '8.69 m/s²',
      temperature: '-224°C (cloud tops)',
      moons: '28 known moons (all named after Shakespeare characters)',
      funFact: 'Uranus emits almost no internal heat — unlike the other giant planets. It radiates less energy than it absorbs from the Sun, making it the coldest planetary atmosphere at -224°C.'
    }
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    radius: 2.1,
    orbitRadius: 130,
    orbitSpeed: 0.00054,
    rotationSpeed: 0.007,
    color: '#3F54BA',
    emissive: '#0A0A60',
    emissiveIntensity: 0.1,
    atmosphereColor: '#4060FF',
    atmosphereSize: 1.1,
    tilt: 28.3,
    description: 'The windswept world at the edge of our solar system — a dark, cold, supersonic realm.',
    story: 'Neptune was the first planet predicted by mathematics before it was ever observed. Its Great Dark Spot (a storm the size of Earth) comes and goes, unlike Jupiter\'s permanent Great Red Spot. Winds on Neptune reach 2,100 km/h — the fastest in the solar system.',
    facts: {
      diameter: '49,244 km',
      distanceFromSun: '4.5 billion km',
      orbitalPeriod: '165 Earth years',
      gravity: '11.15 m/s²',
      temperature: '-218°C (average)',
      moons: '16 known moons (inc. Triton)',
      funFact: 'Neptune has only completed one full orbit of the Sun since its discovery in 1846. It takes 165 Earth years to complete a single Neptunian year.'
    }
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'dwarf',
    radius: 0.55,
    orbitRadius: 158,
    orbitSpeed: 0.00040,
    rotationSpeed: 0.001,
    color: '#C4A882',
    emissive: '#2A1A0A',
    emissiveIntensity: 0.03,
    tilt: 122.5,
    description: 'The beloved dwarf planet at the solar system\'s frontier — a world of heart-shaped plains.',
    story: 'When New Horizons flew past Pluto in 2015, it revealed a world of stunning complexity — nitrogen ice plains shaped like a heart (Tombaugh Regio), towering water-ice mountains up to 3,500m high, and a thin nitrogen atmosphere. Despite being reclassified as a dwarf planet in 2006, Pluto remains a world of extraordinary scientific interest.',
    facts: {
      diameter: '2,377 km',
      distanceFromSun: '5.9 billion km (avg)',
      orbitalPeriod: '248 Earth years',
      gravity: '0.62 m/s²',
      temperature: '-230°C (average)',
      moons: '5 (Charon, Nix, Hydra, Kerberos, Styx)',
      funFact: 'Pluto\'s moon Charon is so large relative to Pluto that they form a double dwarf planet system — they orbit a center of gravity that lies between them, in open space.'
    }
  }
];

export const SUN_DATA = PLANET_DATA[0];
