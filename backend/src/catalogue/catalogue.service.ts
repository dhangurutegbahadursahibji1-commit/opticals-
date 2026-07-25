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
    const { name, description, material, basePrice, salePrice, isActive } = data;
    return this.prisma.opticalLensType.create({
      data: { name, description, material, basePrice, salePrice, isActive },
    });
  }

  async updateLens(id: string, data: any) {
    const { name, description, material, basePrice, salePrice, isActive } = data;
    return this.prisma.opticalLensType.update({
      where: { id },
      data: { name, description, material, basePrice, salePrice, isActive },
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
    const { name, type, description, basePrice, salePrice, requiresPrescription, isActive } = data;
    return this.prisma.opticalAddOn.create({
      data: { name, type, description, basePrice, salePrice, requiresPrescription, isActive },
    });
  }

  async updateAddOn(id: string, data: any) {
    const { name, type, description, basePrice, salePrice, requiresPrescription, isActive } = data;
    return this.prisma.opticalAddOn.update({
      where: { id },
      data: { name, type, description, basePrice, salePrice, requiresPrescription, isActive },
    });
  }

  async archiveAddOn(id: string) {
    return this.prisma.opticalAddOn.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  }
}