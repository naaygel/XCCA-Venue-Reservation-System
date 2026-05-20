const { sql, getPool } = require("../shared/db");
const { requireAuth } = require("../shared/auth");

function isTimeRangeValid(startTime, endTime) {
  return startTime && endTime && startTime < endTime;
}

module.exports = async function (context, req) {
  const user = requireAuth(context, req);
  if (!user) return;

  try {
    const pool = await getPool();

    if (req.method === "GET") {
      const result = await pool.request().query(`
        SELECT
          r.id,
          r.userId,
          r.fullName AS name,
          r.eventName,
          r.venue,
          CONVERT(varchar(10), r.reservationDate, 23) AS date,
          CONVERT(varchar(5), r.startTime, 108) AS startTime,
          CONVERT(varchar(5), r.endTime, 108) AS endTime,
          r.organizationName,
          r.status
        FROM Reservations r
        ORDER BY r.reservationDate DESC, r.startTime ASC
      `);

      context.res = {
        status: 200,
        body: { reservations: result.recordset }
      };
      return;
    }

    if (req.method === "POST") {
      const { eventName, venue, date, startTime, endTime, organizationName } = req.body || {};

      if (!eventName || !venue || !date || !startTime || !endTime || !organizationName) {
        context.res = {
          status: 400,
          body: { message: "Please complete all reservation details." }
        };
        return;
      }

      if (!isTimeRangeValid(startTime, endTime)) {
        context.res = {
          status: 400,
          body: { message: "End time must be later than start time." }
        };
        return;
      }

      const conflict = await pool.request()
        .input("venue", sql.NVarChar(150), venue)
        .input("date", sql.Date, date)
        .input("startTime", sql.Time, startTime)
        .input("endTime", sql.Time, endTime)
        .query(`
          SELECT id
          FROM Reservations
          WHERE venue = @venue
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
        .input("userId", sql.Int, user.id)
        .input("fullName", sql.NVarChar(150), user.name)
        .input("eventName", sql.NVarChar(150), eventName)
        .input("venue", sql.NVarChar(150), venue)
        .input("reservationDate", sql.Date, date)
        .input("startTime", sql.Time, startTime)
        .input("endTime", sql.Time, endTime)
        .input("organizationName", sql.NVarChar(150), organizationName)
        .input("status", sql.NVarChar(20), "Pending")
        .query(`
          INSERT INTO Reservations
            (userId, fullName, eventName, venue, reservationDate, startTime, endTime, organizationName, status)
          VALUES
            (@userId, @fullName, @eventName, @venue, @reservationDate, @startTime, @endTime, @organizationName, @status)
        `);

      context.res = {
        status: 201,
        body: { message: "Reservation submitted and is pending approval." }
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
      body: { message: "Server error while processing reservations." }
    };
  }
};
