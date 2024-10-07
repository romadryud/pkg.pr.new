import { setupServer } from "msw/node"; // Node.js server for MSW

// Initialize the MSW server with handlers
const server = setupServer();

// Start the server
server.listen({ onUnhandledRequest: "bypass" });

export default defineEventHandler((event) => {
  console.log("siemanko");
  return new Promise<void>((resolve) => {
    console.log("hello from worker ");

    console.log(event);
    resolve();
    // mswMiddleware(event.node.req, event.node.res, resolve);
  });
});

// import { setupServer } from "msw/node"; // Node.js server for MSW
// import { rest } from "msw";
// import { defineEventHandler } from "h3";
// import { handlers } from "~/mocks/handlers";

// // Initialize the MSW server with handlers
// const server = setupServer();

// // Start the server
// server.listen({ onUnhandledRequest: "bypass" });

// export default defineEventHandler(async (event) => {
//   const { req, res } = event.node;

//   // Manually intercept and process the request using MSW
//   const originalEnd = res.end; // Store the original `res.end` method

//   return new Promise((resolve) => {
//     res.end = (...args) => {
//       originalEnd.apply(res, args);
//       resolve(); // Ensure the request resolves after being handled by MSW
//     };

//     // Manually apply MSW request handling logic
//     server.emit("request", req, res);
//   });
// });
