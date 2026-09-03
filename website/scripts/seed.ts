import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSeed() {
  console.log("Starting seed process...");
  
  // Note: auth.users creation using Supabase Admin API is complex and usually requires
  // creating the users through the auth endpoints or directly inserting into auth.users.
  // For the demo, we will insert them directly into auth.users if possible, but 
  // typical setups require calling supabase.auth.admin.createUser().
  
  // Let's create the users via Admin API
  console.log("Creating demo users...");
  
  const users = [
    { email: 'officer1@demo-ddma.gov.in', password: 'Officer@Demo123', name: 'R. Sharma', role: 'officer' },
    { email: 'officer2@demo-sdma.gov.in', password: 'Officer@Demo123', name: 'A. Patel', role: 'officer' },
    { email: 'public1@example.com', password: 'Public@Demo123', name: 'Jane Doe', role: 'public' },
    { email: 'public2@example.com', password: 'Public@Demo123', name: 'John Smith', role: 'public' },
    { email: 'developer@example.com', password: 'Dev@Demo123', name: 'Dev Admin', role: 'developer' }
  ];

  const createdUsers = [];

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      console.log(`User ${user.email} might already exist or error:`, error.message);
      // Try to get user if already exists
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', user.email).single();
      if (existingUser) {
        createdUsers.push({ ...user, id: existingUser.id });
      }
    } else if (data.user) {
      // Upsert into our public.users table
      await supabase.from('users').upsert({
        id: data.user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: true,
        is_demo: true,
        password_hash: 'managed_by_supabase_auth' // We don't need real hash since we use Supabase Auth
      });
      createdUsers.push({ ...user, id: data.user.id });
    }
  }

  console.log(`Created/verified ${createdUsers.length} users.`);

  const officer1 = createdUsers.find(u => u.email === 'officer1@demo-ddma.gov.in')?.id;

  // Insert mock Grid Cells
  console.log("Seeding grid cells...");
  // Use the logic from generateRiskGrid in demo data...
  const mockGrid = [];
  let seed = 12345;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const BASE_LAT = 27.3314; const BASE_LON = 88.6138;
  const categories = ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"];
  
  for (let i = 0; i < 50; i++) { // Reduced count for speed during seed
    const lat = BASE_LAT + (rand() - 0.5) * 0.2;
    const lon = BASE_LON + (rand() - 0.5) * 0.2;
    const size = 0.005;
    const coords = [[ [lon - size/2, lat - size/2], [lon + size/2, lat - size/2], [lon + size/2, lat + size/2], [lon - size/2, lat + size/2], [lon - size/2, lat - size/2] ]];
    
    const riskVal = rand();
    let catIndex = 0;
    if (riskVal > 0.4) catIndex = 1;
    if (riskVal > 0.7) catIndex = 2;
    if (riskVal > 0.85) catIndex = 3;
    if (riskVal > 0.95) catIndex = 4;
    const riskScore = Math.floor(riskVal * 100);

    mockGrid.push({
      id: `ES-${(i + 1000).toString().substring(0, 4)}`,
      geometry: { type: "Polygon", coordinates: coords },
      risk_score: i === 0 ? 25 : riskScore,
      risk_category: i === 0 ? "LOW" : categories[catIndex],
      model_estimate: i === 0 ? 0.25 : Number((riskVal).toFixed(2)),
      rainfall_24h: Math.floor(rand() * 150),
      rainfall_72h: Math.floor(rand() * 300),
      rainfall_7d: Math.floor(rand() * 500),
      slope: Math.floor(10 + rand() * 40),
      elevation: Math.floor(1000 + rand() * 2000),
      aspect: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(rand() * 8)],
      susceptibility: "MODERATE",
      land_cover: "Forest",
      confidence: "HIGH",
      is_demo: true
    });
  }

  const { error: gridErr } = await supabase.from('grid_cells').upsert(mockGrid);
  if (gridErr) console.error("Grid Error:", gridErr);

  // Insert Villages
  console.log("Seeding villages...");
  const villages = [
    { id: "V-1", name: "Gangtok", lat: BASE_LAT, lon: BASE_LON, risk_score: 75, priority: "MONITOR", is_demo: true },
    { id: "V-2", name: "Singtam", lat: BASE_LAT - 0.05, lon: BASE_LON - 0.02, risk_score: 88, priority: "PRIORITY_INSPECTION", is_demo: true },
    { id: "V-3", name: "Rangpo", lat: BASE_LAT - 0.1, lon: BASE_LON - 0.05, risk_score: 45, priority: "ROUTINE", is_demo: true }
  ];
  await supabase.from('villages').upsert(villages);

  // Insert Roads
  console.log("Seeding roads...");
  const roads = [
    { id: "R-1", name: "NH-10 (Siliguri-Gangtok)", geometry: { type: "LineString", coordinates: [[BASE_LON, BASE_LAT], [BASE_LON - 0.05, BASE_LAT - 0.1]] }, risk_score: 92, priority: "PRIORITY_INSPECTION", is_demo: true }
  ];
  await supabase.from('road_segments').upsert(roads);

  // Insert Reports
  console.log("Seeding reports & flags...");
  const pubUserId = createdUsers.find(u => u.role === 'public')?.id;
  
  if (pubUserId) {
    const report1 = {
      id: `PR-1000`,
      title: "Large Ground Crack",
      description: "Large crack observed near roadside after heavy rainfall. Seems to be expanding.",
      category: "GROUND_CRACK",
      severity: "HIGH",
      lat: BASE_LAT,
      lon: BASE_LON,
      reporter_id: pubUserId,
      status: "NEW",
      nearest_grid_cell: "ES-1000"
    };
    
    await supabase.from('public_reports').upsert(report1);

    // Insert Decision Flag
    await supabase.from('decision_flags').upsert({
      id: `FL-1000`,
      type: "DISCREPANCY",
      related_report_id: report1.id,
      grid_id: "ES-1000",
      title: "FIELD-MODEL DISCREPANCY",
      description: "Local field evidence contradicts current model estimate (LOW RISK).",
      status: "NEW",
      recommended_action: "HUMAN VERIFICATION REQUIRED",
      model_estimate: 0.25,
      field_severity: "HIGH"
    });
  }

  // Insert Advisories
  if (officer1) {
    console.log("Seeding advisories...");
    await supabase.from('advisories').upsert({
      id: `ADV-1000`,
      type: "TRAVEL_CAUTION",
      title: "Heavy Rainfall Warning & Landslide Risk",
      description: "IMD predicts heavy to very heavy rainfall across East Sikkim over the next 48 hours. Avoid travel on NH-10.",
      severity: "HIGH",
      area: "East Sikkim (Gangtok, Singtam, Rangpo)",
      status: "PUBLISHED",
      published_by: officer1,
      published_at: new Date().toISOString(),
      created_by: officer1
    });
  }

  console.log("Seed completed successfully!");
}

runSeed().catch(console.error);
