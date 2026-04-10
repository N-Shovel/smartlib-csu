import { getData, saveData } from "./localStorageService";
import { getIsoTimestamp } from "../utils/dateUtils";
import { RESERVATION_STATUS } from "../constants/status";

const RESERVATIONS_KEY = "library_reservations";
const RESERVATION_HISTORY_KEY = "library_reservation_history";
const RESERVATION_START_HOUR = 8;
const RESERVATION_END_HOUR = 18;
const LUNCH_BREAK_HOURS = [11, 12];

const toHourNumber = (hour) => {
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

const toDateOnly = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const pushReservationHistory = ({ reservation, action, status }) => {
  const history = getReservationHistory();
  history.unshift({
    id: `${reservation.id}-${Date.now()}`,
    reservationId: reservation.id,
    room: reservation.room,
    reservationHour: reservation.reservationHour,
    requestedBy: reservation.requestedBy,
    reservationDate: reservation.reservationDate || reservation.createdAt,
    action,
    status,
    timestamp: getIsoTimestamp(),
  });

  saveData(RESERVATION_HISTORY_KEY, history);
};

export const isReservationTimePassed = (reservation) => {
  const reservationHour = toHourNumber(reservation?.reservationHour);
  if (reservationHour === null) return false;

  const now = new Date();
  const createdAt = reservation?.createdAt ? new Date(reservation.createdAt) : null;

  const reservationDate = createdAt ? toDateOnly(createdAt) : new Date();
  const endTime = new Date(
    reservationDate.getFullYear(),
    reservationDate.getMonth(),
    reservationDate.getDate(),
    reservationHour + 1,
    0,
    0
  );

  return now > endTime;
};

// Get all reservations
export const getReservations = () => {
  return getData(RESERVATIONS_KEY, []);
};

// Get reservation history
export const getReservationHistory = () => {
  return getData(RESERVATION_HISTORY_KEY, []);
};

// Auto-close passed reservations
export const autoClosePassedReservations = () => {
  const reservations = getReservations();
  const updated = reservations.map((res) => {
    if (isReservationTimePassed(res) && res.status === RESERVATION_STATUS.APPROVED) {
      const closedReservation = { ...res, status: RESERVATION_STATUS.CLOSED };
      pushReservationHistory({
        reservation: closedReservation,
        action: "RESERVATION_CLOSED",
        status: RESERVATION_STATUS.CLOSED,
      });
      return closedReservation;
    }
    return res;
  });
  saveData(RESERVATIONS_KEY, updated);
};

// Approve reservation
export const approveReservation = (reservationId) => {
  try {
    const reservations = getReservations();
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return { ok: false, error: "Reservation not found" };

    reservation.status = RESERVATION_STATUS.APPROVED;
    saveData(RESERVATIONS_KEY, reservations);
    pushReservationHistory({
      reservation,
      action: "RESERVATION_APPROVED",
      status: RESERVATION_STATUS.APPROVED,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

// Close reservation
export const closeReservation = (reservationId) => {
  try {
    const reservations = getReservations();
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return { ok: false, error: "Reservation not found" };

    reservation.status = RESERVATION_STATUS.CLOSED;
    saveData(RESERVATIONS_KEY, reservations);
    pushReservationHistory({
      reservation,
      action: "RESERVATION_CLOSED",
      status: RESERVATION_STATUS.CLOSED,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

// Request reservation cancellation
export const requestReservationCancellation = (reservationId, userEmail) => {
  try {
    const reservations = getReservations();
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return { ok: false, error: "Reservation not found" };

    if (String(reservation.requestedBy || "").toLowerCase() !== String(userEmail || "").toLowerCase()) {
      return { ok: false, error: "Unauthorized to cancel this reservation" };
    }

    reservation.status = RESERVATION_STATUS.CANCELLED;
    saveData(RESERVATIONS_KEY, reservations);
    pushReservationHistory({
      reservation,
      action: "RESERVATION_CANCELLATION_REQUESTED",
      status: RESERVATION_STATUS.CANCELLED,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

// Get reservation hour options for form dropdown
export const getReservationHourOptions = () => {
  const options = [];
  for (let hour = RESERVATION_START_HOUR; hour < RESERVATION_END_HOUR; hour++) {
    options.push({
      value: hour,
      label: formatReservationHour(hour)
    });
  }
  return options;
};

// Check if hour is during lunch break
export const isLunchBreakHour = (hour) => {
  return LUNCH_BREAK_HOURS.includes(toHourNumber(hour));
};

// Get unavailable reservation hours for a room
export const getUnavailableReservationHours = (room) => {
  if (!room) return [];
  
  const reservations = getReservations();
  const unavailable = [];
  
  // Add lunch break hours
  LUNCH_BREAK_HOURS.forEach((hour) => unavailable.push(hour));
  
  // Add hours with existing reservations for this room
  reservations
    .filter((res) => res.room === room && res.status === RESERVATION_STATUS.APPROVED)
    .forEach((res) => {
      const hour = toHourNumber(res.reservationHour);
      if (hour !== null && !unavailable.includes(hour)) {
        unavailable.push(hour);
      }
    });
  
  return unavailable;
};

// Get active (pending or approved) reservations for a user
export const getUserActiveReservation = (userEmail) => {
  const reservations = getReservations();
  const normalizedEmail = String(userEmail || "").toLowerCase().trim();
  
  return reservations.find(
    (res) =>
      String(res.requestedBy || "").toLowerCase().trim() === normalizedEmail &&
      (res.status === RESERVATION_STATUS.PENDING || res.status === RESERVATION_STATUS.APPROVED)
  ) || null;
};

// Add a new reservation
export const addReservation = (room, reservationHour, notes, requestedBy) => {
  try {
    const hour = toHourNumber(reservationHour);
    if (hour === null) return { ok: false, error: "Invalid reservation hour" };
    
    if (isLunchBreakHour(hour)) {
      return { ok: false, error: "Cannot reserve during lunch break hours (11 AM - 1 PM)" };
    }

    const reservations = getReservations();
    
    // Check if user already has an active (pending or approved) reservation
    const userActiveReservation = getUserActiveReservation(requestedBy);
    if (userActiveReservation) {
      return { ok: false, error: "You already have an active reservation. Please close it before creating a new one." };
    }
    
    // Check for conflicts
    const conflict = reservations.find(
      (res) =>
        res.room === room &&
        toHourNumber(res.reservationHour) === hour &&
        res.status === RESERVATION_STATUS.APPROVED
    );
    
    if (conflict) {
      return { ok: false, error: "This time slot is already reserved" };
    }

    const newReservation = {
      id: Date.now().toString(),
      room: room,
      reservationHour: hour,
      notes: notes || "",
      requestedBy: requestedBy,
      status: RESERVATION_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      reservationDate: new Date().toISOString()
    };

    reservations.push(newReservation);
    saveData(RESERVATIONS_KEY, reservations);
    pushReservationHistory({
      reservation: newReservation,
      action: "RESERVATION_CREATED",
      status: RESERVATION_STATUS.PENDING,
    });
    
    return { ok: true, reservation: newReservation };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
