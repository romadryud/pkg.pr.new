import type { H3Event } from "h3";

export default eventHandler((event: H3Event) => {
  console.log("siema event");
  return sendRedirect(event, "https://github.com/stackblitz-labs/pkg.pr.new");
});
