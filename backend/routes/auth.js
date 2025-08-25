require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("ADMIN", "OPERATOR", "CUSTOMER").default("CUSTOMER"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("ADMIN", "OPERATOR", "CUSTOMER").optional(),
});

// Register
router.post("/register", async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return next(error);

    const { name, email, password, role } = value;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      (JWT_SECRET = process.env.JWT_SECRET),
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return next(error);

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      (JWT_SECRET = process.env.JWT_SECRET),
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post("/refresh", async (req, res, next) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, (JWT_SECRET = process.env.JWT_SECRET));
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const newToken = jwt.sign(
      { userId: user.id, role: user.role },
      (JWT_SECRET = process.env.JWT_SECRET),
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token: newToken, user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
