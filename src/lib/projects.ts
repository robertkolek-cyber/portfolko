export interface ProjectSection {
  title: string;
  content: string;
  image?: string;
  layout?: "text" | "text-image" | "image-text" | "full-image";
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  year: string;
  color: string;
  thumbnail: string;
  heroImage: string;
  overview: string;
  challenge: string;
  approach: string;
  outcome: string;
  tools: string[];
  images: string[];
  sections?: ProjectSection[];
}

export const projects: Project[] = [
  {
    slug: "codebridge-college",
    title: "CodeBridge College",
    tagline: "Reimagining digital banking for a new generation",
    category: "Product Design",
    year: "2025",
    color: "#0040ff",
    thumbnail: "/portfolko/images/projects/codebridge-college.png",
    heroImage: "/portfolko/images/projects/codebridge-college.png",
    overview:
      "Meridian is a next-generation digital banking platform designed for millennials and Gen Z. The goal was to create an experience that feels less like a bank and more like a trusted financial companion.",
    challenge:
      "Traditional banking apps feel cold, transactional, and overwhelming. Young users wanted a platform that understood their financial goals, simplified complex concepts, and celebrated their progress.",
    approach:
      "I led the end-to-end design process — from user research and journey mapping to high-fidelity prototypes. We introduced a conversational UI layer, goal-based savings visualizations, and a warm, approachable visual language.",
    outcome:
      "The redesign led to a 47% increase in daily active users and a 62% improvement in task completion rates. The app received recognition at the European Design Awards.",
    tools: ["Figma", "Protopie", "Maze", "Lottie"],
    images: [],
  },
  {
    slug: "skoda-app",
    title: "Škoda App",
    tagline: "A smarter ride — saving money and the planet",
    category: "Product Design",
    year: "2025",
    color: "#1a3328",
    thumbnail: "/portfolko/images/projects/Slide skoda.png",
    heroImage: "/portfolko/images/projects/Slide skoda.png",
    overview:
      "Škoda is investing in making cars greener for the future. This app is part of that effort — a companion tool that helps drivers save both economically and environmentally by quantifying the real impact of their driving behavior and turning it into direct, personal savings.",
    challenge:
      "Traditional incentive models relied on loyalty programs and discounts — they didn't change how people actually drive. The incentive shift here is from external rewards to intrinsic motivation. The design opportunity: how might we create a tool that quantifies the benefits and simplifies the impact of electric and efficient mobility?",
    approach:
      "Users set personal savings goals — for example, saving enough to buy a bigger car for their family. The app acts as a budget advisor, showing how much they could save by driving more efficiently. It calculates savings using a structured framework: first setting parameters, then tracking CO2 reduction and fuel costs per ride. Each ride is analyzed with efficiency scores, and users get concrete tips on how to improve. A profile view shows cumulative progress toward their personal milestones.",
    outcome:
      "The app follows the user's progress through personal milestones, analyzes individual rides with detailed breakdowns, and provides actionable tips for improvement. It transforms abstract eco-driving concepts into tangible financial numbers that keep drivers motivated and engaged.",
    tools: ["Figma", "Protopie", "After Effects", "Illustrator"],
    images: [],
    sections: [
      {
        title: "The Business Case",
        content:
          "Škoda is actively investing in making cars greener for the future. With growing pressure on sustainability and shifting consumer expectations, there's a real need to connect drivers with the environmental and financial impact of how they drive.",
        layout: "text",
      },
      {
        title: "So What's Behind?",
        content:
          "Two core pillars drive the concept: direct savings — how much money drivers keep by driving efficiently — and impact — the measurable environmental benefit of reduced emissions and fuel consumption.",
        layout: "text",
      },
      {
        title: "Incentive Shift",
        content:
          "Traditional car loyalty programs rely on external rewards like discounts and points. This app shifts the incentive model toward intrinsic motivation — drivers change their behavior not for a coupon, but because they can see exactly how much they're saving and how they're helping the environment.",
        layout: "text",
      },
      {
        title: "This Is a Design Opportunity",
        content:
          "The gap between eco-awareness and actual behavior change is where design can make the biggest difference. Drivers care about the environment, but they need tools that make the abstract tangible.",
        layout: "text",
      },
      {
        title: "How Might We",
        content:
          "How might we create a tool that quantifies the benefits and simplifies the impact of efficient driving — making it feel personal, rewarding, and easy to understand?",
        layout: "text",
      },
      {
        title: "Objectives",
        content:
          "Define a clear savings calculation framework. Give users personal goals to work toward. Demonstrate real-time impact on both their wallet and the environment. Provide a structured path from understanding to action through ride analysis and improvement tips.",
        layout: "text",
      },
      {
        title: "Personal Goals",
        content:
          "Users set their own savings objectives — for example, saving enough to buy a bigger car for their family. The app acts as a budget advisor, showing how much they could realistically save by driving more efficiently. Being budget-conscious, the app should serve as a guide that shows potential savings and tracks progress over time.",
        layout: "text",
      },
      {
        title: "Following the Progress",
        content:
          "The app tracks personal milestones over time, giving users a clear picture of how far they've come and how close they are to reaching their goals. Visual progress indicators keep motivation high.",
        layout: "text",
      },
      {
        title: "How Does It Make Calculations?",
        content:
          "The framework works in phases: first, setting the parameters — vehicle type, driving patterns, fuel costs. Then the structure layer calculates CO2 reduction and cost savings per ride. The system compares efficient driving against baseline habits to show exactly where savings come from.",
        layout: "text",
      },
      {
        title: "Analyzing Rides",
        content:
          "Each ride gets a detailed breakdown — efficiency score, fuel consumption, route analysis, and comparison against the driver's personal average. The ride analysis helps users understand which habits cost them money and which ones save.",
        layout: "text",
      },
      {
        title: "Tips How to Improve",
        content:
          "Based on ride analysis, the app provides actionable, personalized tips — from optimal speed ranges to braking patterns and route suggestions. Tips are concrete and tied directly to potential savings.",
        layout: "text",
      },
      {
        title: "Profile",
        content:
          "The profile brings everything together — cumulative savings, environmental impact, driving score history, and goal progress. It's the driver's personal dashboard for smarter mobility.",
        layout: "text",
      },
    ],
  },
  {
    slug: "sonor-music",
    title: "Sonor",
    tagline: "Where sound meets visual expression",
    category: "Creative Direction",
    year: "2024",
    color: "#1e2a3a",
    thumbnail: "",
    heroImage: "",
    overview:
      "Sonor is an experimental music platform that generates unique visual identities for artists based on their sonic DNA — tempo, mood, instrumentation, and lyrical themes.",
    challenge:
      "Independent musicians struggle to create a cohesive visual brand. Album artwork, social media assets, and promotional materials often feel disconnected from their actual sound.",
    approach:
      "I developed a generative design system that translates audio features into visual parameters — color palettes, typography choices, layout compositions, and motion patterns. Each artist gets a living visual identity that evolves with their music.",
    outcome:
      "Over 5,000 artists generated visual identities in the beta period. The platform was featured in It's Nice That and Communication Arts.",
    tools: ["Figma", "TouchDesigner", "Processing", "Cinema 4D"],
    images: [],
  },
  {
    slug: "atlas-wayfinding",
    title: "Atlas",
    tagline: "Rethinking indoor navigation for complex spaces",
    category: "UX / Spatial Design",
    year: "2024",
    color: "#162029",
    thumbnail: "",
    heroImage: "",
    overview:
      "Atlas is an indoor wayfinding system for hospitals, airports, and large campuses. It combines physical signage design with a digital AR companion app.",
    challenge:
      "Large facilities are stressful to navigate, especially for first-time visitors. Existing wayfinding solutions relied on static maps that didn't account for real-time changes or accessibility needs.",
    approach:
      "I designed a modular signage system with clear typographic hierarchy and integrated QR entry points. The companion app uses AR overlays for step-by-step guidance, with accessibility modes for vision and mobility needs.",
    outcome:
      "Pilot deployment at two major hospitals reduced average wayfinding time by 38% and significantly improved patient satisfaction scores.",
    tools: ["Figma", "Blender", "ARKit", "Illustrator"],
    images: [],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
