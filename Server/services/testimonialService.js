import testimonialRepository from "../repositories/testimonialRepository.js";

const testimonialService = {
  async list() {
    const data = await testimonialRepository.findAll();
    return { count: data.length, data };
  },

  async create(body) {
    const { name, avatar, location, text, rating } = body;

    if (!name || !avatar || !location || !text) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const data = await testimonialRepository.create({ name, avatar, location, text, rating: rating ?? 5 });
    return { data };
  },
};

export default testimonialService;
