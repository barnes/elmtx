import { GitHub, Google, generateCodeVerifier, generateState } from "arctic";
import { lucia, prisma } from "./index";
import { Argon2id } from "oslo/password";
import Elysia from "elysia";
import { generateId } from "lucia";
const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
const githubClientId = process.env.GITHUB_CLIENT_ID as string;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET as string;

const google = new Google(
    googleClientId,
    googleClientSecret,
    "http://localhost:3000/auth/google/callback"
);

const github = new GitHub(
    githubClientId,
    githubClientSecret,
    {
        redirectURI: "http://localhost:3000/auth/github/callback",
    }
);


export const auth = new Elysia({ prefix: "/auth" })
    .get(
        "/google",
        async ({ set, cookie: { google_state, google_code_verify } }) => {
            google_state.remove();
            google_code_verify.remove();
            // We create some tokens using arctic
            const state = generateState();
            const codeVerifier = generateCodeVerifier();
            // We generate the URL to redirect the user to Google Login
            const url = await google.createAuthorizationURL(
                state,
                codeVerifier,
                {
                    scopes: ["profile", "email"],
                }
            );
            // We store the state and codeVerifier in cookies
            google_state.value = state;
            google_code_verify.value = codeVerifier;
            google_state.set = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
            };
            google_code_verify.set = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
            };
            // We redirect the user to the URL
            return (set.redirect = url.toString() || "");
        }
    )
    .get(
        "/google/callback",
        async ({
            set,
            query,
            cookie: { google_state, google_code_verify, lucia_session },
        }) => {
            console.log("at callback");
            // We get the state and code from the query params
            const { state, code } = query;
            // We get the state and codeVerifier from the cookies
            const stateCookie = google_state.value;
            const codeVerifier = google_code_verify.value;

            console.log(state, code, stateCookie, codeVerifier);

            // We validate we have all the necessary data, and the state and codes match.
            if (
                !state ||
                !stateCookie ||
                !code ||
                stateCookie != state ||
                !codeVerifier
            ) {
                return (set.status = 400);
            }

            console.log("at callback 2");
            try {
                const tokens = await google.validateAuthorizationCode(
                    code,
                    codeVerifier
                );
                const response = await fetch(
                    "https://openidconnect.googleapis.com/v1/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${tokens.accessToken}`,
                        },
                    }
                );
                const user = await response.json();
                console.log(user);
                // See if user is in the database:
                const dbUser = await prisma.user.findFirst({
                    where: {
                        provider_id: user.sub,
                    },
                });
                // Create a session if user exists
                if (dbUser) {
                    const session = await lucia.createSession(dbUser.id, {});
                    const sessionCookieLucia = lucia.createSessionCookie(
                        session.id
                    );
                    console.log(sessionCookieLucia);
                    lucia_session.value = sessionCookieLucia.value;
                    lucia_session.set(sessionCookieLucia.attributes);
                    return (set.redirect = "/");
                }
                // Add user if there is no user in the database:
                if (!dbUser) {
                    console.log("adding user");
                    const id = generateId(12);
                    await prisma.user.create({
                        data: {
                            id: id,
                            provider_id: user.sub,
                            provider_user_id: user.name,
                        },
                    });
                    // Create a session after adding user
                    const session = await lucia.createSession(id, {});
                    const sessionCookieLucia = lucia.createSessionCookie(
                        session.id
                    );
                    lucia_session.value = sessionCookieLucia.value;
                    lucia_session.set(sessionCookieLucia.attributes);
                    return (set.redirect = "/");
                }
            } catch (error) {
                console.log(error);
                return (set.status = 400);
            }
        }
    )
    .get(
        "/github",
        async ({ set, cookie: { github_state } }) => {
            // We create some tokens using arctic
            const state = generateState();
            // We generate the URL to redirect the user to Google Login
            const url = await github.createAuthorizationURL(
                state,
            );
            // We store the state and codeVerifier in cookies
            github_state.value = state;
            github_state.set = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
            };
            // We redirect the user to the URL
            return (set.redirect = url.toString() || "");
        }
    )
    .get(
        "/github/callback",
        async ({
            set,
            query,
            cookie: { github_state, lucia_session },
        }) => {
            // We get the state and code from the query params
            const { state, code } = query;
            // We get the state and codeVerifier from the cookies
            const stateCookie = github_state.value;

            console.log(state, code, stateCookie);

            // We validate we have all the necessary data, and the state and codes match.
            if (
                !state ||
                !stateCookie ||
                !code ||
                stateCookie != state 
            ) {
                return (set.status = 400);
            }

            try {
                const tokens = await github.validateAuthorizationCode(code);
                console.log(tokens.accessToken)
                const response = await fetch(
                    "https://api.github.com/user",
                    {
                        headers: {
                            Authorization: `Bearer ${tokens.accessToken}`,
                        },
                    }
                );
                const user = await response.json();
                console.log(user);
                // See if user is in the database:
                const dbUser = await prisma.user.findFirst({
                    where: {
                        provider_id: user.id,
                    },
                });
                // Create a session if user exists
                if (dbUser) {
                    const session = await lucia.createSession(dbUser.id, {});
                    const sessionCookieLucia = lucia.createSessionCookie(
                        session.id
                    );
                    console.log(sessionCookieLucia);
                    lucia_session.value = sessionCookieLucia.value;
                    lucia_session.set(sessionCookieLucia.attributes);
                    return (set.redirect = "/");
                }
                // Add user if there is no user in the database:
                if (!dbUser) {
                    console.log("adding user");
                    const id = generateId(12);
                    await prisma.user.create({
                        data: {
                            id: id,
                            provider_id: user.id,
                            provider_user_id: user.login,
                        },
                    });
                    // Create a session after adding user
                    const session = await lucia.createSession(id, {});
                    const sessionCookieLucia = lucia.createSessionCookie(
                        session.id
                    );
                    lucia_session.value = sessionCookieLucia.value;
                    lucia_session.set(sessionCookieLucia.attributes);
                    return (set.redirect = "/");
                }
            } catch (error) {
                console.log(error);
                return (set.status = 400);
            }
        }
    )
    .get("/logout", async ({ set, cookie: { lucia_session } }) => {
        await lucia.invalidateSession(lucia_session.value);
        const sessionCookieBlank = lucia.createBlankSessionCookie();
        lucia_session.value = sessionCookieBlank.value;
        lucia_session.set(sessionCookieBlank.attributes);
        return (set.redirect = "/");
    })
    
