import testimonialService from "../services/testimonialService.js";

const testimonialController = {
  async list(req, res, next) {
    try {
      const result = await testimonialService.list(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async listByDestination(req, res, next) {
    try {
      const result = await testimonialService.listByDestination(req.params.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async listMine(req, res, next) {
    try {
      const result = await testimonialService.listMine(req.user.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const result = await testimonialService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async createByUser(req, res, next) {
    try {
      const result = await testimonialService.createByUser(req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const result = await testimonialService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const result = await testimonialService.remove(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

export default testimonialController;