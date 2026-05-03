// Purpose: Shared activity formatting helpers for borrower/staff activity tables.
// Parts: action normalization and stable human-readable label mapping.
export const formatActivityAction = (action) => {
  const normalizedAction = String(action || "").trim().toUpperCase();

  if (normalizedAction === "RESERVATION_CREATED") return "ROOM REQUESTED";
  if (normalizedAction === "RESERVATION_APPROVED") return "ROOM APPROVED";
  if (normalizedAction === "RESERVATION_CLOSED") return "ROOM CLOSED";
  if (normalizedAction === "RESERVATION_ENDED") return "ROOM ENDED";
  if (normalizedAction === "RESERVATION_AVAILABLE") return "ROOM AVAILABLE";
  if (normalizedAction === "RESERVATION_CANCELLATION_REQUESTED") {
    return "ROOM CANCELED";
  }
  if (normalizedAction === "BORROW_REQUESTED") return "BOOK REQUESTED";
  if (normalizedAction === "BORROW_APPROVED") return "BOOK RECEIVED";
  if (normalizedAction === "RETURN_REQUESTED") return "RETURN REQUESTED";

  return String(action || "-").replace(/_/g, " ");
};
