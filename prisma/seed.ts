/**
 * EcoSpark Hub — Database Seed
 *
 * Populates the database with realistic demo data including:
 * - 1 admin user  +  4 member users
 * - 8 sustainability categories
 * - 22 ideas total: 20 approved (incl. 2 paid), 1 under review, 1 draft
 * - Unsplash image URLs on ideas
 * - Votes and comments on several ideas
 *
 * Run with:  npm run db:seed
 *
 * NOTE: This seed uses better-auth's built-in password hashing through
 * the database adapter.  Because we can't call auth.api.signUp() in a
 * script context without an HTTP request, passwords are stored as
 * plain-text ONLY for seed purposes (dev environment).
 * Replace with hashed passwords for staging/production seeds.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Unsplash image helpers – using static Unsplash source URLs.
// These are direct image URLs that do NOT require an Unsplash API key.
// ---------------------------------------------------------------------------
const UNSPLASH = {
  solar: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  wind: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80",
  compost: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80",
  recycling: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80",
  ev: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  cycling: "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=800&q=80",
  water: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80",
  rain: "https://images.unsplash.com/photo-1518017238787-cfe21c7aad17?w=800&q=80",
  farm: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
  forest: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
  city: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
  ocean: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80",
  plant: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80",
  lab: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
  bee: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  panel: "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=800&q=80",
};

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱 Starting seed...\n");

  // ── 1. Categories ──────────────────────────────────────────────────────────
  const categoryNames = [
    "Energy",
    "Waste Management",
    "Transportation",
    "Water Conservation",
    "Agriculture",
    "Urban Planning",
    "Marine & Ocean",
    "Biodiversity",
  ];

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  console.log(`✅ Created ${categories.length} categories`);

  // ── 2. Users ───────────────────────────────────────────────────────────────
  // We create auth Account rows manually so passwords work with better-auth.
  // For demo purposes we store fixed bcrypt hashes (generated offline).
  // In production, always use auth.api.signUp().
  const ADMIN_PASSWORD_HASH =
    "$2b$10$Pso09kuEh8gYKWNkhdzpgOr9WZOTIsQmcaqIr47EOxWeXGbvWrwXC"; // Admin123
  const SAMIUL_PASSWORD_HASH =
    "$2b$10$QR0q0XnXfKm1JRzL18GQA..GKmfXB/OtxtvXYF8bnt1g46MD5M/jO"; // Samiul123
  const DEMO_PASSWORD_HASH =
    "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.ZYPJMr/6Qj1kFsB2.8o9GgDVHOEoT9q"; // Password123!

  const usersData = [
    { name: "Admin", email: "admin@admin.com", role: "ADMIN" as const },
    { name: "Samiul", email: "samiul@gmail.com", role: "MEMBER" as const },
    { name: "James Okafor", email: "james@example.com", role: "MEMBER" as const },
    { name: "Sofia Müller", email: "sofia@example.com", role: "MEMBER" as const },
    { name: "Liam Chen", email: "liam@example.com", role: "MEMBER" as const },
  ];

  const users = await Promise.all(
    usersData.map(async (u) => {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: `seed-user-${u.email.split("@")[0]}`,
          name: u.name,
          email: u.email,
          emailVerified: true,
          role: u.role,
          isActive: true,
        },
      });

      const passwordHash =
        u.role === "ADMIN"
          ? ADMIN_PASSWORD_HASH
          : u.email === "samiul@gmail.com"
            ? SAMIUL_PASSWORD_HASH
            : DEMO_PASSWORD_HASH;

      // Create a password-based account for better-auth
      await prisma.account.upsert({
        where: {
          // Use a synthetic unique lookup (accountId + providerId)
          // better-auth stores local accounts with providerId = "credential"
          id: `seed-account-${user.id}`,
        },
        update: {},
        create: {
          id: `seed-account-${user.id}`,
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return user;
    })
  );

  const admin = users[0];
  const [, samiul, james, sofia, liam] = users;
  console.log(`✅ Created ${users.length} users (admin + 4 members)`);

  // ── 3. Ideas ───────────────────────────────────────────────────────────────
  const ideasData = [
    // APPROVED – Free
    {
      title: "Community Solar Micro-Grids for Rural Villages",
      problemStatement:
        "Millions of rural households lack reliable electricity, forcing them to depend on expensive and polluting diesel generators.",
      proposedSolution:
        "Deploy modular solar micro-grids owned cooperatively by villages, with revenues reinvested into local infrastructure.",
      description:
        "This initiative proposes a scalable model for community-owned solar micro-grids. Each installation serves 50–200 households and is financed through a blend of micro-loans and government subsidies. Excess energy is sold back to the national grid, creating a revenue stream for the cooperative.",
      images: [UNSPLASH.solar, UNSPLASH.panel],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: samiul.id,
      categoryId: catMap["Energy"],
    },
    {
      title: "Smart Composting Bins for Urban Apartments",
      problemStatement:
        "Urban residents generate large volumes of food waste but lack space or infrastructure for composting.",
      proposedSolution:
        "Compact IoT-enabled composting bins that fit under kitchen counters, paired with a pickup service for finished compost distributed to city parks.",
      description:
        "The bins use sensor-driven aeration and moisture control to accelerate decomposition to under two weeks. A companion app guides residents, tracks their waste diversion, and gamifies sustainability milestones. The finished compost enriches city green spaces.",
      images: [UNSPLASH.compost, UNSPLASH.plant],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: james.id,
      categoryId: catMap["Waste Management"],
    },
    {
      title: "Electric Cargo-Bike Delivery Network",
      problemStatement:
        "Last-mile urban delivery accounts for a disproportionate share of city emissions and traffic congestion.",
      proposedSolution:
        "A franchise network of electric cargo-bikes replacing diesel vans for deliveries under 5 km, supported by neighbourhood hub warehouses.",
      description:
        "Cargo e-bikes can carry up to 150 kg and navigate cycle lanes that are closed to motor vehicles. The hub-and-spoke model cuts delivery costs by 30% and eliminates tailpipe emissions entirely for the last mile. The franchise model creates green jobs for local riders.",
      images: [UNSPLASH.cycling, UNSPLASH.ev],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: sofia.id,
      categoryId: catMap["Transportation"],
    },
    {
      title: "Greywater Recycling for High-Rise Buildings",
      problemStatement:
        "High-rise buildings flush millions of litres of lightly-used greywater (sinks, showers) into sewers, while simultaneously drawing fresh water for toilet flushing and irrigation.",
      proposedSolution:
        "Retrofit building plumbing to capture, filter, and re-use greywater on-site, cutting potable water consumption by up to 40%.",
      description:
        "The system uses a multi-stage biofilm reactor housed in the building's basement. Treated greywater is stored in a dedicated cistern and pumped to toilet cisterns and rooftop gardens. The payback period is typically 6–8 years through water-bill savings alone.",
      images: [UNSPLASH.water, UNSPLASH.rain],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: liam.id,
      categoryId: catMap["Water Conservation"],
    },
    {
      title: "Agroforestry Integration in Mono-Culture Farms",
      problemStatement:
        "Industrial mono-culture farming depletes soils, reduces biodiversity, and contributes to carbon emissions through land clearing.",
      proposedSolution:
        "Incentive programmes that help farmers integrate native tree corridors and polyculture strips into existing cropland.",
      description:
        "Agroforestry delivers multiple co-benefits: carbon sequestration, improved soil water retention, habitat for pollinators, and diversified farm income through timber and fruit harvests. Satellite monitoring and carbon credits provide ongoing financial incentives.",
      images: [UNSPLASH.farm, UNSPLASH.forest],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: samiul.id,
      categoryId: catMap["Agriculture"],
    },
    {
      title: "Sponge-City Infrastructure for Flood Resilience",
      problemStatement:
        "Rapidly urbanised cities face worsening flash floods as impermeable surfaces prevent rain infiltration, overwhelming drainage systems.",
      proposedSolution:
        "Redesign urban districts using permeable pavements, bioswales, retention ponds, and green roofs to absorb rainfall naturally.",
      description:
        "Sponge-city design mimics natural watershed behaviour. Permeable paving can absorb up to 200 litres of water per square metre per hour. Combined with strategically placed wetland parks, cities can manage 100-year flood events without pipe upgrades, reducing infrastructure costs significantly.",
      images: [UNSPLASH.city, UNSPLASH.rain],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: james.id,
      categoryId: catMap["Urban Planning"],
    },
    {
      title: "Ocean Plastic Interception at River Mouths",
      problemStatement:
        "80% of ocean plastic enters from rivers, yet most clean-up efforts target open water where plastic has already fragmented into microplastics.",
      proposedSolution:
        "Deploy passive floating barriers at the 1,000 most polluted river mouths to intercept plastic before it reaches the sea.",
      description:
        "River-mouth barriers use current energy to funnel floating debris into collection bays. Solar-powered conveyor systems lift captured plastic for sorting and recycling. Early pilots show capture rates of 60–80% of surface plastic. This approach is vastly more cost-effective than ocean clean-up.",
      images: [UNSPLASH.ocean, UNSPLASH.water],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: sofia.id,
      categoryId: catMap["Marine & Ocean"],
    },
    {
      title: "Urban Bee Highways for Pollinator Recovery",
      problemStatement:
        "Pollinator populations have declined by over 40% in two decades due to habitat loss, pesticide use, and monoculture landscapes.",
      proposedSolution:
        "Connect isolated green spaces with continuous flowering corridors—'bee highways'—planted on rooftops, road medians, and vacant lots.",
      description:
        "A bee highway is a network of continuous habitat that allows pollinators to travel safely across urban environments. Each corridor is planted with native flowering species timed to provide year-round forage. Local communities adopt and maintain sections, fostering civic engagement alongside biodiversity recovery.",
      images: [UNSPLASH.bee, UNSPLASH.plant],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: liam.id,
      categoryId: catMap["Biodiversity"],
    },
    // APPROVED – Paid
    {
      title: "Wind-Powered Desalination for Coastal Communities",
      problemStatement:
        "Coastal communities in arid regions face simultaneous freshwater scarcity and strong maritime winds — a renewable resource sitting untapped.",
      proposedSolution:
        "Purpose-built small-scale wind turbines directly coupled to reverse-osmosis desalination units, eliminating the need for grid electricity.",
      description:
        "This detailed technical blueprint covers turbine sizing, membrane selection, brine disposal, and community ownership models. Based on successful pilots in Chile and Morocco, the system can produce 5,000–20,000 litres of fresh water per day at a levelised cost competitive with trucked water. Full engineering schematics included.",
      images: [UNSPLASH.wind, UNSPLASH.ocean],
      isPaid: true,
      price: 12.99,
      status: "APPROVED" as const,
      authorId: samiul.id,
      categoryId: catMap["Water Conservation"],
    },
    {
      title: "Precision Fermentation for Lab-Grown Fertilisers",
      problemStatement:
        "Synthetic nitrogen fertilisers consume 1–2% of global energy and are responsible for significant nitrous-oxide emissions, yet agriculture cannot yet function without them.",
      proposedSolution:
        "Use precision fermentation to engineer microbial strains that fix atmospheric nitrogen directly in the root zone, replacing synthetic inputs.",
      description:
        "A comprehensive research report covering microbial nitrogen fixation pathways, genetic engineering approaches, regulatory landscape, commercial scale-up economics, and case studies from early-stage start-ups. Includes a 10-year market opportunity model and investment thesis for agri-biotech ventures.",
      images: [UNSPLASH.lab, UNSPLASH.farm],
      isPaid: true,
      price: 24.99,
      status: "APPROVED" as const,
      authorId: james.id,
      categoryId: catMap["Agriculture"],
    },
    // UNDER REVIEW
    {
      title: "Floating Solar Farms on Reservoirs",
      problemStatement:
        "Land is scarce and expensive for large-scale solar installations, while millions of square kilometres of reservoir surfaces sit idle.",
      proposedSolution:
        "Deploy floating photovoltaic (FPV) panels on existing reservoirs, simultaneously generating clean energy and reducing evaporation.",
      description:
        "Floating solar panels reduce water evaporation by up to 70%, making them uniquely valuable in water-stressed regions. The water also cools the panels, boosting efficiency by 10–15% compared to land-mounted arrays. This idea outlines a partnership model with water utilities and grid operators.",
      images: [UNSPLASH.solar, UNSPLASH.water],
      isPaid: false,
      status: "UNDER_REVIEW" as const,
      authorId: sofia.id,
      categoryId: catMap["Energy"],
    },
    // DRAFT
    {
      title: "Mycoremediation Kits for Contaminated Urban Soils",
      problemStatement:
        "Many urban brownfield sites contain persistent pollutants (heavy metals, hydrocarbons) that make redevelopment costly and slow.",
      proposedSolution:
        "Distribute low-cost mycoremediation starter kits containing fungi species proven to break down specific contaminants, enabling community-led site remediation.",
      description:
        "Certain fungal species (oyster mushrooms, Trametes versicolor) have demonstrated ability to degrade petroleum hydrocarbons and sequester heavy metals. A citizen-science kit would include fungal spawn, monitoring strips, and a reporting app. Successful pilots could unlock redevelopment funding.",
      images: [UNSPLASH.forest, UNSPLASH.lab],
      isPaid: false,
      status: "DRAFT" as const,
      authorId: liam.id,
      categoryId: catMap["Urban Planning"],
    },
    // ── 10 additional APPROVED ideas (EcoSpark demo) ─────────────────────────
    {
      title: "Regenerative Grazing on Marginal Grasslands",
      problemStatement:
        "Overgrazed marginal lands lose topsoil and store less carbon, while livestock farmers face pressure to reduce emissions without losing livelihoods.",
      proposedSolution:
        "Rotate cattle through small paddocks with long rest periods so grasses recover deeply, rebuild soil organic matter, and sequester carbon while improving carrying capacity.",
      description:
        "Regenerative grazing mimics herd movement on natural savannas. Farmers track forage height with simple apps and move fences every few days. Pilot programmes show 20–35% more grass biomass within three years and measurable soil carbon gains. Extension officers train cohorts regionally.",
      images: [UNSPLASH.farm, UNSPLASH.forest],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: samiul.id,
      categoryId: catMap["Agriculture"],
    },
    {
      title: "Vertical Farming Inside Refurbished Containers",
      problemStatement:
        "Cities import leafy greens from distant farms, wasting water and fuel, while vacant industrial lots sit unused near consumers.",
      proposedSolution:
        "Stack hydroponic growing systems inside insulated shipping containers with LED spectra tuned per crop, placed on under-used urban plots.",
      description:
        "Each container produces roughly 400–600 heads of lettuce per month year-round. Solar panels on the roof offset grid draw. Operators sell via subscription boxes and restaurants within a 5 km radius, cutting food miles dramatically. Used containers are cheaper than new greenhouse steel.",
      images: [UNSPLASH.plant, UNSPLASH.city],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: james.id,
      categoryId: catMap["Urban Planning"],
    },
    {
      title: "Carbon-Storing Additives for Ordinary Concrete",
      problemStatement:
        "Cement production alone accounts for roughly 8% of global CO₂ emissions, yet demand for concrete keeps rising for housing and infrastructure.",
      proposedSolution:
        "Blend finely ground olivine or biochar-based pozzolans into standard mixes to chemically lock CO₂ while meeting structural codes.",
      description:
        "Carbon mineralisation in concrete is an active research field. This proposal focuses on additives that can be batched at existing ready-mix plants with minimal retooling. Life-cycle analysis shows 15–25% embodied carbon reduction when paired with lower-clinker cement. Pilot slabs are monitored for strength and durability.",
      images: [UNSPLASH.city, UNSPLASH.panel],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: sofia.id,
      categoryId: catMap["Energy"],
    },
    {
      title: "Battery Swapping Hubs for Electric Two-Wheelers",
      problemStatement:
        "Delivery riders and commuters hesitate to buy electric scooters because charging takes hours and battery degradation is opaque.",
      proposedSolution:
        "Deploy neighbourhood swap cabinets where users exchange a depleted pack for a charged one in under a minute, paying per kilometre.",
      description:
        "Standardised battery form factors and IoT state-of-health tracking make swaps safe. The network operator owns the batteries, lowering upfront vehicle cost. Cities grant curb space for hubs near transit. Data helps plan grid upgrades and incentives for night-time charging on renewables.",
      images: [UNSPLASH.ev, UNSPLASH.cycling],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: liam.id,
      categoryId: catMap["Transportation"],
    },
    {
      title: "Biogas Digesters at Wholesale Food Markets",
      problemStatement:
        "Wholesale markets discard tonnes of organic waste daily, creating methane in landfills and odour complaints in dense districts.",
      proposedSolution:
        "Install medium-scale anaerobic digesters on-site to turn trimmings and spoiled produce into biogas for cooking stalls and electricity.",
      description:
        "Digestate becomes compost for nearby urban farms. Vendors pay a small tipping fee instead of hauling waste. A 2 MW equivalent cluster can serve a market serving 50,000 people. Carbon credits and reduced grid purchases improve payback to under seven years.",
      images: [UNSPLASH.compost, UNSPLASH.farm],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: samiul.id,
      categoryId: catMap["Waste Management"],
    },
    {
      title: "Green Roof Grants for Chain Store Rooftops",
      problemStatement:
        "Big-box retail roofs are vast, heat-absorbing, and rarely used, worsening urban heat islands and stormwater runoff.",
      proposedSolution:
        "Public–private grants covering 40% of installation cost if retailers commit to native plant mixes and public stormwater reporting.",
      description:
        "Aggregating hundreds of hectares of green roofs measurably lowers peak summer temperatures and delays sewer overflows. Chains gain branding and lower HVAC bills. Municipalities use satellite and drone surveys to verify green cover and tie incentives to biodiversity scores.",
      images: [UNSPLASH.city, UNSPLASH.plant],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: james.id,
      categoryId: catMap["Urban Planning"],
    },
    {
      title: "Low-Tech Coral Nursery Frames for Reef Edges",
      problemStatement:
        "Coral reefs bleach faster than large-scale tourism projects can fund high-tech restoration, especially in remote islands.",
      proposedSolution:
        "Train coastal communities to weld rebar and limestone frames that stabilise rubble fields so naturally spawned larvae can settle.",
      description:
        "Unlike expensive offshore nurseries, these frames cost little and use local materials. Combined with temporary algae removal and no-take zones, recovery rates improve within two spawning seasons. Monitoring uses snorkel surveys and phone photos to keep science participatory.",
      images: [UNSPLASH.ocean, UNSPLASH.water],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: sofia.id,
      categoryId: catMap["Marine & Ocean"],
    },
    {
      title: "Wildflower Strips Along Highway Exits",
      problemStatement:
        "Mown highway verges are ecological deserts that offer no food for pollinators and require costly repeated mowing.",
      proposedSolution:
        "Replace 30% of verge length with native wildflower seed mixes cut only once per year after seed drop.",
      description:
        "Departments of transport save fuel on mowing while supporting bees and butterflies. Crash sightlines are preserved in safety zones. Partnerships with seed cooperatives keep costs low. Public awareness signs explain the programme to reduce complaints about ‘untidy’ roadsides.",
      images: [UNSPLASH.bee, UNSPLASH.forest],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: liam.id,
      categoryId: catMap["Biodiversity"],
    },
    {
      title: "Bulk Refill Kiosks at Major Transit Hubs",
      problemStatement:
        "Commuters buy single-use plastic bottles because refill options are absent where they transfer between trains and buses.",
      proposedSolution:
        "Install filtered-water and detergent refill kiosks in station concourses, priced below bottled water to drive adoption.",
      description:
        "Operators partner with ethical household brands for gravity-fed bulk liquids (soap, shampoo). RFID bottles link to loyalty discounts. Foot traffic data from transit authorities picks kiosk sites. Plastic bottle sales in pilot stations dropped 18% in the first year.",
      images: [UNSPLASH.water, UNSPLASH.recycling],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: samiul.id,
      categoryId: catMap["Water Conservation"],
    },
    {
      title: "Small Tidal Lagoons for Island Micro-Grids",
      problemStatement:
        "Remote islands burn imported diesel for electricity at high cost and emissions despite having strong tidal resources.",
      proposedSolution:
        "Build modest impoundment lagoons with one-way turbines that generate on both flood and ebb tides, sized for village-scale demand.",
      description:
        "Unlike massive barrages, lagoon schemes disturb less habitat and can be phased. Combined with battery storage and rooftop solar, islands achieve 70%+ renewable share. Economic modelling uses local wage rates and shipping costs for diesel to show favourable levelised cost after year twelve.",
      images: [UNSPLASH.ocean, UNSPLASH.wind],
      isPaid: false,
      status: "APPROVED" as const,
      authorId: james.id,
      categoryId: catMap["Energy"],
    },
  ];

  const ideas = await Promise.all(
    ideasData.map((d) =>
      prisma.idea.upsert({
        where: { id: `seed-idea-${d.title.substring(0, 20).replace(/\s+/g, "-").toLowerCase()}` },
        update: {},
        create: {
          id: `seed-idea-${d.title.substring(0, 20).replace(/\s+/g, "-").toLowerCase()}`,
          title: d.title,
          problemStatement: d.problemStatement,
          proposedSolution: d.proposedSolution,
          description: d.description,
          images: d.images,
          isPaid: d.isPaid,
          price: "price" in d ? d.price : null,
          status: d.status,
          authorId: d.authorId,
          categoryId: d.categoryId,
        },
      })
    )
  );

  console.log(`✅ Created ${ideas.length} ideas`);

  // ── 4. Votes ───────────────────────────────────────────────────────────────
  const approvedIdeas = ideas.filter((i) => i.status === "APPROVED");
  const voters = [samiul, james, sofia, liam, admin];
  const voteTypes = ["UPVOTE", "UPVOTE", "UPVOTE", "DOWNVOTE", "UPVOTE"] as const;

  let voteCount = 0;
  for (const idea of approvedIdeas.slice(0, 6)) {
    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      if (voter.id === idea.authorId) continue; // don't vote on own idea
      try {
        await prisma.vote.upsert({
          where: { userId_ideaId: { userId: voter.id, ideaId: idea.id } },
          update: {},
          create: { type: voteTypes[i % voteTypes.length], userId: voter.id, ideaId: idea.id },
        });
        voteCount++;
      } catch {
        // skip duplicate
      }
    }
  }
  console.log(`✅ Created ${voteCount} votes`);

  // ── 5. Comments ────────────────────────────────────────────────────────────
  const commentData = [
    {
      ideaId: approvedIdeas[0].id,
      authorId: james.id,
      content: "Fantastic idea! We tried a smaller version of this in rural Bangladesh and it worked brilliantly. The cooperative ownership model is key to long-term sustainability.",
    },
    {
      ideaId: approvedIdeas[0].id,
      authorId: liam.id,
      content: "How do you handle maintenance and technical support in areas with limited expertise? That's usually the bottleneck for rural energy projects.",
    },
    {
      ideaId: approvedIdeas[1].id,
      authorId: sofia.id,
      content: "Love the gamification angle. Apps like this really do nudge behaviour change. Would be great if the compost data fed back into local food-growing initiatives too.",
    },
    {
      ideaId: approvedIdeas[2].id,
      authorId: admin.id,
      content: "The e-cargo-bike space is exploding right now. Companies like Zedify and Pedal Me are proving the model in London. The hub-and-spoke model seems the right approach for density.",
    },
    {
      ideaId: approvedIdeas[3].id,
      authorId: samiul.id,
      content: "Greywater recycling is hugely underrated. In Singapore they've been doing this for decades. The biggest barrier in most cities is retrofitting costs and plumbing code resistance.",
    },
    {
      ideaId: approvedIdeas[4].id,
      authorId: james.id,
      content: "Agroforestry data from the World Agroforestry Centre is incredibly compelling. Farms integrating trees see 20–40% better water retention. This deserves serious policy support.",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentModel = (prisma as any).comment;
  let commentCount = 0;
  for (const c of commentData) {
    try {
      await commentModel.upsert({
        where: { id: `seed-comment-${c.authorId}-${c.ideaId}` },
        update: {},
        create: {
          id: `seed-comment-${c.authorId}-${c.ideaId}`,
          content: c.content,
          authorId: c.authorId,
          ideaId: c.ideaId,
        },
      });
      commentCount++;
    } catch {
      // skip
    }
  }
  console.log(`✅ Created ${commentCount} comments`);

  // ── 6. Newsletter subscribers ──────────────────────────────────────────────
  const newsletters = ["newsletter@ecospark.dev", "sustainability-news@example.com"];
  await prisma.newsletterSubscriber.createMany({
    data: newsletters.map((email) => ({ email })),
    skipDuplicates: true,
  });
  console.log(`✅ Created ${newsletters.length} newsletter subscribers`);

  console.log("\n🎉 Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Admin  : admin@admin.com  /  Admin123");
  console.log("  Member : samiul@gmail.com  /  Samiul123");
  console.log("  Members (Password123!):");
  console.log("  Member: james@example.com");
  console.log("  Member: sofia@example.com");
  console.log("  Member: liam@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
