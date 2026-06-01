export type VendorCategory =
  | 'CINEMATIC_PRODUCTION'
  | 'VENUE'
  | 'LUXURY_GIFTING'
  | 'FASHION_STYLING'
  | 'MUSIC_ENTERTAINMENT'
  | 'CORPORATE_MICE';

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'PROPOSAL_SENT' | 'CONFIRMED' | 'DECLINED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type EventType = 'WEDDING' | 'CORPORATE' | 'CONCERT' | 'BIRTHDAY' | 'MICE';

export type VendorProfile = {
  id: string;
  brandName: string;
  category: VendorCategory;
  city: string;
  bio: string;
  phone: string;
  priceFrom: number;
  coverageRadius: number;
  responseMinutes: number;
  rating: number;
  isVerified: boolean;
  specialties: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDOR';
  vendor: VendorProfile | null;
};

export type Inquiry = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: EventType;
  eventDate: string;
  location: string;
  guestCount: number;
  budget: number;
  status: InquiryStatus;
  priority: Priority;
  notes: string;
  source: string;
  createdAt: string;
};

export type Analytics = {
  metrics: {
    totalInquiries: number;
    newInquiries: number;
    confirmedBookings: number;
    conversionRate: number;
    totalPipeline: number;
    confirmedRevenue: number;
    avgBudget: number;
    responseMinutes: number;
    rating: number;
  };
  byStatus: Record<string, number>;
  byEventType: Record<string, number>;
  monthly: Array<{ month: string; inquiries: number; pipeline: number }>;
};
