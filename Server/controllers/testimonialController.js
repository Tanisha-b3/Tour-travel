import testimonialService from "../services/testimonialService.js";

const testimonialController = {
  async list(req, res) {
    try {
      const result = await testimonialService.list();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  },

  async create(req, res) {
    try {
      const result = await testimonialService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  },
};

export default testimonialController;
