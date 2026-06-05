import destinationRepository from "../repositories/destinationRepository.js";

const destinationService = {
  async list(filters) {
    const { search, type, price, rating } = filters;
    const filter = {};

    if (search) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (type && type !== "all") filter.type = type;

    if (price && price !== "all") {
      if (price === "low") filter.price = { $lte: 1500 };
      else if (price === "mid") filter.price = { $gt: 1500, $lte: 2200 };
      else if (price === "high") filter.price = { $gt: 2200 };
    }

    if (rating && rating !== "all") {
      filter.rating = { $gte: parseFloat(rating) };
    }

    const data = await destinationRepository.findAll(filter);
    return { count: data.length, data };
  },

  async getTypes() {
    const types = await destinationRepository.distinct("type");
    return { data: types };
  },

  async getFeatured() {
    const data = await destinationRepository.findFeatured();
    return { data };
  },

  async getPopular() {
    const data = await destinationRepository.findPopular();
    return { data };
  },

  async getById(id) {
    const data = await destinationRepository.findById(id);
    if (!data) throw Object.assign(new Error("Destination not found"), { status: 404 });
    return { data };
  },

  async create(body) {
    const { name, image, images, description, price, duration, rating, category, type, location, facilities, highlights, reviews } = body;

    if (!name || !image || !description || !price || !duration || !category || !type || !location) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const last = await destinationRepository.findLast();
    const id = (last?.id || 0) + 1;

    const data = await destinationRepository.create({
      id, name, image, images, description, price, duration,
      rating: rating ?? 0, category, type, location,
      facilities, highlights, reviews,
    });

    return { data };
  },

  async update(id, body) {
    if (!Number.isFinite(parseInt(id))) {
      throw Object.assign(new Error("Invalid id"), { status: 400 });
    }
    const existing = await destinationRepository.findById(parseInt(id));
    if (!existing) {
      throw Object.assign(new Error("Destination not found"), { status: 404 });
    }

    const allowed = ["name", "image", "images", "description", "price", "duration", "rating", "category", "type", "location", "facilities", "highlights", "reviews"];
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (Object.keys(patch).length === 0) {
      throw Object.assign(new Error("No updatable fields supplied"), { status: 400 });
    }

    const data = await destinationRepository.updateById(parseInt(id), patch);
    return { data };
  },

  async remove(id) {
    if (!Number.isFinite(parseInt(id))) {
      throw Object.assign(new Error("Invalid id"), { status: 400 });
    }
    const data = await destinationRepository.deleteById(parseInt(id));
    if (!data) {
      throw Object.assign(new Error("Destination not found"), { status: 404 });
    }
    return { data };
  },
};

export default destinationService;
