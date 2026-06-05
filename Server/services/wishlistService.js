import wishlistRepository from "../repositories/wishlistRepository.js";

const wishlistService = {
  async list(userId) {
    const data = await wishlistRepository.getByUser(userId);
    return { data };
  },

  async add(userId, destinationId) {
    const id = Number(destinationId);
    if (!Number.isFinite(id)) {
      throw Object.assign(new Error("Invalid destinationId"), { status: 400 });
    }
    await wishlistRepository.add(userId, id);
    return this.list(userId);
  },

  async remove(userId, destinationId) {
    const id = Number(destinationId);
    if (!Number.isFinite(id)) {
      throw Object.assign(new Error("Invalid destinationId"), { status: 400 });
    }
    await wishlistRepository.remove(userId, id);
    return this.list(userId);
  },

  async sync(userId, items) {
    if (!Array.isArray(items)) {
      throw Object.assign(new Error("items must be an array of destinationIds"), { status: 400 });
    }
    await wishlistRepository.replace(userId, items);
    return this.list(userId);
  },
};

export default wishlistService;
