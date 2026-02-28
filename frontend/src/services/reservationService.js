// Purpose: Reservation domain service for slot validation and lifecycle updates.
// Parts: constants/helpers, storage adapters, conflict validation, create/approve/close actions.
import reservations from "../data/reservations";
import reservationHistory from "../data/reservationHistory";
import { RESERVATION_STATUS } from "../constants/status";
import { getData, saveData } from "./localStorageService";
import { getIsoTimestamp } from "../utils/dateUtils";

const RESERVATIONS_KEY = "library_reservations";
const RESERVATION_HISTORY_KEY = "library_reservation_history";
const RESERVATION_START_HOUR = 8;
const RESERVATION_END_HOUR = 18;
const LUNCH_BREAK_HOURS = [11, 12];

const toHourNumber = (hour) => {
  // Normalize values from form inputs and stored data.
  const parsedHour = Number(hour);
  return Number.isInteger(parsedHour) ? parsedHour : null;
};

const getHourLabel = (hour) => {
  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${period}`;
};

export const formatReservationHour = (hour) => {
  const parsedHour = toHourNumber(hour);
  if (
    parsedHour === null ||
    parsedHour < RESERVATION_START_HOUR ||
    parsedHour >= RESERVATION_END_HOUR
  ) {
    return "-";
  }
  return `${getHourLabel(parsedHour)} - ${getHourLabel(parsedHour + 1)}`;
};

const isValidReservationHour = (hour) =>
  hour >= RESERVATION_START_HOUR && hour < RESERVATION_END_HOUR;

export const isLunchBreakHour = (hour) => LUNCH_BREAK_HOURS.includes(hour);

export const getUnavailableReservationHours = (room) => {
  // Lunch break is always unavailable regardless of room.
  const unavailable = new Set(LUNCH_BREAK_HOURS);
  const selectedRoom = room?.trim();

  if (!selectedRoom) {
    return unavailable;
  }

  loadReservations().forEach((entry) => {
    const hour = toHourNumber(entry.reservationHour);
    if (
      entry.status === RESERVATION_STATUS.APPROVED &&
      entry.room === selectedRoom &&
      hour !== null
    ) {
      unavailable.add(hour);
    }
  });

  return unavailable;
};

const hasApprovedSlotConflict = (reservationsList, room, reservationHour, skipId = null) =>
  // Detect approved reservations that overlap the exact same room and hour.
  reservationsList.some(
    (entry) =>
      entry.status === RESERVATION_STATUS.APPROVED &&
      entry.room === room &&
      toHourNumber(entry.reservationHour) === reservationHour &&
      entry.id !== skipId
  );

export const getReservationHourOptions = () =>
  Array.from(
    { length: RESERVATION_END_HOUR - RESERVATION_START_HOUR },
    (_, index) => {
      const value = RESERVATION_START_HOUR + index;
      return {
        value,
        label: formatReservationHour(value)
      };
    }
  );

const loadReservations = () => {
  const stored = getData(RESERVATIONS_KEY, null);
  if (!stored || stored.length === 0) {
    // First-run seed for local mock data.
    saveData(RESERVATIONS_KEY, reservations);
    return [...reservations];
  }
  return stored;
};

const saveReservations = (nextReservations) =>
  saveData(RESERVATIONS_KEY, nextReservations);

const loadReservationHistory = () => {
  const stored = getData(RESERVATION_HISTORY_KEY, null);
  if (!stored || stored.length === 0) {
    saveData(RESERVATION_HISTORY_KEY, reservationHistory);
    return [...reservationHistory];
  }
  return stored;
};

const saveReservationHistory = (nextHistory) =>
  saveData(RESERVATION_HISTORY_KEY, nextHistory);

export const getReservationHistory = () =>
  loadReservationHistory().map((entry) => ({ ...entry }));

export const addReservation = (reservation) => {
  const reservationHour = toHourNumber(reservation.reservationHour);
  // Validate base input fields before conflict checks.
  if (!reservation.room?.trim()) {
    return { ok: false, error: "Please choose a room" };
  }
  if (reservationHour === null || !isValidReservationHour(reservationHour)) {
    return { ok: false, error: "Please choose a valid time slot (8:00 AM - 6:00 PM)." };
  }
  if (isLunchBreakHour(reservationHour)) {
    return { ok: false, error: "11:00 AM - 1:00 PM is Lunch Break and unavailable." };
  }

  const currentReservations = loadReservations();
  // Prevent creating pending request if approved slot already exists.
  if (hasApprovedSlotConflict(currentReservations, reservation.room.trim(), reservationHour)) {
    return { ok: false, error: "This room is already approved for that 1-hour slot." };
  }

  // Create pending reservation and write lifecycle history entry.
  const next = {
    id: Date.now(),
    createdAt: getIsoTimestamp(),
    status: RESERVATION_STATUS.PENDING,
    ...reservation,
    room: reservation.room.trim(),
    reservationHour
  };
  const nextReservations = [next, ...currentReservations];
  saveReservations(nextReservations);
  saveReservationHistory([
    {
      id: Date.now(),
      reservationId: next.id,
      room: next.room,
      reservationHour: next.reservationHour,
      requestedBy: next.requestedBy,
      action: "RESERVATION_CREATED",
      status: next.status,
      timestamp: getIsoTimestamp()
    },
    ...loadReservationHistory()
  ]);
  return { ok: true, reservation: next };
};

export const getReservations = () =>
  loadReservations().map((r) => ({
    ...r,
    cancellationRequested: Boolean(r.cancellationRequested)
  }));

export const approveReservation = (id) => {
  const current = loadReservations();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return { ok: false, error: "Reservation not found" };

  const selected = current[index];
  const reservationHour = toHourNumber(selected.reservationHour);
  if (reservationHour === null || !isValidReservationHour(reservationHour)) {
    return { ok: false, error: "Reservation does not have a valid 1-hour time slot." };
  }
  // Re-validate slot to avoid approving conflicting reservations.
  if (hasApprovedSlotConflict(current, selected.room, reservationHour, selected.id)) {
    return {
      ok: false,
      error: "Cannot approve: room already has an approved reservation for that 1-hour slot."
    };
  }

  // Transition reservation to approved and clear stale cancellation flag.
  current[index] = {
    ...selected,
    status: RESERVATION_STATUS.APPROVED,
    cancellationRequested: false
  };

  saveReservations(current);
  saveReservationHistory([
    {
      id: Date.now(),
      reservationId: current[index].id,
      room: current[index].room,
      reservationHour: current[index].reservationHour,
      requestedBy: current[index].requestedBy,
      action: "RESERVATION_APPROVED",
      status: current[index].status,
      timestamp: getIsoTimestamp()
    },
    ...loadReservationHistory()
  ]);
  return { ok: true };
};

export const closeReservation = (id) => {
  const current = loadReservations();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return { ok: false, error: "Reservation not found" };

  const selected = current[index];
  // Only approved reservations can transition to closed.
  if (selected.status !== RESERVATION_STATUS.APPROVED) {
    return { ok: false, error: "Only approved reservations can be closed." };
  }

  current[index] = {
    ...selected,
    status: RESERVATION_STATUS.CLOSED,
    closedAt: getIsoTimestamp(),
    cancellationRequested: false
  };

  saveReservations(current);
  saveReservationHistory([
    {
      id: Date.now(),
      reservationId: current[index].id,
      room: current[index].room,
      reservationHour: current[index].reservationHour,
      requestedBy: current[index].requestedBy,
      action: "RESERVATION_CLOSED",
      status: current[index].status,
      timestamp: getIsoTimestamp()
    },
    ...loadReservationHistory()
  ]);

  return { ok: true };
};

export const requestReservationCancellation = (id, requesterEmail) => {
  const current = loadReservations();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return { ok: false, error: "Reservation not found" };

  const selected = current[index];
  // Enforce ownership check so users can request cancellation only for their own records.
  if (selected.requestedBy !== requesterEmail) {
    return { ok: false, error: "You can only request cancellation for your own reservation." };
  }
  if (selected.status === RESERVATION_STATUS.CLOSED) {
    return { ok: false, error: "This reservation is already closed." };
  }
  if (selected.cancellationRequested) {
    return { ok: false, error: "Cancellation request already submitted." };
  }

  // Mark reservation as cancellation-requested; staff resolves closure in approvals page.
  current[index] = {
    ...selected,
    cancellationRequested: true,
    cancellationRequestedAt: getIsoTimestamp()
  };

  saveReservations(current);
  saveReservationHistory([
    {
      id: Date.now(),
      reservationId: current[index].id,
      room: current[index].room,
      reservationHour: current[index].reservationHour,
      requestedBy: current[index].requestedBy,
      action: "RESERVATION_CANCELLATION_REQUESTED",
      status: current[index].status,
      timestamp: getIsoTimestamp()
    },
    ...loadReservationHistory()
  ]);

  return { ok: true };
};
