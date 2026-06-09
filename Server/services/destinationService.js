import destinationRepository from "../repositories/destinationRepository.js";
import cache, { buildKey } from "./cacheService.js";
import { shapePage } from "../utils/pagination.js";

const TTL = {
  featured: 60 * 1000,
  popular:  60 * 1000,
  types:    5 * 60 * 1000,
  byId:     2 * 60 * 1000,
  list:     30 * 1000,
};

const DEST_SCOPE = "destinations";
const DEST_TYPES_SCOPE = "destinations:types";
const DEST_BY_ID_SCOPE = "destinations:byId";

function invalidateDestinations() {
  cache.invalidateMatching((k) => k.startsWith(`${DEST_SCOPE}:`));
}

const PRICE_BUCKETS = {
  low:  { max: 1500 },
  mid:  { min: 1500, max: 2200 },
  high: { min: 2200 },
};

const SORT_OPTIONS = {
  "price-asc":    { price: 1 },
  "price-desc":   { price: -1 },
  "rating-desc":  { rating: -1 },
  "rating-asc":   { rating: 1 },
  "name-asc":     { name: 1 },
  "name-desc":    { name: -1 },
  "duration-asc": { durationDays: 1, id: 1 },
  "duration-desc":{ durationDays: -1, id: 1 },
  "newest":       { createdAt: -1, id: 1 },
};

function resolvePriceFilter(rawPrice) {
  if (rawPrice === undefined || rawPrice === null || rawPrice === "all" || rawPrice === "") return null;
  if (PRICE_BUCKETS[rawPrice]) return PRICE_BUCKETS[rawPrice];
  return null;
}

function parsePositiveNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function buildSort(rawSort) {
  if (!rawSort || rawSort === "default" || rawSort === "recommended") return { id: 1 };
  return SORT_OPTIONS[rawSort] || { id: 1 };
}

const destinationService = {
  async list(filters) {
    const {
      search, type, price, rating,
      minPrice, maxPrice,
      minDuration, maxDuration,
      location, sort,
      page = 1, limit = 12,
    } = filters || {};

    const filter = {};

    if (search) {
      const q = String(search).trim();
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { region: { $regex: q, $options: "i" } },
        ];
      }
    }

    if (type && type !== "all") filter.type = type;

    const priceBucket = resolvePriceFilter(price);
    if (priceBucket) {
      filter.price = {};
      if (priceBucket.min !== undefined) filter.price.$gte = priceBucket.min;
      if (priceBucket.max !== undefined) filter.price.$lte = priceBucket.max;
    }

    const minP = parsePositiveNumber(minPrice);
    const maxP = parsePositiveNumber(maxPrice);
    if (minP !== null || maxP !== null) {
      filter.price = filter.price || {};
      if (minP !== null) filter.price.$gte = minP;
      if (maxP !== null) filter.price.$lte = maxP;
    }

    if (rating && rating !== "all") {
      const r = Number(rating);
      if (Number.isFinite(r)) filter.rating = { $gte: r };
    }

    const minD = parsePositiveNumber(minDuration);
    const maxD = parsePositiveNumber(maxDuration);
    if (minD !== null || maxD !== null) {
      filter.durationDays = {};
      if (minD !== null) filter.durationDays.$gte = minD;
      if (maxD !== null) filter.durationDays.$lte = maxD;
    }

    if (location) {
      filter.location = { $regex: String(location).trim(), $options: "i" };
    }

    const sortSpec = buildSort(sort);
    const safePage  = Math.max(1, Number(page)  || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 12));
    const skip = (safePage - 1) * safeLimit;

    const cacheKey = buildKey(`${DEST_SCOPE}:list`, { filter, sortSpec, skip, limit: safeLimit });
    return cache.wrap(cacheKey, async () => {
      const [data, total] = await Promise.all([
        destinationRepository.findAll(filter, sortSpec, { skip, limit: safeLimit }),
        destinationRepository.count(filter),
      ]);
      return shapePage(data, total, safePage, safeLimit);
    }, TTL.list);
  },

  async getTypes() {
    const key = buildKey(DEST_TYPES_SCOPE);
    return cache.wrap(key, async () => {
      const types = await destinationRepository.distinct("type");
      return { data: types };
    }, TTL.types);
  },

  async getFeatured() {
    const key = buildKey(`${DEST_SCOPE}:featured`);
    return cache.wrap(key, async () => {
      const data = await destinationRepository.findFeatured();
      return { data };
    }, TTL.featured);
  },

  async getPopular() {
    const key = buildKey(`${DEST_SCOPE}:popular`);
    return cache.wrap(key, async () => {
      const data = await destinationRepository.findPopular();
      return { data };
    }, TTL.popular);
  },

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw Object.assign(new Error("Invalid destination id"), { status: 400 });
    }
    const key = buildKey(DEST_BY_ID_SCOPE, numericId);
    return cache.wrap(key, async () => {
      const data = await destinationRepository.findById(numericId);
      if (!data) throw Object.assign(new Error("Destination not found"), { status: 404 });
      return { data };
    }, TTL.byId);
  },

  async create(body) {
    const { name, image, images, description, price, duration, rating, category, type, location, region, facilities, highlights } = body;

    const last = await destinationRepository.findLast();
    const id = (last?.id || 0) + 1;

    const data = await destinationRepository.create({
      id, name, image, images, description, price, duration,
      durationDays: parseDurationDays(duration),
      rating: rating ?? 0, category, type, location,
      region: region || deriveRegion(location),
      facilities, highlights,
    });

    invalidateDestinations();
    return { data };
  },

  async update(id, body) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw Object.assign(new Error("Invalid id"), { status: 400 });
    }
    const existing = await destinationRepository.findById(numericId);
    if (!existing) {
      throw Object.assign(new Error("Destination not found"), { status: 404 });
    }

    const allowed = ["name", "image", "images", "description", "price", "duration", "rating", "category", "type", "location", "region", "facilities", "highlights"];
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.duration !== undefined) {
      patch.durationDays = parseDurationDays(body.duration);
    }
    if (body.region === undefined && body.location !== undefined) {
      patch.region = body.region || deriveRegion(body.location);
    }

    const data = await destinationRepository.updateById(numericId, patch);
    invalidateDestinations();
    return { data };
  },

  async remove(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw Object.assign(new Error("Invalid id"), { status: 400 });
    }
    const data = await destinationRepository.deleteById(numericId);
    if (!data) {
      throw Object.assign(new Error("Destination not found"), { status: 404 });
    }
    invalidateDestinations();
    return { data };
  },
};

export function parseDurationDays(duration) {
  if (!duration) return 0;
  if (typeof duration === "number") return Math.max(0, Math.round(duration));
  const match = String(duration).match(/(\d+)/);
  return match ? Math.max(0, parseInt(match[1], 10)) : 0;
}

export function deriveRegion(location) {
  if (!location) return "";
  const normalized = String(location).trim();
  if (!normalized) return "";
  const last = normalized.split(",").map((p) => p.trim()).filter(Boolean).pop();
  return last || normalized;
}

export const __testables = { PRICE_BUCKETS, SORT_OPTIONS, buildSort, resolvePriceFilter };

export default destinationService;
