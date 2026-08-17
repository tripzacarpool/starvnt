import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import {
  requireAuth,
  hashPassword,
  signToken,
  verifyPassword,
} from "./auth.js";
import { env } from "./env.js";
import { collections, connectDb, makeId } from "./db.js";
import type { UserDoc, VendorDoc } from "./db.js";
import {
  createInquirySchema,
  inquiryStatusSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from "./validators.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "starvnt-vendor-api" });
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);

    const { users, vendors } = await collections();

    const exists = await users.findOne({ email: data.email.toLowerCase() });
    if (exists)
      return res
        .status(409)
        .json({ message: "A user with this email already exists" });

    const userId = makeId();
    const userDoc: UserDoc = {
      id: userId,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: "VENDOR",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await users.insertOne(userDoc);

    const vendorId = makeId();
    const vendorDoc: VendorDoc = {
      id: vendorId,
      userId,
      brandName: data.brandName,
      category: data.category,
      city: data.city,
      bio: "",
      phone: "",
      priceFrom: 0,
      coverageRadius: 0,
      responseMinutes: 0,
      specialties: [],
      isVerified: false,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await vendors.insertOne(vendorDoc);

    const token = signToken({
      id: userDoc.id,
      email: userDoc.email,
      role: userDoc.role,
    });
    res
      .status(201)
      .json({ token, user: publicUser({ ...userDoc, vendor: vendorDoc }) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const { users, vendors } = await collections();
    const user = await users.findOne({ email: data.email.toLowerCase() });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const vendor = await vendors.findOne({ userId: user.id });
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return res.json({ token, user: publicUser({ ...user, vendor }) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  const { users, vendors } = await collections();
  const user = await users.findOne({ id: req.user!.id });
  const vendor = user ? await vendors.findOne({ userId: user.id }) : null;

  res.json({ user: user ? publicUser({ ...user, vendor }) : null });
});

app.get("/api/vendor/profile", requireAuth, async (req, res) => {
  const { vendors } = await collections();
  const profile = await vendors.findOne({ userId: req.user!.id });
  res.json({ profile });
});

app.put("/api/vendor/profile", requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const { vendors } = await collections();
    const update = { ...data, updatedAt: new Date() };
    const result = await vendors.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: update },
      { returnDocument: "after" },
    );
    res.json({ profile: result.value });
  } catch (error) {
    next(error);
  }
});

app.get("/api/inquiries", requireAuth, async (req, res) => {
  const { vendors, inquiries } = await collections();
  const vendor = await vendors.findOne({ userId: req.user!.id });
  if (!vendor)
    return res.status(404).json({ message: "Vendor profile not found" });

  const inquiriesList = await inquiries
    .find({ vendorId: vendor.id })
    .sort({ createdAt: -1 })
    .toArray();
  return res.json({ inquiries: inquiriesList });
});

app.post("/api/inquiries", requireAuth, async (req, res, next) => {
  try {
    const { vendors, inquiries } = await collections();
    const vendor = await vendors.findOne({ userId: req.user!.id });
    if (!vendor)
      return res.status(404).json({ message: "Vendor profile not found" });

    const data = createInquirySchema.parse(req.body);
    const inquiryDoc = {
      id: makeId(),
      ...data,
      vendorId: vendor.id,
      source: "Vendor console",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    await inquiries.insertOne(inquiryDoc);
    return res.status(201).json({ inquiry: inquiryDoc });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/inquiries/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { vendors, inquiries } = await collections();
    const vendor = await vendors.findOne({ userId: req.user!.id });
    if (!vendor)
      return res.status(404).json({ message: "Vendor profile not found" });

    const data = inquiryStatusSchema.parse(req.body);
    const inquiryId = String(req.params.id);
    const existing = await inquiries.findOne({
      id: inquiryId,
      vendorId: vendor.id,
    });

    if (!existing)
      return res.status(404).json({ message: "Inquiry not found" });

    await inquiries.updateOne(
      { id: existing.id },
      { $set: { ...data, updatedAt: new Date() } },
    );
    const updated = await inquiries.findOne({ id: existing.id });
    return res.json({ inquiry: updated });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/analytics", requireAuth, async (req, res) => {
  const { vendors, inquiries } = await collections();
  const vendor = await vendors.findOne({ userId: req.user!.id });
  if (!vendor)
    return res.status(404).json({ message: "Vendor profile not found" });

  const inquiryList = await inquiries.find({ vendorId: vendor.id }).toArray();
  const totalPipeline = inquiryList.reduce(
    (sum, inquiry) => sum + inquiry.budget,
    0,
  );
  const confirmedRevenue = inquiryList
    .filter((inquiry) => inquiry.status === "CONFIRMED")
    .reduce((sum, inquiry) => sum + inquiry.budget, 0);

  const byStatus = groupCount(inquiryList.map((inquiry) => inquiry.status));
  const byEventType = groupCount(
    inquiryList.map((inquiry) => inquiry.eventType),
  );
  const monthly = inquiryList.reduce<
    Record<string, { month: string; inquiries: number; pipeline: number }>
  >((acc, inquiry) => {
    const month = new Date(inquiry.createdAt).toLocaleString("en-US", {
      month: "short",
    });
    acc[month] ??= { month, inquiries: 0, pipeline: 0 };
    acc[month].inquiries += 1;
    acc[month].pipeline += inquiry.budget;
    return acc;
  }, {});

  res.json({
    metrics: {
      totalInquiries: inquiryList.length,
      newInquiries: byStatus.NEW ?? 0,
      confirmedBookings: byStatus.CONFIRMED ?? 0,
      conversionRate: inquiryList.length
        ? Math.round(((byStatus.CONFIRMED ?? 0) / inquiryList.length) * 100)
        : 0,
      totalPipeline,
      confirmedRevenue,
      avgBudget: inquiryList.length
        ? Math.round(totalPipeline / inquiryList.length)
        : 0,
      responseMinutes: vendor.responseMinutes,
      rating: vendor.rating,
    },
    byStatus,
    byEventType,
    monthly: Object.values(monthly),
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.flatten() });
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists" });
    }

    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  },
);

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`StarVNT vendor API listening on :${env.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VENDOR";
  vendor?: unknown;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    vendor: user.vendor,
  };
}

function groupCount(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}
