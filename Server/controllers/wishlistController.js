import wishlistService from "../services/wishlistService.js";

const wishlistController = {
  async list(req, res, next) {
    try {
      const result = await wishlistService.list(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async add(req, res, next) {
    try {
      const result = await wishlistService.add(req.user.id, req.body.destinationId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const result = await wishlistService.remove(req.user.id, req.params.destinationId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async sync(req, res, next) {
    try {
      const result = await wishlistService.sync(req.user.id, req.body.items);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

export default wishlistController;