// lib/demoData.ts

export interface Contestant {
  id: number;
  name: string;
  signatureStyle: string;
  category: "Runway" | "Talent Showcase";
  details: {
    age: number;
    hometown: string;
    talent: string;
    representing: string;
    bio: string;
    achievements: string[];
  };
}

export interface VotingCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const votingCategories: VotingCategory[] = [
  {
    id: "mostTalented",
    name: "Most Talented Contestant",
    description: "Vote for the contestant with the most impressive talent performance",
    icon: "🎭",
  },
  {
    id: "bestSpeaker",
    name: "Best Speaker Round",
    description: "Exceptional eloquence, articulation, and stage presence",
    icon: "🎤",
  },
  {
    id: "bestCultural",
    name: "Best Cultural Representation",
    description: "Outstanding portrayal and celebration of cultural heritage",
    icon: "🌍",
  },
  {
    id: "mostElegant",
    name: "Most Elegant Contestant",
    description: "Grace, poise, and sophisticated style on the runway",
    icon: "👗",
  },
  {
    id: "peoplesChoice",
    name: "People's Choice Award",
    description: "The fan favorite - overall appeal and charisma",
    icon: "❤️",
  },
];

export const contestants: Contestant[] = [
  {
    id: 1,
    name: "Ariana Sol",
    signatureStyle: "Pearl Couture",
    category: "Runway",
    details: {
      age: 24,
      hometown: "Cebu City",
      talent: "Interpretive Dance",
      representing: "Visayas Region",
      bio: "Ariana is a professional dancer and fashion model with 8 years of experience. She draws inspiration from the ocean and incorporates fluid movements into her routines.",
      achievements: [
        "Miss Cebu Tourism 2022",
        "Best in Evening Gown - National Pageant 2023",
        "Dance Competition Gold Medalist",
      ],
    },
  },
  {
    id: 2,
    name: "Bianca Vale",
    signatureStyle: "Modern Glam",
    category: "Runway",
    details: {
      age: 26,
      hometown: "Makati City",
      talent: "Classical Piano",
      representing: "Metro Manila",
      bio: "A classically trained pianist who transitioned into pageantry. Bianca believes in empowering women through arts and education.",
      achievements: [
        "Young Artist Scholarship Recipient",
        "Top 5 - National Music Competition",
        "Miss Makati 2021",
      ],
    },
  },
  {
    id: 3,
    name: "Celeste Marin",
    signatureStyle: "Silk Eveningwear",
    category: "Runway",
    details: {
      age: 23,
      hometown: "Davao City",
      talent: "Flamenco Dance",
      representing: "Mindanao Region",
      bio: "Celeste brings the fiery spirit of flamenco to the stage. She has trained in Spain and now promotes cultural exchange through performance.",
      achievements: [
        "International Flamenco Festival Performer",
        "Best Talent Award - Regional Pageant",
        "Cultural Ambassador of Davao",
      ],
    },
  },
  {
    id: 4,
    name: "Sofia Reyes",
    signatureStyle: "Latin Dance Fusion",
    category: "Talent Showcase",
    details: {
      age: 25,
      hometown: "Iloilo City",
      talent: "Latin Ballroom Dancing",
      representing: "Western Visayas",
      bio: "Sofia is a 5-time Latin dance champion who combines traditional ballroom with modern hip-hop elements.",
      achievements: [
        "National DanceSport Champion 2023",
        "Best in Talent - Miss Iloilo",
        "Choreographer of the Year Nominee",
      ],
    },
  },
  {
    id: 5,
    name: "Camila Mendez",
    signatureStyle: "Vocal Powerhouse",
    category: "Talent Showcase",
    details: {
      age: 22,
      hometown: "Baguio City",
      talent: "Operatic Singing",
      representing: "Cordillera Region",
      bio: "With a three-octave range, Camila has performed in various cultural festivals across the country. She aims to inspire young artists.",
      achievements: [
        "Grand Champion - Voice of the Mountains",
        "Best Vocal Performance - National Arts Awards",
        "Guest Soloist with Philippine Philharmonic",
      ],
    },
  },
  {
    id: 6,
    name: "Aisha Patel",
    signatureStyle: "Contemporary Fusion",
    category: "Talent Showcase",
    details: {
      age: 27,
      hometown: "Quezon City",
      talent: "Multimedia Art & Poetry",
      representing: "National Capital Region",
      bio: "Aisha is a visual artist and spoken word poet who creates immersive experiences. Her talent piece combines live painting with spoken word.",
      achievements: [
        "Young Artist Grant Recipient",
        "Spoken Word Champion - Cultural Fest 2026",
        "Art Exhibit at Ayala Museum",
      ],
    },
  },
  {
    id: 7,
    name: "Marcus Tan",
    signatureStyle: "Urban Elegance",
    category: "Runway",
    details: {
      age: 28,
      hometown: "Cagayan de Oro",
      talent: "Street Dance Choreography",
      representing: "Northern Mindanao",
      bio: "Marcus brings a fresh urban perspective to the runway. He has choreographed for major fashion weeks and believes fashion is for everyone.",
      achievements: [
        "Best Male Model - Fashion Guild Awards",
        "Choreographer - Manila Fashion Festival",
        "Dance Crew World Championship Finalist",
      ],
    },
  },
  {
    id: 8,
    name: "Isabella Cruz",
    signatureStyle: "Timeless Classics",
    category: "Runway",
    details: {
      age: 24,
      hometown: "Batangas City",
      talent: "Ballroom Dancing",
      representing: "Calabarzon",
      bio: "Isabella combines vintage glamour with modern sensibility. Her signature is the waltz, which she performs with unparalleled grace.",
      achievements: [
        "Miss Batangas 2023",
        "Best in Swimsuit - National Pageant",
        "Ballroom Competition Silver Medalist",
      ],
    },
  },
];