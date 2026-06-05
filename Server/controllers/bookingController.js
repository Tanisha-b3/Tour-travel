import bookingService from "../services/bookingService.js";
import { getDashboardStats } from "../repositories/bookingRepository.js";

const bookingController = {
  async create(req, res) {
    try {
      const result = await bookingService.create(req.body, req.user?.id);
      res.status(201).json(result);
    } catch (err) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: "Failed to create booking" });
    }
  },

  async list(req, res) {
    try {
      const result = await bookingService.list();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  },

  async listMine(req, res) {
    try {
      const result = await bookingService.listMine(req.user.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch your bookings" });
    }
  },

  async updateStatus(req, res) {
    try {
      const result = await bookingService.updateStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      if (err.status === 404) return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to update booking" });
    }
  },

  async stats(req, res) {
    try {
      const data = await getDashboardStats();
      res.json({ data });
    } catch (err) {
      console.error("stats error:", err);
      res.status(500).json({ error: "Failed to load dashboard stats" });
    }
  },
};

export default bookingController;
