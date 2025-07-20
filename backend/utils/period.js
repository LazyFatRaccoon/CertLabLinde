const { Op } = require("sequelize");
exports.buildDateFilter = ({ period, from, to }) => {
  if (period === "all") return {}; // без обмежень

  let dateFrom = null;
  let dateTo = new Date(); // dateTo = зараз

  switch (period) {
    case "today":
      dateFrom = new Date();
      dateFrom.setHours(0, 0, 0, 0);
      break;
    case "week":
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 7);
      break;
    case "month":
      dateFrom = new Date();
      dateFrom.setMonth(dateFrom.getMonth() - 1);
      break;
    case "year":
      dateFrom = new Date();
      dateFrom.setFullYear(dateFrom.getFullYear() - 1);
      break;
    case "range":
      if (from && to) {
        const [df, dm, dy] = from.split(".");
        const [tf, tm, ty] = to.split(".");
        dateFrom = new Date(`${dy}-${dm}-${df}`);
        dateTo = new Date(`${ty}-${tm}-${tf}`);
        dateTo.setDate(dateTo.getDate() + 1);
      }
      break;
    default:
      return {};
  }
  return { createdAt: { [Op.between]: [dateFrom, dateTo] } };
};
