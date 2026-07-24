import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalProducts,
      publishedProducts,
      soldProducts,
      lowStockCandidates,
      todaysBookings,
      todaysEnquiries,
      latestEnquiries,
      latestBookings,
      bestsellers,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.product.count({ where: { status: 'SOLD' } }),
      this.prisma.product.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, select: { id: true, name: true, stock: true, lowStockThreshold: true } }),
      this.prisma.eyeTestBooking.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.contactEnquiry.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.contactEnquiry.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      this.prisma.eyeTestBooking.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      this.prisma.product.findMany({ where: { isBestseller: true, deletedAt: null }, take: 5 }),
    ]);

    const lowStockCount = lowStockCandidates.filter((p) => p.stock <= p.lowStockThreshold).length;

    return {
      products: { total: totalProducts, published: publishedProducts, sold: soldProducts, lowStock: lowStockCount },
      today: { bookings: todaysBookings, enquiries: todaysEnquiries },
      latestEnquiries,
      latestBookings,
      popularProducts: bestsellers,
      // Revenue tracking requires a payments/orders integration, which this
      
      revenue: { placeholder: true, message: 'Revenue tracking requires an orders/payments module — not implemented.' },
    };
  }

  async globalSearch(q: string) {
    const [products, blogs, brands, categories] = await Promise.all([
      this.prisma.product.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: 5 }),
      this.prisma.blog.findMany({ where: { title: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: 5 }),
      this.prisma.brand.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: 5 }),
      this.prisma.category.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: 5 }),
    ]);
    return { products, blogs, brands, categories };
  }
}
