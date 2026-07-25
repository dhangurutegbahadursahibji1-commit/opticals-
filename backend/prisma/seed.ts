import { PrismaClient, Role, ProductStatus, BlogStatus, OfferStatus, TestimonialStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- Super Admin ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@yourstore.example';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, email: adminEmail }, // re-seeds always refresh the hash
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Store',
      lastName: 'Owner',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`Super Admin ready: ${admin.email} (change the seeded password immediately in production)`);

  // --- Brands ---
  const brandNames = ['Ray-Ban', 'Titan', 'Fastrack', 'Vincent Chase', 'Oakley', 'Police', 'Carrera'];
  const brands = await Promise.all(
    brandNames.map((name, i) =>
      prisma.brand.upsert({
        where: { name },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), displayOrder: i, isActive: true },
      })
    )
  );

  // --- Categories ---
  const categoryNames = ['Frames', 'Sunglasses', 'Computer Glasses', 'Kids', 'Reading Glasses'];
  const categories = await Promise.all(
    categoryNames.map((name, i) =>
      prisma.category.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), displayOrder: i, isActive: true },
      })
    )
  );

  // --- Sample products ---
  // ProductVariant has no unique constraint on (productId, color), so we use
  // findFirst + create instead of upsert to stay idempotent without a migration.
  for (let i = 0; i < 6; i++) {
    const brand = brands[i % brands.length];
    const category = categories[i % categories.length];
    const name = `Sample Frame ${i + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    // Step 1: upsert the product (no nested images — productId isn't available yet inside create)
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: `A ${category.name.toLowerCase()} frame from ${brand.name}, seeded for local development.`,
        price: 1999 + i * 500,
        status: ProductStatus.PUBLISHED,
        stock: 10 - i,
        lowStockThreshold: 3,
        brandId: brand.id,
        categoryId: category.id,
        isFeatured: i < 3,
        isBestseller: i % 2 === 0,
        publishedAt: new Date(),
      },
    });

    // Step 2: find-or-create the variant (no @@unique on color so we can't upsert)
    let variant = await prisma.productVariant.findFirst({
      where: { productId: product.id, color: 'Black' },
    });
    if (!variant) {
      variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          color: 'Black',
          colorHex: '#1A1A1A',
          stock: 5,
          availability: 'in-stock',
        },
      });
    }

    // Step 3: create the placeholder image only if none exist yet for this variant
    const existingImage = await prisma.productImage.findFirst({ where: { variantId: variant.id } });
    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id, // required directly on ProductImage
          variantId: variant.id,
          url: 'https://placehold.co/800x800?text=Sample+Frame',
          angle: 'front',
          isPrimary: true,
          altText: `${name} front view`,
        },
      });
    }
  }

  // --- Offers ---
  await prisma.offer.upsert({
    where: { couponCode: 'WELCOME10' },
    update: {},
    create: {
      title: 'Welcome Offer',
      description: 'Flat 10% off your first purchase.',
      discountType: 'percentage',
      discountValue: 10,
      couponCode: 'WELCOME10',
      status: OfferStatus.ACTIVE,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Blog ---
  await prisma.blog.upsert({
    where: { slug: 'welcome-to-our-blog' },
    update: {},
    create: {
      title: 'Welcome to Our Blog',
      slug: 'welcome-to-our-blog',
      excerpt: 'Eye care tips, lens guides and style advice from our team.',
      content: '## Welcome\n\nThis is a seeded sample post — edit or delete it from the admin dashboard.',
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date(),
      category: 'eye-care',
      readTime: 3,
    },
  });

  // --- Testimonial ---
  await prisma.testimonial.create({
    data: {
      customerName: 'Sample Customer',
      rating: 5,
      review: 'Great service and honest advice — seeded sample review.',
      status: TestimonialStatus.APPROVED,
    },
  });

  // --- Settings ---
  // This is the ONLY place store identity/branding/payment data may live.
  // Every value here is a placeholder the store owner is expected to replace
  // from Admin → Settings on first login — nothing here should ever be
  // hardcoded back into frontend code. See settings.service.ts / SettingsPage.tsx.
  await prisma.setting.upsert({
    where: { key: 'store' },
    update: {},
    create: {
      key: 'store',
      value: {
        // Identity — replace these from Admin → Settings after first login.
        storeName: 'Your Store Name',
        tagline: 'We care about your vision.',
        logoUrl: '',
        faviconUrl: '',

        // Contact & location — fill these in from Admin → Settings after first login.
        address: '',
        phone: '',
        email: '',
        hours: '',
        mapEmbedUrl: '',

        // Socials
        socials: {
          instagram: '',
          facebook: '',
          youtube: '',
        },

        // Brand theme (used for accent colours on the storefront)
        colors: {
          primary: '#0f172a',
          accent: '#c8a15a',
        },

        // Tax / compliance
        gstNumber: '',

        // Verified brand partnerships (e.g. an official Ray-Ban dealer badge).
        // Owner uploads these in Admin → Settings; shown publicly in the footer.
        partnerCredentials: [] as Array<{ id: string; brandName: string; badgeImageUrl: string; note?: string }>,

        // Reviews summary shown on the homepage (owner-editable, not computed yet)
        rating: 0,
        reviewCount: 0,

        // Feature toggles the storefront reads at runtime. Both are reserved
        // for a 360° spin viewer / virtual try-on that don't exist yet —
        // flipping them currently has no effect, so they're not exposed in
        // the admin Settings UI.
        featureFlags: {
          enable360Spin: true,
          enableVirtualTryOn: true,
        },
      },
    },
  });

  // Payment settings live in their own row (not under 'store') so they can
  // be gated to SUPER_ADMIN server-side — see settings.controller.ts.
  // GET /settings (public) still merges this in: customers need to see the
  // UPI ID / QR / bank details at checkout without logging in.
  await prisma.setting.upsert({
    where: { key: 'paymentSettings' },
    update: {},
    create: {
      key: 'paymentSettings',
      value: {
        paymentUpiId: '',
        paymentUpiName: '',
        paymentUpiQrUrl: '',
        paymentInstructions: '',
        paymentBankName: '',
        paymentAccountNumber: '',
        paymentIfsc: '',
        paymentAccountHolder: '',
      },
    },
  });

  await seedFaqs();

  console.log('Seed complete.');
}

// Starter FAQ content the store owner is expected to edit from Admin → FAQs.
// Same 6 categories / 12 questions the old static frontend mock shipped with,
// reworded to be store-agnostic (no hardcoded city) now that it's real,
// owner-editable data instead of a hardcoded frontend file.
const FAQ_SEED: Array<{ id: string; category: string; question: string; answer: string; sortOrder: number }> = [
  { id: 'f1', category: 'Returns & Exchange', sortOrder: 0, question: 'Can I return or exchange my frame?', answer: 'Yes — unworn frames in original condition can be exchanged within 7 days of purchase. Prescription lenses are non-returnable once cut.' },
  { id: 'f2', category: 'Returns & Exchange', sortOrder: 1, question: "What if the frame doesn't fit well?", answer: "Bring it back for a free fitting adjustment any time — our opticians will re-fit the temples and nose pads at no charge." },
  { id: 'f3', category: 'Warranty', sortOrder: 0, question: 'What does the 1-year warranty cover?', answer: 'Manufacturing defects in the frame — hinge failure, coating peeling, or material faults. It does not cover accidental damage or scratches.' },
  { id: 'f4', category: 'Warranty', sortOrder: 1, question: 'How do I claim warranty service?', answer: "Visit the store with your original bill. We'll inspect the frame and repair or replace it if the issue is covered." },
  { id: 'f5', category: 'Lens Replacement', sortOrder: 0, question: 'Can I get new lenses in my old frame?', answer: 'Yes, if the frame is in good condition we can fit updated prescription lenses into it.' },
  { id: 'f6', category: 'Lens Replacement', sortOrder: 1, question: 'How long does lens replacement take?', answer: 'Most single-vision lenses are ready same-day. Progressive and specialised lenses typically take 2-3 days.' },
  { id: 'f7', category: 'Eye Testing', sortOrder: 0, question: 'Is the eye test free?', answer: 'Yes, our in-store eye test is completely free, no purchase required.' },
  { id: 'f8', category: 'Eye Testing', sortOrder: 1, question: 'Do I need an appointment?', answer: 'Walk-ins are welcome, but booking via Enquiry guarantees you a slot without waiting.' },
  { id: 'f9', category: 'Delivery', sortOrder: 0, question: 'Do you deliver frames to my home?', answer: 'Yes, we offer home delivery within the local area for a small fee, or you can choose free store pickup.' },
  { id: 'f10', category: 'Delivery', sortOrder: 1, question: 'How long does delivery take?', answer: 'Ready-stock frames deliver within 1-2 days. Frames needing lens fitting take 2-4 days.' },
  { id: 'f11', category: 'Payment Options', sortOrder: 0, question: 'What payment methods do you accept?', answer: 'Cash, all major UPI apps, credit/debit cards, and EMI on select bank cards.' },
  { id: 'f12', category: 'Payment Options', sortOrder: 1, question: 'Can I pay a deposit and the rest on delivery?', answer: 'Yes, for custom lens orders we take a partial advance and the balance is due on pickup or delivery.' },
];

async function seedFaqs() {
  for (const faq of FAQ_SEED) {
    await prisma.faq.upsert({
      where: { id: faq.id },
      update: {},
      create: faq,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });