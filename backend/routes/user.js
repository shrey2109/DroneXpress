const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Get all users (Admin only)
router.get("/", adminOnly, async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { isActive: true };
    if (role) where.role = role.toUpperCase();

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            operatedDrones: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            operatedDrones: true,
          },
        },
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put("/profile", async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      currentPassword: Joi.string(),
      newPassword: Joi.string().min(6),
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) return next(error);

    const { name, email, currentPassword, newPassword } = value;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Handle password change
    if (newPassword && currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// Create user (Admin only)
router.post("/", adminOnly, async (req, res, next) => {
  try {
    const createSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      phone: Joi.string().optional(),
      role: Joi.string().valid("ADMIN", "OPERATOR", "CUSTOMER").required(),
    });

    const { error, value } = createSchema.validate(req.body);
    if (error) return next(error);

    const { name, email, password, phone, role } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Update user (Admin only)
router.put("/:id", adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateSchema = Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string().optional(),
      role: Joi.string().valid("ADMIN", "OPERATOR", "CUSTOMER"),
      isActive: Joi.boolean(),
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) return next(error);

    const user = await prisma.user.update({
      where: { id },
      data: value,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate user (Admin only)
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow admin to deactivate themselves
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ error: "Cannot deactivate your own account" });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
