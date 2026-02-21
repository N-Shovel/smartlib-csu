import { getBorrowerSignups } from "../../services/authService";
import { exportToCSV } from "../../services/exportService";
import { getBorrowerSignupsExport } from "../../data/exportBorrowerSignups";

const truncateText = (value, maxLength) => {
	const text = String(value || "-");
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
};

const StaffAndBorrowerList = () => {
	const borrowers = getBorrowerSignups();

	const handleExport = () => {
		if (borrowers.length === 0) return;
		exportToCSV(getBorrowerSignupsExport(borrowers), "borrower-signups.csv");
	};

	return (
		<section>
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
				<div className="card">
					<div className="table">
						<div className="table__row table__head">
							<span>First Name</span>
							<span>Last Name</span>
							<span>Course</span>
							<span>Year Level</span>
							<span>Contact</span>
							<span>Address</span>
							<span>Email</span>
						</div>
						{borrowers.map((borrower) => (
							<div className="table__row" key={borrower.email}>
								<span title={borrower.firstName || "-"}>
									{truncateText(borrower.firstName, 14)}
								</span>
								<span title={borrower.lastName || "-"}>
									{truncateText(borrower.lastName, 14)}
								</span>
								<span title={borrower.collegeCourse || "-"}>
									{truncateText(borrower.collegeCourse, 18)}
								</span>
								<span title={borrower.yearLevel || "-"}>
									{truncateText(borrower.yearLevel, 10)}
								</span>
								<span title={borrower.contactInfo || "-"}>
									{truncateText(borrower.contactInfo, 14)}
								</span>
								<span title={borrower.currentAddress || "-"}>
									{truncateText(borrower.currentAddress, 24)}
								</span>
								<span title={borrower.email || "-"}>
									{truncateText(borrower.email, 22)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	);
};

export default StaffAndBorrowerList;
