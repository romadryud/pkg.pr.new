import { setupServer } from "msw/node";


export const server = setupServer();
console.log("msw started");


server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url)
})