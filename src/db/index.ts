import { PrismaClient } from "@prisma/client";
import { Lucia } from 'lucia';
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";

export const prisma = new PrismaClient();
export const adapter = new PrismaAdapter(prisma.session, prisma.user);
export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: process.env.NODE_ENV === "production",
        }
    }
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}

