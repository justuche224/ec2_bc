import db from "./src/db/index.js";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface CategoryDef {
  code: string;
  name: string;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    code: "EC2.1",
    name: "Tractors & Farm Vehicles",
    description: "New and used tractors, compact tractors, utility tractors, row-crop tractors, articulated tractors, crawler tractors, orchard tractors, two-wheel walking tractors, tractor loaders, farm utility vehicles and tractor attachments."
  },
  {
    code: "EC2.2",
    name: "Harvesting Machinery",
    description: "Combine harvesters, rice harvesters, maize harvesters, potato harvesters, sugarcane harvesters, forage harvesters, cotton pickers, fruit harvesters, root crop harvesters, reapers and threshers."
  },
  {
    code: "EC2.3",
    name: "Land Clearing & Earthmoving Equipment",
    description: "Bulldozers, excavators, backhoe loaders, wheel loaders, skid-steer loaders, motor graders, trenchers, stump grinders, brush cutters, forestry mulchers, agricultural shredders, stump removers and land-clearing attachments."
  },
  {
    code: "EC2.4",
    name: "Soil Preparation & Planting",
    description: "Ploughs, disc harrows, cultivators, rotavators, subsoilers, seed drills, precision planters, transplanters, ridgers, bed formers, fertilizer spreaders, direct seeders and no-till equipment."
  },
  {
    code: "EC2.5",
    name: "Irrigation, Water & Drainage",
    description: "Drip irrigation kits, sprinklers, center-pivot systems, water pumps, solar pumps, borehole pumps, filters, water tanks, irrigation pipes, fertigation systems, drainage pumps, rainwater harvesting equipment and water-treatment systems."
  },
  {
    code: "EC2.6",
    name: "Crop Care & Fertilizer Application",
    description: "Boom sprayers, mist blowers, knapsack sprayers, tractor-mounted sprayers, fertilizer spreaders, manure spreaders, lime spreaders, weed-control machines, mechanical weeders and precision application systems."
  },
  {
    code: "EC2.7",
    name: "Post-Harvest & Grain Handling",
    description: "Grain dryers, maize shellers, threshers, grain cleaners, seed cleaners, elevators, conveyors, silos, grain bins, moisture meters, weighing systems, bagging machines and hermetic storage equipment."
  },
  {
    code: "EC2.8",
    name: "Agricultural Processing & Manufacturing",
    description: "Palm fruit sterilizers, palm oil presses, digesters, clarifiers, nut crackers, cassava graters, cassava presses, garri fryers, rice mills, flour mills, maize mills, oilseed presses, cocoa processing equipment, fruit pulpers, dryers, cold presses and packaging lines."
  },
  {
    code: "EC2.9",
    name: "Livestock & Dairy Equipment",
    description: "Milking machines, milk chillers, pasteurizers, feed mixers, feed grinders, pelletizers, incubators, poultry feeders, drinkers, egg collection systems, manure scrapers, livestock scales and animal handling equipment."
  },
  {
    code: "EC2.10",
    name: "Farm Transport & Logistics",
    description: "Farm trucks, agricultural trailers, grain trailers, tractor trolleys, harvest transporters, forklifts, telehandlers, pallet trucks, refrigerated vehicles, crop conveyors and loading equipment."
  },
  {
    code: "EC2.11",
    name: "Smart Farming & Precision Agriculture",
    description: "Agricultural drones, crop-monitoring sensors, GPS guidance systems, auto-steering equipment, yield monitors, soil testing devices, weather stations, remote irrigation controllers, farm robotics and precision farming software."
  },
  {
    code: "EC2.12",
    name: "Farm Power & Energy Systems",
    description: "Diesel generators, gas generators, electric motors, solar power systems, inverters, batteries, diesel engines, power tiller engines, PTO-driven equipment, biogas systems and agricultural energy storage."
  },
  {
    code: "EC2.13",
    name: "Spare Parts, Tools & Maintenance",
    description: "Tractor tires, tracks, engines, transmissions, hydraulic pumps, hoses, filters, belts, bearings, blades, cutting parts, batteries, lubricants, workshop tools, diagnostic equipment and repair kits."
  },
  {
    code: "EC2.14",
    name: "Greenhouse, Nursery & Controlled Farming",
    description: "Greenhouse structures, hydroponic systems, aeroponic systems, climate controllers, ventilation fans, grow lights, seedling trays, nursery machinery, fertigation units and vertical farming equipment."
  },
  {
    code: "EC2.15",
    name: "Used, Refurbished & Reconditioned Machinery",
    description: "Inspected second-hand tractors, used harvesters, refurbished processing lines, reconditioned engines, used pumps, pre-owned construction equipment and certified refurbished implements."
  }
];

async function main() {
  console.log("=== Migrating Agricultural Machinery Schema ===");

  // 1. Alter product_category
  console.log("Updating product_category table...");
  await db.execute(sql`
    ALTER TABLE product_category ADD COLUMN IF NOT EXISTS code VARCHAR(50);
  `);
  await db.execute(sql`
    ALTER TABLE product_category ADD COLUMN IF NOT EXISTS description TEXT;
  `);

  // 2. Alter product
  console.log("Updating product table...");
  await db.execute(sql`
    ALTER TABLE product ADD COLUMN IF NOT EXISTS make VARCHAR(100);
    ALTER TABLE product ADD COLUMN IF NOT EXISTS model VARCHAR(100);
    ALTER TABLE product ADD COLUMN IF NOT EXISTS year INTEGER;
    ALTER TABLE product ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'BRAND_NEW';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) DEFAULT 'BUY';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'IN_STOCK';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS operating_hours INTEGER;
    ALTER TABLE product ADD COLUMN IF NOT EXISTS engine_hp INTEGER;
    ALTER TABLE product ADD COLUMN IF NOT EXISTS location_country VARCHAR(100);
    ALTER TABLE product ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);
    ALTER TABLE product ADD COLUMN IF NOT EXISTS seller_verification VARCHAR(50) DEFAULT 'VERIFIED_DEALER';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS inspection VARCHAR(50) DEFAULT 'NOT_INSPECTED';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS warranty VARCHAR(100) DEFAULT 'NONE';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS delivery VARCHAR(100) DEFAULT 'BUYER_PICKUP';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;
    ALTER TABLE product ADD COLUMN IF NOT EXISTS specifications TEXT;
    ALTER TABLE product ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
    ALTER TABLE product ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
  `);

  console.log("Database schema successfully upgraded!");

  // 3. Seed / sync categories
  console.log("Seeding / updating EC2 categories...");
  const categoryIdMap = new Map<string, string>();

  for (const cat of CATEGORIES) {
    // Check if category exists by code or name
    const existing = await db.execute(sql`
      SELECT id FROM product_category WHERE code = ${cat.code} OR name = ${cat.name} LIMIT 1;
    `);

    let id: string;
    if (existing.length > 0) {
      id = (existing[0] as any).id;
      await db.execute(sql`
        UPDATE product_category 
        SET code = ${cat.code}, name = ${cat.name}, description = ${cat.description}, updated_at = NOW()
        WHERE id = ${id};
      `);
    } else {
      id = uuidv4();
      await db.execute(sql`
        INSERT INTO product_category (id, code, name, description, created_at, updated_at)
        VALUES (${id}, ${cat.code}, ${cat.name}, ${cat.description}, NOW(), NOW());
      `);
    }
    categoryIdMap.set(cat.code, id);
    console.log(`✓ ${cat.code} - ${cat.name}`);
  }

  // 4. Seed initial rich machinery listings if none exist
  const existingProducts = await db.execute(sql`SELECT COUNT(*) as count FROM product;`);
  const count = Number((existingProducts[0] as any).count);
  console.log(`Current product count: ${count}`);

  if (count === 0) {
    console.log("Seeding sample machinery products...");

    const sampleProducts = [
      {
        categoryCode: "EC2.1",
        name: "John Deere 8R 370 Heavy Row-Crop Tractor",
        make: "John Deere",
        model: "8R 370",
        year: 2024,
        condition: "BRAND_NEW",
        transactionType: "BUY",
        availability: "IN_STOCK",
        price: "345000",
        operatingHours: 12,
        engineHp: 370,
        locationCountry: "Germany",
        locationCity: "Mannheim",
        sellerVerification: "AUTHORIZED_DISTRIBUTOR",
        inspection: "SELLER_INSPECTED",
        warranty: "MANUFACTURER_WARRANTY",
        delivery: "FREIGHT_QUOTE_AVAILABLE",
        featured: true,
        img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop",
        description: "Brand-new John Deere 8R 370 with 9.0L PowerTech engine, e23 transmission, CommandARM cab, dual rear wheels, front 3-point hitch, and integrated AutoTrac guidance system. Full 2-year factory warranty included.",
        specifications: JSON.stringify({
          engine: "9.0L 6-Cylinder Diesel",
          horsepower: "370 HP",
          transmission: "e23 with Efficiency Manager",
          hydraulicFlow: "227 L/min (60 gpm)",
          rearLiftCapacity: "9,072 kg",
          guidance: "Integrated StarFire 6000 AutoTrac"
        })
      },
      {
        categoryCode: "EC2.2",
        name: "CLAAS Lexion 8700 Combine Harvester",
        make: "CLAAS",
        model: "Lexion 8700",
        year: 2022,
        condition: "USED",
        transactionType: "LEASE",
        availability: "IN_STOCK",
        price: "285000",
        operatingHours: 640,
        engineHp: 571,
        locationCountry: "France",
        locationCity: "Reims",
        sellerVerification: "VERIFIED_DEALER",
        inspection: "INDEPENDENTLY_INSPECTED",
        warranty: "DEALER_WARRANTY",
        delivery: "FREIGHT_QUOTE_AVAILABLE",
        featured: true,
        img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
        description: "High-capacity rotary combine harvester. Includes 10.5m Convio draper header, APS Synflow Hybrid threshing system, 15,000L grain tank with 180 L/s discharge rate. Independently inspected with full 640-hr service log.",
        specifications: JSON.stringify({
          engine: "Mercedes-Benz OM473 LA 15.6L",
          horsepower: "571 HP",
          threshing: "APS Synflow Hybrid (450mm drum + twin rotors)",
          grainTank: "15,000 Liters",
          unloadingSpeed: "180 L/sec",
          cuttingWidth: "10.5 meters draper"
        })
      },
      {
        categoryCode: "EC2.3",
        name: "Caterpillar 320 GC Excavator with Forestry Mulcher",
        make: "Caterpillar",
        model: "320 GC",
        year: 2021,
        condition: "REFURBISHED",
        transactionType: "RENT",
        availability: "IN_STOCK",
        price: "178000",
        operatingHours: 1850,
        engineHp: 146,
        locationCountry: "United States",
        locationCity: "San Antonio, TX",
        sellerVerification: "VERIFIED_DEALER",
        inspection: "SELLER_INSPECTED",
        warranty: "LIMITED_WARRANTY",
        delivery: "BUYER_PICKUP",
        featured: true,
        img: "https://images.unsplash.com/photo-1579294800821-694d95e86143?q=80&w=1200&auto=format&fit=crop",
        description: "Certified refurbished Cat 320 GC excavator bundled with high-torque FAE forestry mulching head. Perfect for land clearing, stump grinding, right-of-way maintenance, and dense brush removal. Complete undercarriage inspected at 85%.",
        specifications: JSON.stringify({
          engine: "Cat C4.4 ACERT",
          horsepower: "146 HP",
          operatingWeight: "20,500 kg",
          attachment: "FAE BL2/EX Forestry Mulcher Head",
          hydraulicFlow: "429 L/min auxiliary flow",
          undercarriage: "85% remaining life"
        })
      },
      {
        categoryCode: "EC2.5",
        name: "EcoSolar 15kW Deep Borehole Pump & 50-Hectare Drip Kit",
        make: "EcoHarvest GreenTech",
        model: "SolPump-50H",
        year: 2024,
        condition: "BRAND_NEW",
        transactionType: "BUY",
        availability: "IN_STOCK",
        price: "24500",
        operatingHours: 0,
        engineHp: 20,
        locationCountry: "Kenya",
        locationCity: "Nairobi",
        sellerVerification: "MANUFACTURER",
        inspection: "SELLER_INSPECTED",
        warranty: "MANUFACTURER_WARRANTY",
        delivery: "SELLER_DELIVERY",
        featured: true,
        img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop",
        description: "Off-grid solar irrigation package featuring a 15kW stainless steel submersible pump (head 180m, flow 45m3/hr), MPPT solar inverter controller, 36x 550W Tier-1 bifacial panels, sand media filtration, and pressure-compensating drip tape for 50 hectares.",
        specifications: JSON.stringify({
          solarArray: "19.8 kWp Tier-1 Mono PERC (36x 550W)",
          pumpRating: "15 kW (20 HP) Brushless DC / 3-Phase AC",
          maxHead: "180 meters",
          maxFlowRate: "45 cubic meters/hour",
          coverage: "Up to 50 Hectares (125 Acres) drip irrigated",
          fertigation: "Venturi injector kit included"
        })
      },
      {
        categoryCode: "EC2.8",
        name: "Commercial Palm Oil Extraction & Clarification Plant (3 T/H)",
        make: "AgroEng Global",
        model: "PalmPro 3000",
        year: 2023,
        condition: "BRAND_NEW",
        transactionType: "BUY",
        availability: "AVAILABLE_TO_ORDER",
        price: "92000",
        operatingHours: 0,
        engineHp: 75,
        locationCountry: "Nigeria",
        locationCity: "Benin City",
        sellerVerification: "MANUFACTURER",
        inspection: "SELLER_INSPECTED",
        warranty: "MANUFACTURER_WARRANTY",
        delivery: "FREIGHT_QUOTE_AVAILABLE",
        featured: true,
        img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop",
        description: "Complete palm oil processing plant engineered for high extraction efficiency. Includes horizontal steam sterilizer, rotary drum thresher, vertical digester, twin-screw continuous oil press, vibrating screen, crude oil clarifier, and centrifuge.",
        specifications: JSON.stringify({
          processingCapacity: "3.0 Tons Fresh Fruit Bunches (FFB) per hour",
          oilExtractionRate: "21.5% - 23.5% FFB",
          powerRequirement: "55 kW (75 HP) total electric drive",
          materials: "Food grade SS304 contact parts, heavy steel chassis",
          steamRequirement: "1,200 kg/hr at 3 bar",
          operatorsNeeded: "3 - 4 operators per shift"
        })
      },
      {
        categoryCode: "EC2.11",
        name: "DJI Agras T40 Precision Agricultural Drone Sprayer",
        make: "DJI Agriculture",
        model: "Agras T40",
        year: 2024,
        condition: "BRAND_NEW",
        transactionType: "BUY",
        availability: "IN_STOCK",
        price: "18500",
        operatingHours: 5,
        engineHp: 12,
        locationCountry: "United States",
        locationCity: "Des Moines, IA",
        sellerVerification: "AUTHORIZED_DISTRIBUTOR",
        inspection: "SELLER_INSPECTED",
        warranty: "MANUFACTURER_WARRANTY",
        delivery: "SELLER_DELIVERY",
        featured: true,
        img: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop",
        description: "Equipped with coaxial twin rotor design, 40L spraying tank and 50kg spreading payload. Features Active Phased Array Radar and Binocular Vision for 3D terrain following, dual atomized centrifugal spraying, and centimeter-level RTK positioning.",
        specifications: JSON.stringify({
          sprayPayload: "40 Liters (10.5 gal)",
          spreadPayload: "50 kg (110 lbs)",
          sprayWidth: "11 meters effective swath",
          fieldEfficiency: "21.3 hectares (52.6 acres) per hour",
          radar: "Active Phased Array + Binocular Vision Obstacle Avoidance",
          positioning: "RTK Centimeter Accuracy GPS/Galileo/BDS"
        })
      }
    ];

    for (const prod of sampleProducts) {
      const categoryId = categoryIdMap.get(prod.categoryCode);
      if (!categoryId) continue;

      const prodId = uuidv4();
      await db.execute(sql`
        INSERT INTO product (
          id, name, make, model, year, condition, transaction_type, availability,
          price, operating_hours, engine_hp, location_country, location_city,
          seller_verification, inspection, warranty, delivery, featured,
          img, description, category_id, specifications, status, created_at, updated_at
        ) VALUES (
          ${prodId}, ${prod.name}, ${prod.make}, ${prod.model}, ${prod.year},
          ${prod.condition}, ${prod.transactionType}, ${prod.availability},
          ${prod.price}, ${prod.operatingHours}, ${prod.engineHp},
          ${prod.locationCountry}, ${prod.locationCity}, ${prod.sellerVerification},
          ${prod.inspection}, ${prod.warranty}, ${prod.delivery}, ${prod.featured},
          ${prod.img}, ${prod.description}, ${categoryId}, ${prod.specifications},
          'ACTIVE', NOW(), NOW()
        );
      `);
      console.log(`✓ Added product: ${prod.name}`);
    }
  }

  console.log("=== Migration and Seeding Complete! ===");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
