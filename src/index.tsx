import { Elysia } from "elysia";
import { html } from "@elysiajs/html"
import { index } from "./views/index";
import { PrismaClient } from "@prisma/client";
import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { auth } from "./auth";
import { Login } from "./views/components/Login";
import { Account } from "./views/components/Account";

export const prisma = new PrismaClient();
const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    }
  },
 
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}


const app = new Elysia().use(html()).use(auth)

app.get('/', async ({cookie: {lucia_session}}) => {
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    return index(user);
  } else {
    return index(null);
  }
})

app.get('/account', ({}) => {
  return Account
});

app.get('/login', ()=> {
  return Login
})

app.post('/add-card', async ({body, cookie: {lucia_session}}) => {
  console.log('DROM ADD CARD', body);
  console.log(lucia_session.value);
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    console.log(user);
    if(user){
      console.log('user is true')
      const card = await prisma.card.create({
        data: {
          title: body.title,
          content: body.description,
          archived: body.archive ? true : false,
          color: 'blue',
          userId: user.id,
          user: {
            connect: {
              id: user.id
            }
          }
        }
      })
      console.log(card);
    }
  }
  return null;
});

app.listen(process.env.PORT as string, () =>
  console.log(`🦊 Server started at ${app.server?.url.origin}`),
);
