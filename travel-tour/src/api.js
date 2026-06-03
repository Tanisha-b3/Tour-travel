// Backward-compatible re-export. All actual logic lives in src/services/api.js
export {
  fetchFeatured,
  fetchPopular,
  fetchDestinations,
  fetchDestinationTypes,
  fetchDestinationById,
  fetchTestimonials,
  createBooking,
} from "./services/api";
