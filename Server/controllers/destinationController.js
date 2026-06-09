import destinationService from "../services/destinationService.js";

const destinationController = {
  async list(req, res, next) {
    try {
      const result = await destinationService.list(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getTypes(req, res, next) {
    try {
      const result = await destinationService.getTypes();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getFeatured(req, res, next) {
    try {
      const result = await destinationService.getFeatured();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getPopular(req, res, next) {
    try {
      const result = await destinationService.getPopular();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const result = await destinationService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const result = await destinationService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const result = await destinationService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const result = await destinationService.remove(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

export default destinationController;