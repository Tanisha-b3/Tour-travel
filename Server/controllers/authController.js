import * as authService from "../services/authService.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const result = await authService.register({ name, email, password });
    res.status(201).json({ data: result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const result = await authService.login({ email, password });
    res.status(200).json({ data: result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ data: user });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
}
