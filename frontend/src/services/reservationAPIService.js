// API client for room reservations (backend integration)
import { axiosInstance } from "../store/axios";

/**
 * Create a new room reservation
 */
export const createReservationAPI = async (room, hour, notes, userEmail) => {
    try {
        const response = await axiosInstance.post("/rooms/reservations", {
            room_number: room,
            reservation_hour: hour,
            purpose: notes,
        });

        return {
            ok: true,
            reservation: {
                id: response.data.reservation.id,
                room: response.data.reservation.room_number,
                reservationHour: response.data.reservation.time_start.split("T")[1].split(":")[0],
                requestedBy: userEmail,
                notes: response.data.reservation.purpose,
                status: response.data.reservation.status,
                createdAt: response.data.reservation.created_at,
            },
        };
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return { ok: false, error: message };
    }
};

/**
 * Get all reservations (staff gets all, borrowers get theirs)
 */
export const getReservationsAPI = async () => {
    try {
        const response = await axiosInstance.get("/rooms/reservations");

        const reservations = response.data.reservations.map((res) => ({
            id: res.id,
            room: res.room,
            reservationHour: res.reservationHour,
            requestedBy: res.requestedBy,
            notes: res.notes,
            status: res.status,
            createdAt: res.createdAt,
            requestedAt: res.requestedAt || res.createdAt,
            approvedAt: res.approvedAt,
            decisionAt: res.decisionAt,
            decisionNote: res.decisionNote,
            approvedByStaffId: res.approvedByStaffId,
            timeEnd: res.timeEnd,
            cancellationRequested: false,
        }));

        return { ok: true, reservations };
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return { ok: false, error: message, reservations: [] };
    }
};

/**
 * Approve a reservation (staff only)
 */
export const approveReservationAPI = async (reservationId) => {
    try {
        const response = await axiosInstance.patch(`/rooms/reservations/${reservationId}/approve`);
        return { ok: true, reservation: response.data.reservation };
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return { ok: false, error: message };
    }
};

/**
 * Close a reservation (staff only)
 */
export const closeReservationAPI = async (reservationId) => {
    try {
        const response = await axiosInstance.patch(`/rooms/reservations/${reservationId}/close`);
        return { ok: true, reservation: response.data.reservation };
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return { ok: false, error: message };
    }
};

/**
 * Cancel a reservation
 */
export const cancelReservationAPI = async (reservationId) => {
    try {
        const response = await axiosInstance.patch(`/rooms/reservations/${reservationId}/cancel`);
        return { ok: true, reservation: response.data.reservation };
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return { ok: false, error: message };
    }
};

/**
 * Get reservation history (staff only)
 */
export const getReservationHistoryAPI = async () => {
    try {
        const response = await axiosInstance.get("/rooms/reservations/history");

        const normalizedHistory = response.data.history.map((entry) => ({
            id: entry.id,
            room: entry.room,
            reservationHour: entry.reservationHour,
            requestedBy: entry.requestedBy,
            reservationDate: entry.reservationDate,
            requestedAt: entry.requestedAt || entry.createdAt,
            studentId: entry.studentId,
            studentName: entry.studentName,
            status: entry.status,
            notes: entry.notes,
            action: entry.action,
            timestamp: entry.requestedAt || entry.createdAt,
            approvedAt: entry.approvedAt,
            decisionAt: entry.decisionAt,
            decisionNote: entry.decisionNote,
            approvedByStaffId: entry.approvedByStaffId,
            timeEnd: entry.timeEnd,
        }));

        const normalizedEvents = Array.isArray(response.data.events)
            ? response.data.events.map((event) => ({
                id: event.id,
                reservationId: event.reservationId,
                room: event.room,
                reservationHour: event.reservationHour,
                requestedBy: event.requestedBy,
                studentId: event.studentId,
                studentName: event.studentName,
                status: event.status,
                action: event.action,
                timestamp: event.timestamp,
                occurredAt: event.occurredAt,
                eventType: event.eventType,
                eventNote: event.eventNote,
                metadata: event.metadata,
                legacyMetadataStatus: event.legacyMetadataStatus,
                approvedByStaffId: event.staff_user_id ?? event.approvedByStaffId,
                timeEnd: event.timeEnd,
            }))
            : [];

        return { ok: true, history: normalizedHistory, events: normalizedEvents };
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return { ok: false, error: message, history: [], events: [] };
    }
};

/**
 * Get unavailable hours for a room
 */
export const getUnavailableHoursAPI = async (room) => {
    try {
        const response = await axiosInstance.get("/rooms/reservations", {
            params: { room_number: room, status: "approved" },
        });

        const hours = response.data.reservations.map((res) => res.reservationHour);
        return { ok: true, hours };
    } catch (error) {
        return { ok: false, error: error.message, hours: [] };
    }
};
