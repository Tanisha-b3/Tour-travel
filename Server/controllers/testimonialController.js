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

  async listMine(req, res) {
    try {
      const result = await testimonialService.listMine(req.user.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch your testimonials" });
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

  async createByUser(req, res) {
    try {
      const result = await testimonialService.createByUser(req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  },

  async update(req, res) {
    try {
      const result = await testimonialService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      if (err.status === 404) return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  },

  async remove(req, res) {
    try {
      const result = await testimonialService.remove(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.status === 404) return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  },
};

export default testimonialController;
