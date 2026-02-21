import reservations from "../data/reservations";
import reservationHistory from "../data/reservationHistory";
import { RESERVATION_STATUS } from "../constants/status";
import { getData, saveData } from "./localStorageService";
import { getIsoTimestamp } from "../utils/dateUtils";

const RESERVATIONS_KEY = "library_reservations";
const RESERVATION_HISTORY_KEY = "library_reservation_history";

const loadReservations = () => {
  const stored = getData(RESERVATIONS_KEY, null);
  if (!stored || stored.length === 0) {
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
  const next = {
    id: Date.now(),
    createdAt: getIsoTimestamp(),
    status: RESERVATION_STATUS.PENDING,
    ...reservation
  };
  const nextReservations = [next, ...loadReservations()];
  saveReservations(nextReservations);
  saveReservationHistory([
    {
      id: Date.now(),
      reservationId: next.id,
      room: next.room,
      requestedBy: next.requestedBy,
      action: "RESERVATION_CREATED",
      status: next.status,
      timestamp: getIsoTimestamp()
    },
    ...loadReservationHistory()
  ]);
  return next;
};

export const getReservations = () =>
  loadReservations().map((r) => ({ ...r }));

export const approveReservation = (id) => {
  const current = loadReservations();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return { ok: false, error: "Reservation not found" };

  current[index] = {
    ...current[index],
    status: RESERVATION_STATUS.APPROVED
  };

  saveReservations(current);
  saveReservationHistory([
    {
      id: Date.now(),
      reservationId: current[index].id,
      room: current[index].room,
      requestedBy: current[index].requestedBy,
      action: "RESERVATION_APPROVED",
      status: current[index].status,
      timestamp: getIsoTimestamp()
    },
    ...loadReservationHistory()
  ]);
  return { ok: true };
};
