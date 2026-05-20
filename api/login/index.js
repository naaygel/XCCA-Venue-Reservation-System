const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../shared/db");
const { createToken } = require("../shared/auth");

module.exports = async function (context, req) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      context.res = {
        status: 400,
        body: { message: "Please enter username and password." }
      };
      return;
    }

    const pool = await getPool();

    const result = await pool.request()
      .input("username", sql.NVarChar(100), username)
      .query(`
        SELECT id, fullName, username, passwordHash, role
        FROM Users
        WHERE username = @username
      `);

    if (result.recordset.length === 0) {
      context.res = {
        status: 401,
        body: { message: "Invalid username or password." }
      };
      return;
    }

    const userRecord = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, userRecord.passwordHash);

    if (!passwordMatch) {
      context.res = {
        status: 401,
        body: { message: "Invalid username or password." }
      };
      return;
    }

    const user = {
      id: userRecord.id,
      name: userRecord.fullName,
      username: userRecord.username,
      role: userRecord.role
    };

    const token = createToken(user);

    context.res = {
      status: 200,
      body: {
        message: "Login successful.",
        token,
        user
      }
    };
  } catch (error) {
    context.log(error);
  
    context.res = {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Server error during login.",
        error: error.message
      })
    };
  }
};
