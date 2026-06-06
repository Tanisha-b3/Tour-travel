import wishlistService from "../services/wishlistService.js";

const wishlistController = {
  async list(req, res) {
    try {
      const result = await wishlistService.list(req.user.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  },

  async add(req, res) {
    try {
      const result = await wishlistService.add(req.user.id, req.body.destinationId);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  },

  async remove(req, res) {
    try {
      const result = await wishlistService.remove(req.user.id, req.params.destinationId);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  },

  async sync(req, res) {
    try {
      const result = await wishlistService.sync(req.user.id, req.body.items);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: "Failed to sync wishlist" });
    }
  },
};

export default wishlistController;
