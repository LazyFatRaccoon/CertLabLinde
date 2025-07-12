export function flattenRows({ rows, showLogs, isSupervisor }) {
  const out = [];
  rows.forEach((rec, idx) => {
    const isDeleted = !!rec.deletedAt;
    out.push({
      ...rec,
      sortKey: idx,
      type: "main",
      isDeleted,
      isDirty: rec.isDirty ?? false,
    });

    if (isSupervisor && showLogs && Array.isArray(rec.logs)) {
      rec.logs.forEach((log, j) => {
        out.push({
          ...log,
          parentId: rec.id,
          parentSort: idx,
          logIndex: j,
          type: "log",
        });
      });
    }
  });

  return out;
}
