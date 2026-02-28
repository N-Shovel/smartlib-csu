// Purpose: Borrower page to request and track room reservations.
// Parts: form state, slot derivations, submit workflow, reservations render.
import { useMemo, useState } from "react";
import {
  addReservation,
  getReservationHourOptions,
  getUnavailableReservationHours,
  isLunchBreakHour
} from "../../services/reservationService";
import { ROOMS } from "../../config/rooms";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";

const reservationHourOptions = getReservationHourOptions();

const RoomReservation = () => {
  const [room, setRoom] = useState("");
  const [reservationHour, setReservationHour] = useState("");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();
  // Recompute unavailable slots whenever selected room changes.
  const unavailableHours = useMemo(
    () => getUnavailableReservationHours(room),
    [room]
  );

  const handleReserve = () => {
    // Guard clauses keep validation flow straightforward and readable.
    if (!room.trim()) {
      showError("Please choose a room");
      return;
    }
    if (!reservationHour) {
      showError("Please choose a time slot");
      return;
    }
    if (unavailableHours.has(Number(reservationHour))) {
      showError("Selected time slot is unavailable.");
      return;
    }

    const result = addReservation({
      room: room.trim(),
      reservationHour: Number(reservationHour),
      notes: notes.trim(),
      // Attach requester identity for ownership/history tracking.
      requestedBy: user?.email || "unknown"
    });

    if (!result.ok) {
      showError(result.error || "Unable to submit reservation");
      return;
    }

    setRoom("");
    setReservationHour("");
    setNotes("");
    showSuccess("Reservation request submitted");
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Room Reservation</h2>
          <p className="muted">Reserve a study space for your session.</p>
        </div>
      </div>
      <div className="card form">
        <div className="form-row">
          <div className="form-field">
            <label className="label">Room name</label>
            <select
              className="select"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              <option value="">Select a room</option>
              {ROOMS.map((roomOption) => (
                <option key={roomOption.id} value={roomOption.name}>
                  {roomOption.name} · {roomOption.capacity} seats
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="label">Time slot (1 hour)</label>
            <select
              className="select"
              value={reservationHour}
              onChange={(e) => setReservationHour(e.target.value)}
            >
              <option value="">Select time (8:00 AM - 6:00 PM)</option>
              {reservationHourOptions.map((slot) => {
                // Slot can be unavailable due to lunch break or approved reservation.
                const isUnavailable = unavailableHours.has(slot.value);
                const stateLabel = isUnavailable
                  ? isLunchBreakHour(slot.value)
                    ? "Lunch Break"
                    : "Reserved"
                  : "";

                return (
                  <option
                    key={slot.value}
                    value={slot.value}
                    disabled={isUnavailable}
                  >
                    {stateLabel ? `${slot.label} (${stateLabel})` : slot.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <label className="label">Notes</label>
        <textarea
          className="input input--area"
          placeholder="Time range, team size, or equipment needs"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="btn btn--primary" onClick={handleReserve}>
          Reserve
        </button>
      </div>
    </section>
  );
};

export default RoomReservation;
