// Purpose: Reusable metric card list used on staff dashboard views.
// Parts: default card model, props override logic, card mapping render.
const defaultCards = [
	{ label: "Pending approvals", value: "Check the queue" },
	{ label: "Borrower status", value: "Track active loans" },
	{ label: "Library rooms", value: "Upcoming reservations" }
];

const StaffSummaryCards = ({ cards = defaultCards }) => {
	return (
		<div className="stats-grid">
			{/* Allow callers to provide custom metrics; otherwise use fallback defaults. */}
			{cards.map((card) => (
				<div className="card" key={card.label}>
					<p className="micro">{card.label}</p>
					<h3>{card.value}</h3>
					{Array.isArray(card.stats) && card.stats.length > 0 ? (
						<div className="summary-card__stats" aria-label={`${card.label} stats`}>
							{card.stats.map((item) => (
								<span className="summary-card__stat" key={`${card.label}-${item}`}>
									{item}
								</span>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
};

export default StaffSummaryCards;
