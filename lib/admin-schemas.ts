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
    id: z.string().min(1),
    customer: z.string().min(1),
    amount: z.number().nonnegative(),
    status: z.string().default("open"),
    dueDate: z.string().datetime().optional()
  }),
  coupons: z.object({
    code: z.string().min(2),
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
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1),
    published: z.boolean().default(false)
  }),
  newsletter: z.object({
    email: z.string().email(),
    active: z.boolean().default(true)
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
    enabledCategoryProperties: z.array(z.string()).optional()
  })
} as const;
