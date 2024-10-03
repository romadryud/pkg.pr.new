import type { H3Event } from "h3";
import { server } from "~/server";


export default eventHandler((event: H3Event) => {
  console.log('heeloo')
  server.listen({
    onUnhandledRequest(request) {
      console.log(
        "Unhandled %s %s",
        request.method,
        request.url,
        request.body,
      );
    },
  });  
  
  return sendRedirect(event, "https://github.com/stackblitz-labs/pkg.pr.new");
});


