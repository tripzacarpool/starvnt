import { collections, makeId, connectDb, disconnectDb } from "./db.js";
import { hashPassword } from "./auth.js";

async function main() {
  await connectDb();
  const { users, vendors, inquiries } = await collections();

  const passwordHash = await hashPassword("Starvnt@2026");

  const existing = await users.findOne({ email: "vendor@starvnt.com" });
  let userId = existing?.id;

  if (!existing) {
    userId = makeId();
    await users.insertOne({
      id: userId,
      name: "Aarav Mehta",
      email: "vendor@starvnt.com",
      passwordHash,
      role: "VENDOR",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  let vendor = await vendors.findOne({ userId });
  if (!vendor) {
    const vendorId = makeId();
    const newVendor = {
      id: vendorId,
      userId: userId!,
      brandName: "CineMandap Studios",
      category: "CINEMATIC_PRODUCTION",
      city: "Kolkata",
      bio: "Luxury wedding and event production team specializing in cinematic direction, live edits, drone films, and StarVNT-style premium guest experiences.",
      phone: "+91 70441 98505",
      priceFrom: 275000,
      coverageRadius: 120,
      responseMinutes: 28,
      rating: 4.9,
      isVerified: true,
      specialties: [
        "Cinematic Weddings",
        "Drone Films",
        "Live Direction",
        "Aura+ Planning",
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    await vendors.insertOne(newVendor);
    vendor = newVendor as any;
  }

  await inquiries.deleteMany({ vendorId: vendor!.id });

  const inquiryData = [
    {
      vendorId: vendor!.id,
      clientName: "Riya Sen",
      clientEmail: "riya@example.com",
      clientPhone: "+91 90000 11111",
      eventType: "WEDDING",
      eventDate: new Date("2026-12-14"),
      location: "ITC Royal Bengal, Kolkata",
      guestCount: 420,
      budget: 1800000,
      status: "PROPOSAL_SENT",
      priority: "HIGH",
      notes:
        "Three-day cinematic wedding with Haldi, Sangeet, drone film, and premium return gifting.",
      source: "Aura+",
    },
    {
      vendorId: vendor!.id,
      clientName: "TechSpace India",
      clientEmail: "events@techspace.example",
      clientPhone: "+91 98888 22000",
      eventType: "CORPORATE",
      eventDate: new Date("2026-09-21"),
      location: "Biswa Bangla Convention Centre",
      guestCount: 650,
      budget: 2400000,
      status: "CONFIRMED",
      priority: "HIGH",
      notes:
        "MICE summit production, executive walk-ins, branded stage visuals, and delegate experience desk.",
      source: "Website",
    },
    {
      vendorId: vendor!.id,
      clientName: "Anika Chatterjee",
      clientEmail: "anika@example.com",
      clientPhone: "+91 97777 33000",
      eventType: "WEDDING",
      eventDate: new Date("2026-08-09"),
      location: "Raajkutir Kolkata",
      guestCount: 180,
      budget: 950000,
      status: "CONTACTED",
      priority: "MEDIUM",
      notes:
        "Boutique Bengali wedding, bridal entry film, and editorial couple shoot.",
      source: "Instagram",
    },
    {
      vendorId: vendor!.id,
      clientName: "Neon Raaga Collective",
      clientEmail: "bookings@neonraaga.example",
      clientPhone: "+91 96666 44000",
      eventType: "CONCERT",
      eventDate: new Date("2026-10-05"),
      location: "Eco Park Amphitheatre",
      guestCount: 1200,
      budget: 3100000,
      status: "NEW",
      priority: "HIGH",
      notes:
        "Concert production with LED stage, artist coordination, backstage media capture, and sponsor deliverables.",
      source: "Partner referral",
    },
    {
      vendorId: vendor!.id,
      clientName: "Moniqui Private Showcase",
      clientEmail: "atelier@moniqui.example",
      clientPhone: "+91 95555 55000",
      eventType: "MICE",
      eventDate: new Date("2026-07-18"),
      location: "Taj Bengal",
      guestCount: 90,
      budget: 650000,
      status: "DECLINED",
      priority: "LOW",
      notes:
        "Short-notice product showcase, luxury gifting installation, and documentary recap.",
      source: "WhatsApp",
    },
  ];

  const docs = inquiryData.map((d) => ({
    id: makeId(),
    ...d,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  if (docs.length) await inquiries.insertMany(docs);

  console.log("Seeded demo vendor: vendor@starvnt.com / Starvnt@2026");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDb();
  });
