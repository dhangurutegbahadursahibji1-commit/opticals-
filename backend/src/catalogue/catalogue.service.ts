import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogueService {
  constructor(private prisma: PrismaService) {}

  // PUBLIC
  async getPublicCatalogue() {
    const lenses = await this.prisma.opticalLensType.findMany({
      where: { isActive: true, archivedAt: null },
      include: {
        compatibleAddOns: true,
      }
    });

    const addOns = await this.prisma.opticalAddOn.findMany({
      where: { isActive: true, archivedAt: null },
    });

    const categories = await this.prisma.recommendationCategory.findMany();

    return { lenses, addOns, categories };
  }

  // ADMIN - LENSES
  async getLenses() {
    return this.prisma.opticalLensType.findMany({
      where: { archivedAt: null }
    });
  }

  async createLens(data: any) {
    return this.prisma.opticalLensType.create({ data });
  }

  async updateLens(id: string, data: any) {
    return this.prisma.opticalLensType.update({
      where: { id },
      data
    });
  }

  async archiveLens(id: string) {
    return this.prisma.opticalLensType.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  }

  // ADMIN - ADD-ONS
  async getAddOns() {
    return this.prisma.opticalAddOn.findMany({
      where: { archivedAt: null }
    });
  }

  async createAddOn(data: any) {
    return this.prisma.opticalAddOn.create({ data });
  }

  async updateAddOn(id: string, data: any) {
    return this.prisma.opticalAddOn.update({
      where: { id },
      data
    });
  }

  async archiveAddOn(id: string) {
    return this.prisma.opticalAddOn.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  }
}
