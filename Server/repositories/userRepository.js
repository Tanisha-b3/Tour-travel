import User from "../models/User.js";

export async function findByEmail(email) {
  return User.findOne({ email }).select("+password");
}

export async function findById(id) {
  return User.findById(id);
}

export async function findByIdWithPassword(id) {
  return User.findById(id).select("+password");
}

export async function create(userData) {
  return User.create(userData);
}

export async function updateById(id, patch) {
  return User.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
}

export async function setPasswordHash(id, hashed) {
  return User.findByIdAndUpdate(id, { password: hashed }, { new: true });
}
