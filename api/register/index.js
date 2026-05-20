const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../shared/db");

module.exports = async function (context, req) {
  try {
    const { name, username, password, studentId } = req.body || {};

    if (!name || !username || !password || !studentId) {
      context.res = {
        status: 400,
        body: { message: "Please fill all fields." }
      };
      return;
    }

    if (password.length < 6) {
      context.res = {
        status: 400,
        body: { message: "Password must be at least 6 characters." }
      };
      return;
    }

    const pool = await getPool();

    const existingUser = await pool.request()
      .input("username", sql.NVarChar(100), username)
      .query("SELECT id FROM Users WHERE username = @username");

    if (existingUser.recordset.length > 0) {
      context.res = {
        status: 409,
        body: { message: "Username already exists." }
      };
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input("fullName", sql.NVarChar(150), name)
      .input("username", sql.NVarChar(100), username)
      .input("passwordHash", sql.NVarChar(255), passwordHash)
      .input("studentId", sql.NVarChar(100), studentId)
      .input("role", sql.NVarChar(20), "user")
      .query(`
        INSERT INTO Users (fullName, username, passwordHash, studentId, role)
        VALUES (@fullName, @username, @passwordHash, @studentId, @role)
      `);

    context.res = {
      status: 201,
      body: { message: "Account created successfully." }
    };
  } catch (error) {
    context.log(error);
    context.res = {
      status: 500,
      body: { message: "Server error during registration." }
    };
  }
};
