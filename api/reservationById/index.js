const { sql, getPool } = require("../shared/db");
const { requireAuth } = require("../shared/auth");

module.exports = async function (context, req) {
  const user = requireAuth(context, req);
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

    const existing = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Reservations WHERE id = @id");

    if (existing.recordset.length === 0) {
      context.res = {
        status: 404,
        body: { message: "Reservation not found." }
      };
      return;
    }

    const reservation = existing.recordset[0];
    const isOwner = reservation.userId === user.id;
    const isAdmin = user.role === "admin";

    if (req.method === "DELETE") {
      if (!isOwner && !isAdmin) {
        context.res = {
          status: 403,
          body: { message: "You can only delete your own reservation." }
        };
        return;
      }

      await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM Reservations WHERE id = @id");

      context.res = {
        status: 200,
        body: { message: "Reservation deleted." }
      };
      return;
    }

    if (req.method === "PUT") {
      if (!isOwner) {
        context.res = {
          status: 403,
          body: { message: "You can only edit your own reservation." }
        };
        return;
      }

      const { eventName, venue, date, startTime, endTime, organizationName } = req.body || {};

      if (!eventName || !venue || !date || !startTime || !endTime || !organizationName) {
        context.res = {
          status: 400,
          body: { message: "Please complete all reservation details." }
        };
        return;
      }

      if (startTime >= endTime) {
        context.res = {
          status: 400,
          body: { message: "End time must be later than start time." }
        };
        return;
      }

      const conflict = await pool.request()
        .input("id", sql.Int, id)
        .input("venue", sql.NVarChar(150), venue)
        .input("date", sql.Date, date)
        .input("startTime", sql.Time, startTime)
        .input("endTime", sql.Time, endTime)
        .query(`
          SELECT id
          FROM Reservations
          WHERE id <> @id
            AND venue = @venue
            AND reservationDate = @date
            AND status IN ('Pending', 'Approved')
            AND @startTime < endTime
            AND @endTime > startTime
        `);

      if (conflict.recordset.length > 0) {
        context.res = {
          status: 409,
          body: { message: "Conflict detected. This venue is already reserved during that time range." }
        };
        return;
      }

      await pool.request()
        .input("id", sql.Int, id)
        .input("eventName", sql.NVarChar(150), eventName)
        .input("venue", sql.NVarChar(150), venue)
        .input("reservationDate", sql.Date, date)
        .input("startTime", sql.Time, startTime)
        .input("endTime", sql.Time, endTime)
        .input("organizationName", sql.NVarChar(150), organizationName)
        .input("status", sql.NVarChar(20), "Pending")
        .query(`
          UPDATE Reservations
          SET eventName = @eventName,
              venue = @venue,
              reservationDate = @reservationDate,
              startTime = @startTime,
              endTime = @endTime,
              organizationName = @organizationName,
              status = @status
          WHERE id = @id
        `);

      context.res = {
        status: 200,
        body: { message: "Reservation updated and set back to Pending." }
      };
      return;
    }

    context.res = {
      status: 405,
      body: { message: "Method not allowed." }
    };
  } catch (error) {
    context.log(error);
    context.res = {
      status: 500,
      body: { message: "Server error while updating reservation." }
    };
  }
};
