import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  brandName: z.string().min(2),
  category: z.enum([
    'CINEMATIC_PRODUCTION',
    'VENUE',
    'LUXURY_GIFTING',
    'FASHION_STYLING',
    'MUSIC_ENTERTAINMENT',
    'CORPORATE_MICE'
  ]),
  city: z.string().min(2)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  brandName: z.string().min(2),
  category: registerSchema.shape.category,
  city: z.string().min(2),
  bio: z.string().min(20),
  phone: z.string().min(8),
  priceFrom: z.coerce.number().int().min(0),
  coverageRadius: z.coerce.number().int().min(1),
  responseMinutes: z.coerce.number().int().min(5),
  specialties: z.array(z.string().min(2)).min(1)
});

export const inquiryStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'CONFIRMED', 'DECLINED'])
});

export const createInquirySchema = z.object({
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(8),
  eventType: z.enum(['WEDDING', 'CORPORATE', 'CONCERT', 'BIRTHDAY', 'MICE']),
  eventDate: z.coerce.date(),
  location: z.string().min(2),
  guestCount: z.coerce.number().int().min(1),
  budget: z.coerce.number().int().min(0),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  notes: z.string().min(10)
});
