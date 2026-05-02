import {
  createReservationAPI,
  getReservationsAPI,
  approveReservationAPI,
  closeReservationAPI,
  cancelReservationAPI,
  getReservationHistoryAPI,
} from "./reservationAPIService";
import { RESERVATION_STATUS } from "../constants/status";

const RESERVATION_START_HOUR = 8;
const RESERVATION_END_HOUR = 18;
const LUNCH_BREAK_HOURS = [11, 12];

// In-memory cache for reservations to reduce API calls
let reservationCache = null;
let historyCacheMask = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10000; // 10 seconds

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

// Invalidate cache
const invalidateCache = () => {
  reservationCache = null;
  historyCacheMask = null;
  cacheTimestamp = 0;
};

// Get all reservations with caching
export const getReservations = async () => {
  const now = Date.now();
  if (reservationCache && now - cacheTimestamp < CACHE_DURATION) {
    return reservationCache;
  }

  const result = await getReservationsAPI();
  if (result.ok) {
    reservationCache = result.reservations;
    cacheTimestamp = now;
    return result.reservations;
  }
  return [];
};

// Get reservation history with caching
export const getReservationHistory = async () => {
  const now = Date.now();
  if (historyCacheMask && now - cacheTimestamp < CACHE_DURATION) {
    return historyCacheMask;
  }

  const result = await getReservationHistoryAPI();
  if (result.ok) {
    historyCacheMask = result.history;
    cacheTimestamp = now;
    return result.history;
  }
  return [];
};

// Auto-close passed reservations (no-op with backend, handled on API side)
export const autoClosePassedReservations = async () => {
  // Backend handles auto-closing via status checks
  return;
};

// Approve reservation
export const approveReservation = async (reservationId) => {
  const result = await approveReservationAPI(reservationId);
  if (result.ok) {
    invalidateCache();
  }
  return result;
};

// Close reservation
export const closeReservation = async (reservationId) => {
  const result = await closeReservationAPI(reservationId);
  if (result.ok) {
    invalidateCache();
  }
  return result;
};

// Cancel reservation
export const cancelReservation = async (reservationId) => {
  const result = await cancelReservationAPI(reservationId);
  if (result.ok) {
    invalidateCache();
  }
  return result;
};

// Request reservation cancellation (alias for API)
export const requestReservationCancellation = async (reservationId) => {
  return await cancelReservation(reservationId);
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

// Get unavailable reservation hours for a room (async now - uses API)
export const getUnavailableReservationHours = async (room) => {
  if (!room) return [];
  
  const reservations = await getReservations();
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
export const getUserActiveReservation = async (userEmail) => {
  const reservations = await getReservations();
  const normalizedEmail = String(userEmail || "").toLowerCase().trim();
  
  return reservations.find(
    (res) =>
      String(res.requestedBy || "").toLowerCase().trim() === normalizedEmail &&
      (res.status === RESERVATION_STATUS.PENDING || res.status === RESERVATION_STATUS.APPROVED)
  ) || null;
};

// Add a new reservation (now uses API)
export const addReservation = async (room, reservationHour, notes, requestedBy) => {
  try {
    const hour = toHourNumber(reservationHour);
    if (hour === null) return { ok: false, error: "Invalid reservation hour" };
    
    if (isLunchBreakHour(hour)) {
      return { ok: false, error: "Cannot reserve during lunch break hours (11 AM - 1 PM)" };
    }

    const result = await createReservationAPI(room, hour, notes, requestedBy);
    if (result.ok) {
      invalidateCache();
    }
    return result;
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
