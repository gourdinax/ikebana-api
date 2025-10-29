import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ⚠️ imports ESM avec .js
import User from "../modules/user/user.model.js";
import Workshop from "../modules/workshop/workshop.model.js";
import Venue from "../modules/venue/venue.model.js";
import Session from "../modules/session/session.model.js";
import Bouquet from "../modules/bouquet/bouquet.model.js";
import Stock from "../modules/stock/stock.model.js";
import Booking from "../modules/booking/booking.model.js";

function maskUri(uri?: string) {
  if (!uri) return "UNDEFINED";
  try {
    const u = new URL(uri);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid URI format)";
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI manquant dans .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB:", maskUri(uri));
  await mongoose.connect(uri);
  console.log("✅ Connected");
  const dbName = mongoose.connection.db?.databaseName ?? "(unknown)";
  console.log("📦 DB Name:", dbName);

  // --- SEED DATA ---
  console.log("👤 Upserting admin...");
  const admin = await User.findOneAndUpdate(
    { email: "admin@ikebana.dev" },
    {
      email: "admin@ikebana.dev",
      password_hash: await bcrypt.hash("admin1234", 10),
      role: "admin",
      first_name: "Admin",
      last_name: "Ikebana",
    },
    { upsert: true, new: true }
  );

  console.log("👥 Creating clients...");
  const [alice, bob, claire] = await Promise.all([
    User.findOneAndUpdate(
      { email: "alice@example.com" },
      {
        email: "alice@example.com",
        password_hash: await bcrypt.hash("alice1234", 10),
        role: "client",
        first_name: "Alice",
        last_name: "Tanaka",
      },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "bob@example.com" },
      {
        email: "bob@example.com",
        password_hash: await bcrypt.hash("bob1234", 10),
        role: "client",
        first_name: "Bob",
        last_name: "Matsuda",
      },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "claire@example.com" },
      {
        email: "claire@example.com",
        password_hash: await bcrypt.hash("claire1234", 10),
        role: "client",
        first_name: "Claire",
        last_name: "Suzuki",
      },
      { upsert: true, new: true }
    ),
  ]);

  console.log("🌸 Creating workshop...");
  const w = await Workshop.create({
    title: "Initiation Ikebana",
    duration_min: 120,
    price_ttc: 40,
    default_capacity: 10,
    active: true,
    tags: ["débutant"],
  });

  console.log("📍 Creating venue...");
  const v = await Venue.create({
    name: "Atelier Bastille",
    address: { line1: "5 Rue Démo", city: "Paris", zip: "75011", country: "FR" },
    capacity: 12,
  });

  console.log("🗓️ Creating session...");
  const starts = new Date(Date.now() + 7 * 864e5);
  const ends = new Date(starts.getTime() + 2 * 3600e3);
  const s = await Session.create({
    workshop_id: w._id,
    venue_id: v._id,
    starts_at: starts,
    ends_at: ends,
    capacity_max: 10,
  });

  console.log("💐 Creating bouquets...");
  const b1 = await Bouquet.create({
    name: "Sakura",
    base_price: 45,
    active: true,
    variants: [
      { code: "S", price: 45 },
      { code: "M", price: 60 },
    ],
  });
  const b2 = await Bouquet.create({
    name: "Momiji",
    base_price: 55,
    active: true,
  });

  console.log("📦 Creating stock...");
  await Stock.create({ bouquet_id: b1._id, variant_code: "S", qty: 10 });
  await Stock.create({ bouquet_id: b1._id, variant_code: "M", qty: 8 });
  await Stock.create({ bouquet_id: b2._id, variant_code: "BASE", qty: 5 });

  console.log("🧾 Creating bookings...");
  await Booking.deleteMany({});
  await Booking.insertMany([
    {
      user_id: alice._id,
      session_id: s._id,
      qty: 2,
      total_ttc: 80,
      currency: "EUR",
      status: "confirmed",
    },
    {
      user_id: bob._id,
      session_id: s._id,
      qty: 1,
      total_ttc: 40,
      currency: "EUR",
      status: "pending",
    },
    {
      user_id: claire._id,
      session_id: s._id,
      qty: 1,
      total_ttc: 40,
      currency: "EUR",
      status: "confirmed",
    },
  ]);

  // --- COUNTS ---
  const [uC, wC, vC, sC, bC, stC, bkC] = await Promise.all([
    User.countDocuments(),
    Workshop.countDocuments(),
    Venue.countDocuments(),
    Session.countDocuments(),
    Bouquet.countDocuments(),
    Stock.countDocuments(),
    Booking.countDocuments(),
  ]);

  console.log("✅ Seed OK");
  console.table({
    users: uC,
    workshops: wC,
    venues: vC,
    sessions: sC,
    bouquets: bC,
    stocks: stC,
    bookings: bkC,
  });

  console.log("🔑 Admin login:", "admin@ikebana.dev / admin1234");
  console.log("🔑 Test user login examples:");
  console.table({
    Alice: "alice@example.com / alice1234",
    Bob: "bob@example.com / bob1234",
    Claire: "claire@example.com / claire1234",
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
