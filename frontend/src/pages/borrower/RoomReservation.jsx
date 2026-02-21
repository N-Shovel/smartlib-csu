import { useState } from "react";
import { addReservation } from "../../services/reservationService";
import { ROOMS } from "../../config/rooms";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";

const RoomReservation = () => {
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();

  const handleReserve = () => {
    if (!room.trim()) {
      showError("Please choose a room");
      return;
    }
    addReservation({
      room: room.trim(),
      notes: notes.trim(),
      requestedBy: user?.email || "unknown"
    });
    setRoom("");
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
