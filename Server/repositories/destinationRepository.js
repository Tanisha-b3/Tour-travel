import Destination from "../models/Destination.js";

const destinationRepository = {
  findAll(filter) {
    return Destination.find(filter).sort({ id: 1 }).lean();
  },

  findById(id) {
    return Destination.findOne({ id }).lean();
  },

  findLast() {
    return Destination.findOne().sort({ id: -1 }).lean();
  },

  distinct(field) {
    return Destination.distinct(field);
  },

  findFeatured() {
    return Destination.find().sort({ id: 1 }).limit(6).lean();
  },

  findPopular() {
    return Destination.find().sort({ id: 1 }).limit(3).lean();
  },

  create(data) {
    return Destination.create(data);
  },
};

export default destinationRepository;
