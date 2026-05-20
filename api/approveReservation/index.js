const { sql, getPool } = require("../shared/db");
const { requireAdmin } = require("../shared/auth");

module.exports = async function (context, req) {
  const user = requireAdmin(context, req);
  if (!user) return;

  const id = Number(req.params.id);

  if (!id) {
    context.res = {
      status: 400,
      body: { message: "Invalid reservation ID." }
    };
    return;
  }

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE Reservations
        SET status = 'Approved'
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      context.res = {
        status: 404,
        body: { message: "Reservation not found." }
      };
      return;
    }

    context.res = {
      status: 200,
      body: { message: "Reservation approved." }
    };
  } catch (error) {
    context.log(error);
    context.res = {
      status: 500,
      body: { message: "Server error while approving reservation." }
    };
  }
};
