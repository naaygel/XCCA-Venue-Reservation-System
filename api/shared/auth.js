const jwt = require("jsonwebtoken");

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(context, req) {
  const user = getAuthenticatedUser(req);

  if (!user) {
    context.res = {
      status: 401,
      body: { message: "Unauthorized. Please login first." }
    };

    return null;
  }

  return user;
}

function requireAdmin(context, req) {
  const user = requireAuth(context, req);

  if (!user) return null;

  if (user.role !== "admin") {
    context.res = {
      status: 403,
      body: { message: "Admin access only." }
    };

    return null;
  }

  return user;
}

module.exports = {
  createToken,
  getAuthenticatedUser,
  requireAuth,
  requireAdmin
};
