import bookingService from "../services/bookingService.js";
import { getDashboardStats } from "../repositories/bookingRepository.js";

const bookingController = {
  async create(req, res, next) {
    try {
      const result = await bookingService.create(req.body, req.user?.id);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const result = await bookingService.list(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async listMine(req, res, next) {
    try {
      const result = await bookingService.listMine(req.user.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async cancelMine(req, res, next) {
    try {
      const result = await bookingService.cancelMine(req.user.id, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const result = await bookingService.updateStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async stats(req, res, next) {
    try {
      const data = await getDashboardStats();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};

export default bookingController;