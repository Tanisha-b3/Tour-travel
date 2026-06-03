import destinationService from "../services/destinationService.js";

const destinationController = {
  async list(req, res) {
    try {
      const result = await destinationService.list(req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  },

  async getTypes(req, res) {
    try {
      const result = await destinationService.getTypes();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch types" });
    }
  },

  async getFeatured(req, res) {
    try {
      const result = await destinationService.getFeatured();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch featured" });
    }
  },

  async getPopular(req, res) {
    try {
      const result = await destinationService.getPopular();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch popular" });
    }
  },

  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await destinationService.getById(id);
      res.json(result);
    } catch (err) {
      if (err.status === 404) return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to fetch destination" });
    }
  },

  async create(req, res) {
    try {
      const result = await destinationService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err.status === 400) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: "Failed to create destination" });
    }
  },
};

export default destinationController;
