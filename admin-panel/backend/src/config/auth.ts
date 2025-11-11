export const authConfig = {
	jwtSecret: process.env.JWT_SECRET ?? "insecure-secret",
	sessionCookieName: "admin_session",
	sessionSecret: process.env.ADMIN_SESSION_SECRET ?? "session-secret",
	tokenExpiresIn: "30m",
	refreshTokenExpiresIn: "7d",
};

