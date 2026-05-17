export const isEmailVerified = (authUser) => {
	const confirmedAt = authUser?.email_confirmed_at;
	const metadataVerified = authUser?.user_metadata?.email_verified;
	const appMetadataVerified = authUser?.app_metadata?.email_verified;

	return Boolean(confirmedAt || metadataVerified || appMetadataVerified);
};

export const isAuthUserObject = (value) => {
	return Boolean(
		value &&
		typeof value === "object" &&
		(
			"email_confirmed_at" in value ||
			"app_metadata" in value ||
			"user_metadata" in value ||
			"identities" in value
		)
	);
};

export const needsEmailVerification = (authState) => {
	const authUser = isAuthUserObject(authState?.user) ? authState.user : null;
	return Boolean(authUser && !isEmailVerified(authUser));
};

export const getVerificationEmail = (authState, fallbackEmail = "") => {
	const authUser = isAuthUserObject(authState?.user) ? authState.user : null;
	return String(
		authUser?.email ||
		authState?.user?.email ||
		authState?.profile?.email ||
		fallbackEmail ||
		""
	).trim();
};