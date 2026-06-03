import Testimonial from "../models/Testimonial.js";

const testimonialRepository = {
  findAll() {
    return Testimonial.find().sort({ id: 1 }).lean();
  },

  create(data) {
    return Testimonial.create(data);
  },
};

export default testimonialRepository;
