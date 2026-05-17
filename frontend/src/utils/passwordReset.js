export const extractAccessTokenFromLocation = (location) => {
	const searchParams = new URLSearchParams(location?.search || "");
	const queryToken = searchParams.get("accessToken") || searchParams.get("access_token");
	if (queryToken) return queryToken;

	const hashParams = new URLSearchParams(String(location?.hash || "").replace(/^#/, ""));
	return hashParams.get("access_token") || hashParams.get("accessToken") || "";
};

export const buildResetPasswordSearch = (accessToken) => {
	const params = new URLSearchParams();
	params.set("accessToken", accessToken);
	return `?${params.toString()}`;
};