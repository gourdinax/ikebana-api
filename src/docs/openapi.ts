// src/docs/openapi.ts
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// 🔧 indispensable pour activer zod.openapi(...)
extendZodWithOpenApi(z);

// ⚠️ importe tes schémas existants (avec .js - ESM)
import { RegisterSchema, LoginSchema } from "../modules/user/user.schemas.js";
import { ListQuerySchema as BouquetListQuery } from "../modules/bouquet/bouquet.schemas.js";
import { CreateOrderSchema, ListQuerySchema as OrderListQuery } from "../modules/order/order.schemas.js";
import { CreateBookingSchema, ListQuerySchema as BookingListQuery } from "../modules/booking/booking.schemas.js";
import { ListQuerySchema as SessionListQuery } from "../modules/session/session.schemas.js";
import { ListQuerySchema as WorkshopListQuery } from "../modules/workshop/workshop.schemas.js";
import { ListQuerySchema as VenueListQuery } from "../modules/venue/venue.schemas.js";
import { CreateIntentSchema } from "../modules/payment/payment.schemas.js";

// ---------- Registry ----------
const registry = new OpenAPIRegistry();

// ---------- Schemas réutilisables ----------
const JwtResponse = registry.register("JwtResponse", z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(["client", "admin"]),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional()
  })
}));

const ApiError = registry.register("ApiError", z.object({
  error: z.string(),
  message: z.string().optional()
}));

// Petits modèles de réponse liste (génériques)
const PageMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  pages: z.number()
});

// Réponses simplifiées (tu peux les raffiner au besoin)
const Bouquet = registry.register("Bouquet", z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  categories: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  active: z.boolean(),
  base_price: z.number(),
  variants: z.array(z.object({ code: z.string(), label: z.string().optional(), price: z.number() })).default([]),
  tags: z.array(z.string()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
}));

const Stock = registry.register("Stock", z.object({
  _id: z.string(),
  bouquet_id: z.string(),
  variant_code: z.string(),
  qty: z.number(),
  reorder_level: z.number().optional(),
  updated_at: z.string().optional()
}));

const Order = registry.register("Order", z.object({
  _id: z.string(),
  status: z.enum(["draft","paid","preparing","shipped","delivered","cancelled"]),
  currency: z.string(),
  totals: z.object({ ht: z.number(), tva: z.number(), ttc: z.number(), shipping: z.number() }),
  lines: z.array(z.object({
    _id: z.string().optional(),
    bouquet_id: z.string(),
    variant_code: z.string().optional(),
    name: z.string(),
    qty: z.number(),
    unit_price_ttc: z.number(),
    discount_applied: z.number().optional()
  })),
  created_at: z.string().optional()
}));

const Booking = registry.register("Booking", z.object({
  _id: z.string(),
  user_id: z.string(),
  session_id: z.string(),
  qty: z.number(),
  status: z.enum(["pending","confirmed","cancelled","completed"]),
  total_ttc: z.number(),
  currency: z.string(),
  created_at: z.string().optional()
}));

const Session = registry.register("Session", z.object({
  _id: z.string(),
  workshop_id: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  venue_id: z.string().optional(),
  capacity_max: z.number(),
  status: z.enum(["open","full","cancelled"])
}));

const Workshop = registry.register("Workshop", z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  level: z.enum(["debutant","intermediaire","avance"]),
  duration_min: z.number(),
  price_ttc: z.number(),
  default_capacity: z.number(),
  active: z.boolean()
}));

const Venue = registry.register("Venue", z.object({
  _id: z.string(),
  name: z.string(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    zip: z.string(),
    country: z.string()
  }),
  capacity: z.number()
}));

// ---------- Security ----------
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT"
});

// ---------- Paths ----------

// Health (libre)
registry.registerPath({
  method: "get",
  path: "/health",
  responses: { 200: { description: "OK" } },
  tags: ["Health"]
});

// Users
registry.registerPath({
  method: "post",
  path: "/api/users/register",
  tags: ["Users"],
  request: { body: { content: { "application/json": { schema: RegisterSchema } } } },
  responses: {
    201: { description: "Created" },
    400: { description: "Validation error", content: { "application/json": { schema: ApiError } } },
    409: { description: "Email used", content: { "application/json": { schema: ApiError } } }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/users/login",
  tags: ["Users"],
  request: { body: { content: { "application/json": { schema: LoginSchema } } } },
  responses: {
    200: { description: "JWT + user", content: { "application/json": { schema: JwtResponse } } },
    401: { description: "Bad credentials", content: { "application/json": { schema: ApiError } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/users/me",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Current user" },
    401: { description: "Unauthorized", content: { "application/json": { schema: ApiError } } }
  }
});

// Bouquets (public)
registry.registerPath({
  method: "get",
  path: "/api/bouquets",
  tags: ["Bouquets"],
  request: { query: BouquetListQuery },
  responses: {
    200: {
      description: "List",
      content: { "application/json": { schema: z.object({ items: z.array(Bouquet), ...PageMeta.shape }) } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/bouquets/{id}",
  tags: ["Bouquets"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Bouquet", content: { "application/json": { schema: Bouquet } } },
    404: { description: "Not found", content: { "application/json": { schema: ApiError } } }
  }
});

// Stocks (public read)
registry.registerPath({
  method: "get",
  path: "/api/stocks/by-bouquet/{bouquetId}",
  tags: ["Stocks"],
  request: { params: z.object({ bouquetId: z.string() }) },
  responses: {
    200: { description: "Stocks", content: { "application/json": { schema: z.array(Stock) } } }
  }
});

// Orders (auth)
registry.registerPath({
  method: "post",
  path: "/api/orders",
  tags: ["Orders"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateOrderSchema } } } },
  responses: {
    201: { description: "Order", content: { "application/json": { schema: Order } } },
    400: { description: "Validation error", content: { "application/json": { schema: ApiError } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/orders/me",
  tags: ["Orders"],
  security: [{ bearerAuth: [] }],
  request: { query: OrderListQuery },
  responses: {
    200: { description: "My orders", content: { "application/json": { schema: z.object({ items: z.array(Order), ...PageMeta.shape }) } } }
  }
});

// Payments (auth)
registry.registerPath({
  method: "post",
  path: "/api/payments/intent",
  tags: ["Payments"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateIntentSchema } } } },
  responses: {
    201: { description: "Stripe client_secret", content: { "application/json": { schema: z.object({ client_secret: z.string().nullable(), intent_id: z.string() }) } } }
  }
});

// Workshops / Sessions / Venues (public)
registry.registerPath({
  method: "get",
  path: "/api/workshops",
  tags: ["Workshops"],
  request: { query: WorkshopListQuery },
  responses: {
    200: { description: "List", content: { "application/json": { schema: z.object({ items: z.array(Workshop), ...PageMeta.shape }) } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/sessions",
  tags: ["Sessions"],
  request: { query: SessionListQuery },
  responses: {
    200: { description: "List", content: { "application/json": { schema: z.object({ items: z.array(Session), ...PageMeta.shape }) } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/venues",
  tags: ["Venues"],
  request: { query: VenueListQuery },
  responses: {
    200: { description: "List", content: { "application/json": { schema: z.object({ items: z.array(Venue), ...PageMeta.shape }) } } }
  }
});

// Bookings (auth)
registry.registerPath({
  method: "post",
  path: "/api/bookings",
  tags: ["Bookings"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateBookingSchema } } } },
  responses: {
    201: { description: "Booking", content: { "application/json": { schema: Booking } } },
    409: { description: "Insufficient seats", content: { "application/json": { schema: ApiError } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/bookings/me",
  tags: ["Bookings"],
  security: [{ bearerAuth: [] }],
  request: { query: BookingListQuery },
  responses: {
    200: { description: "My bookings", content: { "application/json": { schema: z.object({ items: z.array(Booking), ...PageMeta.shape }) } } }
  }
});

// ---------- Génération du document ----------
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Ikebana API",
    version: "1.0.0",
    description: "Catalogue bouquets, commandes, paiements, ateliers & réservations."
  },
  servers: [{ url: "http://localhost:8080" }]
});

export default openApiDocument;
