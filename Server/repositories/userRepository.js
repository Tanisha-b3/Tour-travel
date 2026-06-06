import User from "../models/User.js";

export async function findByEmail(email) {
  return User.findOne({ email }).select("+password");
}

export async function findById(id) {
  return User.findById(id);
}

export async function create(userData) {
  return User.create(userData);
}
