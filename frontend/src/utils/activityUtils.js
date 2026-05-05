// Purpose: Shared activity formatting helpers for borrower/staff activity tables.
// Parts: action normalization and stable human-readable label mapping.
export const formatActivityAction = (action) => {
  const normalizedAction = String(action || "").trim().toUpperCase();

  if (normalizedAction === "RESERVATION_REQUESTED") return "Room Requested";
  if (normalizedAction === "RESERVATION_APPROVED") return "Room Approved";
  if (normalizedAction === "RESERVATION_DECLINED") return "Room Declined";
  if (normalizedAction === "RESERVATION_EXPIRED") return "Room Expired";
  if (normalizedAction === "RESERVATION_CLOSED") return "Room Closed";
  if (normalizedAction === "RESERVATION_CANCELLED") return "Room Cancelled";
  if (normalizedAction === "BORROW_REQUESTED") return "Book Requested";
  if (normalizedAction === "BORROW_APPROVED") return "Book Received";
  if (normalizedAction === "BORROW_RETURNED") return "Book Returned";
  if (normalizedAction === "BORROW_CANCELLED") return "Book Cancelled";
  if (normalizedAction === "RETURN_REQUESTED") return "Return Requested";

  return String(action || "-")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase());
};

const getNormalizedTimestamp = (...values) => {
  for (const value of values) {
    if (value) return value;
  }
  return null;
};

const sortByTimestampDesc = (left, right) => {
  return new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime();
};

const toMs = (value) => {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const expandReservationHistoryEntries = (entries = []) => {
  return entries
    .flatMap((entry) => {
      const status = String(entry?.status || "").toLowerCase();
      const decisionNote = String(entry?.decisionNote || entry?.decision_note || "").toUpperCase();
      const requestedAt = getNormalizedTimestamp(entry?.requestedAt, entry?.createdAt, entry?.created_at);
      const approvedAt = getNormalizedTimestamp(entry?.approvedAt, entry?.decisionAt, entry?.decision_at, requestedAt);
      const decisionAt = getNormalizedTimestamp(entry?.decisionAt, entry?.decision_at);
      const expiredAt = getNormalizedTimestamp(entry?.timeEnd, approvedAt, requestedAt);
      const hasApprovalRecord = Boolean(entry?.approvedByStaffId) || status === "approved";
      const isApprovalBeforeExpiry = toMs(approvedAt) <= toMs(expiredAt);
      const studentId = entry?.studentId || entry?.student_profiles?.id_number || "-";

      const baseEntry = {
        ...entry,
        requestedAt,
        studentId,
      };

      const rows = requestedAt
        ? [
            {
              ...baseEntry,
              action: "RESERVATION_REQUESTED",
              status: "Pending",
              timestamp: requestedAt,
            },
          ]
        : [];

      if (status === "approved") {
        rows.push({
          ...baseEntry,
          action: "RESERVATION_APPROVED",
          status: "Confirmed",
          timestamp: approvedAt,
        });
      } else if (status === "rejected" && decisionNote === "AUTO_EXPIRED") {
        if (hasApprovalRecord && approvedAt && isApprovalBeforeExpiry) {
          rows.push({
            ...baseEntry,
            action: "RESERVATION_APPROVED",
            status: "Confirmed",
            timestamp: approvedAt,
          });
        }

        rows.push({
          ...baseEntry,
          action: "RESERVATION_EXPIRED",
          status: "Timed Out",
          timestamp: expiredAt,
        });
      } else if (status === "rejected") {
        rows.push({
          ...baseEntry,
          action: "RESERVATION_DECLINED",
          status: "Rejected",
          timestamp: decisionAt,
        });
      } else if (status === "cancelled") {
        rows.push({
          ...baseEntry,
          action: "RESERVATION_CANCELLED",
          status: "Cancelled",
          timestamp: decisionAt,
        });
      }

      return rows;
    })
    .filter((entry) => Boolean(entry.timestamp))
    .sort(sortByTimestampDesc);
};

export const expandBorrowHistoryEntries = (entries = []) => {
  return entries
    .flatMap((entry) => {
      const status = String(entry?.status || "").toLowerCase();
      const requestedAt = getNormalizedTimestamp(entry?.requested_at, entry?.requestedAt, entry?.created_at);
      const approvedAt = getNormalizedTimestamp(entry?.approved_at, entry?.decision_at, requestedAt);
      const returnedAt = getNormalizedTimestamp(entry?.returned_at, entry?.decision_at, approvedAt);

      const baseEntry = {
        ...entry,
        requestedAt,
        studentId: entry?.student_profiles?.id_number || entry?.studentId || "-",
      };

      const rows = requestedAt
        ? [
            {
              ...baseEntry,
              action: "BORROW_REQUESTED",
              status: "Requested",
              timestamp: requestedAt,
            },
          ]
        : [];

      if (approvedAt && ["approved", "returned"].includes(status)) {
        rows.push({
          ...baseEntry,
          action: "BORROW_APPROVED",
          status: "Received",
          timestamp: approvedAt,
        });
      }

      if (returnedAt && status === "returned") {
        rows.push({
          ...baseEntry,
          action: "BORROW_RETURNED",
          status: "Returned",
          timestamp: returnedAt,
        });
      } else if (status === "cancelled") {
        rows.push({
          ...baseEntry,
          action: "BORROW_CANCELLED",
          status: "Cancelled",
          timestamp: approvedAt || requestedAt,
        });
      }

      return rows;
    })
    .filter((entry) => Boolean(entry.timestamp))
    .sort(sortByTimestampDesc);
};
