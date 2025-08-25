const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Resource not found" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({ error: err.details[0].message });
  }

  // Default error
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

module.exports = errorHandler;
