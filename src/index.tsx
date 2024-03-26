import { Elysia } from "elysia";
import { html } from "@elysiajs/html"
import { index } from "./views/index";
import { PrismaClient } from "@prisma/client";
import { Lucia, generateId } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { auth } from "./auth";
import { Login } from "./views/components/Login";
import { Account } from "./views/components/Account";
import { CardsList } from "./views/components/CardsList";

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

// Add a card
app.post('/add-card', async ({body, set, cookie: {lucia_session}}) => {
  const title = body.title;
  console.log(body);
  set.headers = {
    'HX-Trigger': 'cardEdit'
  }
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    if(user){
      const card = await prisma.card.create({
        data: {
          id: generateId(12),
          title: body.title || 'Untitled',
          content: body.description || ' ',
          archived: body.archived == 'on' ? true : false,
          color: 'blue',
          user: {
            connect: {
              id: user.id
            }
          }
        }
      })
      return null;
    }
  }
  return (set.redirect = '/login');
});

// Get cards
app.get('cards', async ({set, cookie: {lucia_session}}) => {
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    if(user){
      const cards = await prisma.card.findMany({
        where: {
          userId: user.id,
          archived: false
        }
      })
      if(cards.length > 0){
        return CardsList(cards);
      } else {
        return (<h1>No cards found</h1>);
      }
    }
  }
  return (set.redirect = '/login');
});

app.get('archived-cards', async ({set, cookie: {lucia_session}}) => {
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    if(user){
      const cards = await prisma.card.findMany({
        where: {
          userId: user.id,
          archived: true
        }
      })
      if(cards.length > 0){
        return CardsList(cards);
      } else {
        return (<h1>No cards found</h1>);
      }
    }
  }
  return (set.redirect = '/login');
});

app.delete('/delete-card/:id', async ({params, set, cookie: {lucia_session}}) => {
  set.headers = {
    'HX-Trigger': 'cardEdit'
  }
  const id = params.id;
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    if(user){
      const card = await prisma.card.delete({
        where: {
          id
        }
      })
    }
    return null;
  }
  return (set.redirect = '/login');
})

app.patch('/toggle-archived/:id', async ({params, set, cookie: {lucia_session}}) => {
  set.headers = {
    'HX-Trigger': 'cardEdit'
  }
  const id = params.id;
  if(lucia_session.value){
    const { user } = await lucia.validateSession(lucia_session.value);
    if(user){
      const card = await prisma.card.findUnique({
        where: {
          id
        }
      })
      console.log(card);
      if(card){
        const cardUpdate = await prisma.card.update({
          where: {
            id
          },
          data: {
            archived: !card.archived
          }
        })
        console.log(cardUpdate);
        return null
      }
    }
    return (set.status == 400);
  }
  return (set.redirect = '/login');
});

app.listen(process.env.PORT as string, () =>
  console.log(`🦊 Server started at ${app.server?.url.origin}`),
);
