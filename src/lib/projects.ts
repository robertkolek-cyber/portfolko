export interface ProjectSection {
  title: string;
  content: string;
  image?: string;
  layout?:
    | "text"
    | "text-image"
    | "image-text"
    | "full-image"
    | "highlight"
    | "stats"
    | "dark-block"
    | "phones"
    | "wide-photo"
    | "two-column"
    | "hmw";
  highlight?: boolean;
  stats?: { label: string; value: string }[];
  items?: string[];
  phoneScreens?: { title: string; items: string[] }[];
  bgDark?: boolean;
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
          "With growing global efforts to make cars greener, Škoda is actively exploring how to make sustainability feel personal — not just for the planet, but for the driver's wallet too.",
        layout: "dark-block",
        bgDark: true,
      },
      {
        title: "So What's Behind?",
        content: "",
        layout: "two-column",
        items: [
          "Direct — How much money can drivers save by changing the way they drive? The app quantifies fuel savings per ride.",
          "Impact — What's the real environmental benefit? CO2 reduction measured and visualized for every journey.",
        ],
      },
      {
        title: "Incentive Shift",
        content:
          "Shifting from traditional loyalty programs and external rewards to intrinsic motivation. Drivers change behavior not for coupons — but because they see real savings and real environmental impact in numbers they understand.",
        layout: "dark-block",
        bgDark: true,
      },
      {
        title: "This Is a Design Opportunity",
        content:
          "The gap between eco-awareness and actual behavior change is where design makes the biggest difference. People care — they just need the right tools to act on it.",
        layout: "highlight",
        highlight: true,
      },
      {
        title: "How Might We",
        content:
          "How might we create a tool that quantifies the benefits and simplifies the impact of efficient driving — making it feel personal, rewarding, and easy to understand?",
        layout: "hmw",
      },
      {
        title: "Objectives",
        content: "Create a clear, engaging experience that:",
        layout: "two-column",
        items: [
          "Demonstrates real savings through a calculation framework",
          "Gives users personal goals to work toward",
          "Shows real-time impact on wallet and environment",
          "Provides a structured path from understanding to action",
        ],
      },
      {
        title: "Personal Goals — Part's Objectives",
        content:
          "Take, for example, Martin. He'd like to buy a bigger car for his family. Being budget-conscious, the app should serve as a budget advisor — showing how much he could realistically save by driving more efficiently, and tracking his progress over time.",
        layout: "phones",
        phoneScreens: [
          { title: "Set Goal", items: ["Target amount", "Timeline", "Monthly saving target"] },
          { title: "Track", items: ["Current savings", "Progress bar", "Projected date"] },
          { title: "Achieve", items: ["Milestone reached", "Total saved", "Next goal"] },
        ],
      },
      {
        title: "Following the Progress",
        content:
          "The app tracks personal milestones over time — clear progress indicators show how far the driver has come and how close they are to their goals.",
        layout: "phones",
        phoneScreens: [
          { title: "Overview", items: ["Monthly summary", "Savings graph", "CO2 reduced"] },
          { title: "Timeline", items: ["Ride history", "Weekly trends", "Best rides"] },
        ],
      },
      {
        title: "How Does It Make Calculations?",
        content: "",
        layout: "two-column",
        items: [
          "1st phase — the framework: Define the calculation model based on vehicle type, fuel consumption, and driving patterns.",
          "Structure — set parameters: Users input their car details, driving frequency, and fuel costs to personalize the experience.",
          "Result — real numbers: The system compares efficient driving against baseline habits to show exactly where savings come from — per ride and cumulatively.",
        ],
      },
      {
        title: "Analyzing Rides",
        content:
          "Each ride gets a detailed breakdown with efficiency scores, fuel consumption analysis, route evaluation, and comparison against personal averages. Drivers see exactly which habits cost money and which ones save.",
        layout: "phones",
        phoneScreens: [
          { title: "Ride Score", items: ["Efficiency rating", "Speed analysis", "Braking score"] },
          { title: "Breakdown", items: ["Fuel used", "Cost per km", "CO2 output"] },
          { title: "Compare", items: ["vs. Average", "vs. Best ride", "Improvement"] },
        ],
      },
      {
        title: "Tips How to Improve",
        content:
          "Based on ride analysis, the app delivers personalized, actionable tips — optimal speed ranges, braking patterns, route alternatives. Each tip is tied directly to potential savings in euros and CO2.",
        layout: "phones",
        phoneScreens: [
          { title: "Speed", items: ["Optimal range", "Current avg", "Potential saving"] },
          { title: "Routes", items: ["Suggested route", "Distance diff", "Fuel saving"] },
        ],
      },
      {
        title: "Profile",
        content:
          "Everything comes together in the driver's personal dashboard — cumulative savings, environmental impact, driving score history, achievements, and goal progress. One place to see the full picture.",
        layout: "phones",
        phoneScreens: [
          { title: "Dashboard", items: ["Total saved", "CO2 reduced", "Driving score"] },
          { title: "History", items: ["All rides", "Monthly stats", "Achievements"] },
        ],
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
