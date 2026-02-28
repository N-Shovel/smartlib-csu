// Purpose: Staff page for viewing borrower signups and exporting lists.
// Parts: data loading, helper formatting, export handler, table render.
import { useState } from "react";
import { getBorrowerSignups } from "../../services/authService";
import { exportToCSV } from "../../services/exportService";
import { getBorrowerSignupsExport } from "../../data/exportBorrowerSignups";

const truncateText = (value, maxLength) => {
	// Keep table columns compact while preserving full value in title tooltip.
	const text = String(value || "-");
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
};

const StaffAndBorrowerList = () => {
	const borrowers = getBorrowerSignups();
	const [selectedBorrower, setSelectedBorrower] = useState(null);

	const formatFullName = (borrower) => {
		const lastName = String(borrower.lastName || "").trim();
		const firstName = String(borrower.firstName || "").trim();
		const suffix = String(borrower.nameSuffix || "").trim();

		// Show suffix only when present; keep base name unchanged otherwise.
		const baseName = [lastName, firstName].filter(Boolean).join(", ");
		if (!baseName) return "-";

		return suffix ? `${baseName} ${suffix}` : baseName;
	};

	const handleExport = () => {
		if (borrowers.length === 0) return;
		// Export all borrower signup rows in one CSV file.
		exportToCSV(getBorrowerSignupsExport(borrowers), "borrower-signups.csv");
	};

	const openBorrowerDetails = (borrower) => {
		setSelectedBorrower(borrower);
	};

	const closeBorrowerDetails = () => {
		setSelectedBorrower(null);
	};

	return (
		<section className="staff-page staff-signups-page">
			<div className="page-header">
				<div>
					<h2>Borrower Signups</h2>
					<p className="muted">Accounts registered as borrowers.</p>
				</div>
				<button
					className="btn btn--ghost"
					onClick={handleExport}
					disabled={borrowers.length === 0}
				>
					Export CSV
				</button>
			</div>

			{borrowers.length === 0 ? (
				<div className="empty-state">No borrower signups yet.</div>
			) : (
				<div className="card table-scroll table-scroll--five staff-table-card">
					<table className="staff-signups-data-table">
						<colgroup>
							<col style={{ width: "24ch" }} />
							<col style={{ width: "12ch" }} />
							<col style={{ width: "24ch" }} />
							<col style={{ width: "18ch" }} />
							<col style={{ width: "30ch" }} />
							<col style={{ width: "10ch" }} />
						</colgroup>
						<thead>
							<tr>
								<th>Name</th>
								<th>Student ID</th>
								<th>Course - Year Level</th>
								<th>Email</th>
								<th>Address</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{borrowers.map((borrower) => (
								<tr key={borrower.email}>
									<td data-label="Name" title={formatFullName(borrower)}>
										{truncateText(
											formatFullName(borrower),
											28
										)}
									</td>
									<td data-label="Student ID" title={borrower.id || "-"}>
										{truncateText(borrower.id, 14)}
									</td>
									<td data-label="Course - Year Level" title={`${borrower.collegeCourse || "-"} - ${borrower.yearLevel || "-"}`}>
										{truncateText(
											`${borrower.collegeCourse || "-"} - ${borrower.yearLevel || "-"}`,
											26
										)}
									</td>
									<td data-label="Email" title={borrower.email || "-"}>
										{truncateText(borrower.email, 16)}
									</td>
									<td data-label="Address" title={borrower.currentAddress || "-"}>
										{truncateText(borrower.currentAddress, 24)}
									</td>
									<td data-label="Action">
										<button
											className="btn btn--ghost staff-signups-view-btn"
											onClick={() => openBorrowerDetails(borrower)}
										>
											View
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{selectedBorrower ? (
				<div className="modal-overlay" role="dialog" aria-modal="true">
					<div className="card modal-card modal-card--signup-details">
						<h3>Borrower Details</h3>
						<p>
							<strong>Name:</strong> {formatFullName(selectedBorrower)}
						</p>
						<p>
							<strong>Course - Year Level:</strong> {selectedBorrower.collegeCourse || "-"} - {selectedBorrower.yearLevel || "-"}
						</p>
						<p>
							<strong>Student ID:</strong> {selectedBorrower.id || "-"}
						</p>
						<p>
							<strong>Email:</strong> {selectedBorrower.email || "-"}
						</p>
						<p>
							<strong>Address:</strong> {selectedBorrower.currentAddress || "-"}
						</p>
						<div className="modal-actions">
							<button className="btn btn--danger" onClick={closeBorrowerDetails}>
								Close
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
};

export default StaffAndBorrowerList;
