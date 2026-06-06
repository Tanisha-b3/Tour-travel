import Wishlist from "../models/Wishlist.js";
import Destination from "../models/Destination.js";

const wishlistRepository = {
  async getByUser(userId) {
    let doc = await Wishlist.findOne({ user: userId }).lean();
    if (!doc) return { user: userId, items: [] };

    const ids = doc.items.map((i) => i.destinationId);
    const destinations = await Destination.find({ id: { $in: ids } }).lean();
    const map = new Map(destinations.map((d) => [d.id, d]));

    const items = doc.items
      .map((i) => {
        const d = map.get(i.destinationId);
        if (!d) return null;
        return { ...d, addedAt: i.addedAt };
      })
      .filter(Boolean);

    return { user: userId, items };
  },

  async add(userId, destinationId) {
    return Wishlist.findOneAndUpdate(
      { user: userId },
      { $addToSet: { items: { destinationId, addedAt: new Date() } } },
      { upsert: true, new: true }
    ).lean();
  },

  async remove(userId, destinationId) {
    return Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { destinationId } } },
      { upsert: true, new: true }
    ).lean();
  },

  async replace(userId, destinationIds) {
    const unique = [...new Set(destinationIds.map(Number).filter(Number.isFinite))];
    return Wishlist.findOneAndUpdate(
      { user: userId },
      { $set: { items: unique.map((id) => ({ destinationId: id, addedAt: new Date() })) } },
      { upsert: true, new: true }
    ).lean();
  },
};

export default wishlistRepository;
