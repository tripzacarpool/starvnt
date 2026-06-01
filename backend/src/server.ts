import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { requireAuth, hashPassword, signToken, verifyPassword } from './auth.js';
import { env } from './env.js';
import { prisma } from './prisma.js';
import {
  createInquirySchema,
  inquiryStatusSchema,
  loginSchema,
  profileSchema,
  registerSchema
} from './validators.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'starvnt-vendor-api' });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        vendor: {
          create: {
            brandName: data.brandName,
            category: data.category,
            city: data.city,
            bio: '',
            phone: '',
            priceFrom: 0,
            coverageRadius: 0,
            responseMinutes: 0,
            specialties: [],
            isVerified: false
          }
        }
      },
      include: { vendor: true }
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { vendor: true }
    });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { vendor: true }
  });

  res.json({ user: user ? publicUser(user) : null });
});

app.get('/api/vendor/profile', requireAuth, async (req, res) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: req.user!.id }
  });

  res.json({ profile });
});

app.put('/api/vendor/profile', requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const profile = await prisma.vendorProfile.update({
      where: { userId: req.user!.id },
      data
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

app.get('/api/inquiries', requireAuth, async (req, res) => {
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.id } });
  if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

  const inquiries = await prisma.inquiry.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ inquiries });
});

app.post('/api/inquiries', requireAuth, async (req, res, next) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

    const data = createInquirySchema.parse(req.body);
    const inquiry = await prisma.inquiry.create({
      data: { ...data, vendorId: vendor.id, source: 'Vendor console' }
    });

    return res.status(201).json({ inquiry });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/inquiries/:id/status', requireAuth, async (req, res, next) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

    const data = inquiryStatusSchema.parse(req.body);
    const inquiryId = String(req.params.id);
    const existing = await prisma.inquiry.findFirst({
      where: { id: inquiryId, vendorId: vendor.id }
    });

    if (!existing) return res.status(404).json({ message: 'Inquiry not found' });

    const inquiry = await prisma.inquiry.update({
      where: { id: existing.id },
      data
    });

    return res.json({ inquiry });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/analytics', requireAuth, async (req, res) => {
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.id } });
  if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

  const inquiries = await prisma.inquiry.findMany({ where: { vendorId: vendor.id } });
  const totalPipeline = inquiries.reduce((sum, inquiry) => sum + inquiry.budget, 0);
  const confirmedRevenue = inquiries
    .filter((inquiry) => inquiry.status === 'CONFIRMED')
    .reduce((sum, inquiry) => sum + inquiry.budget, 0);

  const byStatus = groupCount(inquiries.map((inquiry) => inquiry.status));
  const byEventType = groupCount(inquiries.map((inquiry) => inquiry.eventType));
  const monthly = inquiries.reduce<Record<string, { month: string; inquiries: number; pipeline: number }>>(
    (acc, inquiry) => {
      const month = inquiry.createdAt.toLocaleString('en-US', { month: 'short' });
      acc[month] ??= { month, inquiries: 0, pipeline: 0 };
      acc[month].inquiries += 1;
      acc[month].pipeline += inquiry.budget;
      return acc;
    },
    {}
  );

  res.json({
    metrics: {
      totalInquiries: inquiries.length,
      newInquiries: byStatus.NEW ?? 0,
      confirmedBookings: byStatus.CONFIRMED ?? 0,
      conversionRate: inquiries.length ? Math.round(((byStatus.CONFIRMED ?? 0) / inquiries.length) * 100) : 0,
      totalPipeline,
      confirmedRevenue,
      avgBudget: inquiries.length ? Math.round(totalPipeline / inquiries.length) : 0,
      responseMinutes: vendor.responseMinutes,
      rating: vendor.rating
    },
    byStatus,
    byEventType,
    monthly: Object.values(monthly)
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: error.flatten() });
  }

  if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
    return res.status(409).json({ message: 'A user with this email already exists' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Something went wrong' });
});

app.listen(env.port, () => {
  console.log(`StarVNT vendor API listening on :${env.port}`);
});

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDOR';
  vendor?: unknown;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    vendor: user.vendor
  };
}

function groupCount(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}
