import { z } from "zod";

export const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1)
});

export const moduleCreateSchemas = {
  quotes: z.object({
    customer: z.string().min(1),
    email: z.string().email(),
    amount: z.number().nonnegative(),
    status: z.string().default("draft"),
    note: z.string().optional()
  }),
  invoices: z.object({
    id: z.string().optional(),
    invoiceNumber: z.string().optional(),
    customer: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    amount: z.number().nonnegative(),
    status: z.string().default("open"),
    dueDate: z.string().datetime().optional()
  }),
  coupons: z.object({
    code: z.string().optional(),
    discountType: z.string().default("percent"),
    discountValue: z.number().nonnegative(),
    active: z.boolean().default(true),
    usageLimit: z.number().int().positive().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    recipientEmail: z.string().email().optional().or(z.literal("")),
    recipientName: z.string().optional(),
    deliverToDashboard: z.boolean().optional(),
    sendPdfEmail: z.boolean().optional()
  }),
  reviews: z.object({
    customer: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    orderId: z.string().optional(),
    productSlug: z.string().optional(),
    productName: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1),
    published: z.boolean().default(false),
    adminNote: z.string().optional()
  }),
  newsletter: z.object({
    email: z.string().email(),
    active: z.boolean().default(true)
  }),
  newsletterCampaigns: z.object({
    subject: z.string().min(1),
    preheader: z.string().optional(),
    body: z.string().min(1),
    ctaLabel: z.string().optional(),
    ctaUrl: z.string().url().optional().or(z.literal("")),
    status: z.enum(["draft", "sent"]).default("draft")
  }),
  shipping: z.object({
    name: z.string().min(1),
    price: z.number().nonnegative(),
    etaDays: z.number().int().min(0),
    active: z.boolean().default(true)
  }),
  paymentMethods: z.object({
    name: z.string().min(1),
    provider: z.string().min(1),
    active: z.boolean().default(true)
  }),
  usersRoles: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    roleId: z.string().min(1),
    active: z.boolean().default(true)
  }),
  emailTemplates: z.object({
    key: z.string().min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
    active: z.boolean().default(true)
  }),
  backups: z.object({
    label: z.string().min(1),
    status: z.string().default("scheduled"),
    location: z.string().optional()
  }),
  security: z.object({
    level: z.string().default("info"),
    event: z.string().min(1),
    metadata: z.record(z.any()).optional()
  }),
  categories: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    visible: z.boolean().optional(),
    published: z.boolean().optional(),
    quantitySteps: z.array(z.number()).optional(),
    defaultPropertyTemplate: z.string().optional(),
    logo: z.string().optional(),
    showroomImages: z.array(z.object({
      image: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional()
    })).optional(),
    properties: z.array(z.object({
      name: z.string().min(1),
      values: z.array(z.union([
        z.string().min(1),
        z.object({
          value: z.string().min(1),
          label: z.string().optional(),
          basePrice: z.number().nonnegative().optional(),
          stepPrice: z.number().nonnegative().optional()
        })
      ])),
      basePrice: z.number().nonnegative().optional(),
      stepPrice: z.number().nonnegative().optional()
    })).optional()
  }),
  products: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    visible: z.boolean().optional(),
    published: z.boolean().optional(),
    short: z.string(),
    description: z.string(),
    seo: z.string(),
    heroImage: z.string(),
    gallery: z.array(z.string()),
    rating: z.number(),
    basePrice: z.number(),
    pricingType: z.enum(["fixed", "tiered", "area", "hourly"]).optional(),
    purchaseMode: z.enum(["online", "request", "both", "disabled"]).optional(),
    isBestseller: z.boolean().optional(),
    bestsellerSortOrder: z.number().optional(),
    isStudentShop: z.boolean().optional(),
    studentShopSortOrder: z.number().optional(),
    productStatus: z.enum(["draft", "active", "inactive"]).optional(),
    areaPricing: z.object({
      defaultWidthCm: z.number().optional(),
      defaultHeightCm: z.number().optional(),
      minAreaM2: z.number().optional()
    }).optional(),
    priceTiers: z.array(z.object({
      quantity: z.number().int().positive(),
      fromQuantity: z.number().int().positive().optional(),
      toQuantity: z.number().int().positive().optional(),
      price: z.number().nonnegative(),
      unitPrice: z.number().nonnegative().optional()
    })).optional(),
    pricingProperties: z.array(z.object({
      name: z.string().min(1),
      stepPrice: z.number().nonnegative().optional(),
      values: z.array(z.object({
        value: z.string().min(1),
        pricingMode: z.enum(["included", "fixed", "tiered"]),
        fixedPrice: z.number().nonnegative().optional(),
        tierPrices: z.array(z.object({
          quantity: z.number().int().positive(),
          price: z.number().nonnegative()
        })).optional()
      }))
    })).optional(),
    deliveryText: z.string(),
    tags: z.array(z.string()),
    variants: z.array(z.any()),
    production: z.object({
      baseProductionDays: z.number(),
      expressAvailable: z.boolean(),
      preflightProfile: z.string(),
      renderPipeline: z.string()
    }),
    quantitySteps: z.array(z.number()).optional(),
    propertyTemplate: z.string().optional(),
    enabledCategoryProperties: z.array(z.string()).optional(),
    industrySlugs: z.array(z.string()).optional()
  }),
  studentArticles: z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    excerpt: z.string().min(1),
    body: z.string().min(1),
    category: z.string().min(1),
    tags: z.array(z.string()).optional(),
    featuredImage: z.string().optional().or(z.literal("")),
    seoTitle: z.string().optional().or(z.literal("")),
    metaDescription: z.string().optional().or(z.literal("")),
    canonicalUrl: z.string().optional().or(z.literal("")),
    status: z.enum(["draft", "published"]).default("draft"),
    publishDate: z.string().optional().or(z.literal("")),
    relatedProducts: z.array(z.string()).optional(),
    relatedArticles: z.array(z.string()).optional(),
    faqs: z.array(z.object({
      question: z.string().min(1),
      answer: z.string().min(1)
    })).optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().optional()
  })
} as const;
