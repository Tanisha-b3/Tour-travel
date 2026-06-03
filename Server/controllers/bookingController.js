import bookingService from "../services/bookingService.js";

const bookingController = {
  async create(req, res) {
    try {
      const result = await bookingService.create(req.body);
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
};

export default bookingController;
