import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ConsultationStatus } from '@prisma/client';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async create(dto: CreateConsultationDto) {
    let prescriptionId: string | undefined = undefined;

    // If prescription data is provided, create a Prescription record.
    if (
      dto.prescriptionMode === 'manual' ||
      dto.prescriptionMode === 'upload' ||
      dto.prescriptionUrl
    ) {
      const prescription = await this.prisma.prescription.create({
        data: {
          // uploadedFileId is a foreign key to MediaAsset.id — writing a plain
          // R2 URL string into it (as this used to do) throws a foreign-key
          // violation at the database layer any time a customer actually
          // uploaded a prescription photo, which surfaced to them as a
          // generic "something went wrong placing your order" failure.
          // uploadedFileUrl is the plain-string column for exactly this case.
          uploadedFileUrl: dto.prescriptionUrl,
          sphereRight: dto.rightEyeSphere,
          sphereLeft: dto.leftEyeSphere,
          cylinderRight: dto.rightEyeCylinder,
          cylinderLeft: dto.leftEyeCylinder,
          axisRight: dto.rightEyeAxis,
          axisLeft: dto.leftEyeAxis,
          pd: dto.pdValue,
          notes: dto.notes,
          status: 'PENDING',
        },
      });
      prescriptionId = prescription.id;
    }

    // Re-verify the frame price server-side against what's actually in the
    // catalogue right now, rather than trusting whatever the client's cart
    // (which can sit in localStorage for days, or be edited in devtools)
    // claims. We can't fully re-derive the lens/add-on total here since this
    // DTO carries a lens *type name* and a color string rather than the
    // variantId/addOnIds PricingService needs — but the frame price is always
    // checkable, and it's also the highest-value component to catch tampering
    // or stale-cart drift on. Any mismatch doesn't block the submission (this
    // business verifies every consultation by hand before charging), it's
    // recorded on the snapshot so staff can see it before confirming.
    let verifiedFramePrice: number | undefined;
    let framePriceMismatch = false;
    if (dto.productId) {
      try {
        const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
        if (product) {
          verifiedFramePrice = Number(product.price);
          if (dto.framePrice !== undefined && Math.abs(verifiedFramePrice - dto.framePrice) > 0.01) {
            framePriceMismatch = true;
            this.logger.warn(
              `Consultation frame price mismatch for product ${dto.productId}: claimed ₹${dto.framePrice}, actual ₹${verifiedFramePrice}`
            );
          }
        }
      } catch (err) {
        this.logger.error(`Failed to verify frame price for product ${dto.productId}`, err as Error);
      }
    }

    // Build a canonical snapshot server-side from validated DTO fields, rather
    // than only storing whatever raw shape the frontend's cart happened to
    // send. Previously ~15 fields (address, payment method/UTR/proof,
    // fulfilment, product/variant/quantity, lens choice) were accepted and
    // validated by the DTO and then never persisted anywhere at all — the
    // only thing saved was dto.commercialSnapshot verbatim, so unless the
    // client happened to also nest the same data inside that blob, it was
    // silently lost. This shape also matches what the admin Consultation Hub
    // page actually reads (commercialSnapshot.product.name,
    // commercialSnapshot.lensConfig.{expertAssistance,lensTypeId,customerNotes}).
    const snapshot = {
      product: {
        id: dto.productId,
        name: dto.productName,
        variantColor: dto.variantColor,
        quantity: dto.quantity,
      },
      lensConfig: {
        lensTypeId: dto.lensType,
        expertAssistance: dto.expertAssistance ?? false,
        customerNotes: dto.customerNotes,
        selectedPower: dto.selectedPower,
      },
      pricing: {
        framePrice: dto.framePrice,
        verifiedFramePrice,
        framePriceMismatch,
        lensPrice: dto.lensPrice,
        totalAmount: dto.totalAmount,
      },
      fulfilment: dto.fulfilment,
      address: dto.address,
      payment: {
        method: dto.paymentMethod,
        utrNumber: dto.utrNumber,
        proofUrl: dto.paymentProofUrl,
      },
      // Whatever the client sent as its own commercialSnapshot is kept
      // alongside for reference (it may carry extra display-only detail like
      // image URLs) — the fields above are the ones other code should rely on.
      clientSnapshot: dto.commercialSnapshot ?? null,
    };

    const consultation = await this.prisma.consultation.create({
      data: {
        customerName: dto.customerName,
        phone: dto.phone,
        email: dto.email,
        prescriptionId,
        status: 'PENDING_REVIEW',
        commercialSnapshot: snapshot,
      },
    });

    return consultation;
  }

  async findAll() {
    // NOTE: unpaginated by design — the admin Consultation Hub renders every
    // result as a Kanban board grouped by status, so truncating this could
    // silently hide pending customer requests from staff. Fine at today's
    // volume; if this becomes a real store handling thousands of
    // consultations, this page should move to server-side filtering by
    // status/date rather than a hard limit here.
    return this.prisma.consultation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        prescription: true,
      },
    });
  }

  async findOne(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        prescription: true,
        orders: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async updateStatus(id: string, status: ConsultationStatus) {
    await this.findOne(id);
    return this.prisma.consultation.update({
      where: { id },
      data: { status },
    });
  }
}
