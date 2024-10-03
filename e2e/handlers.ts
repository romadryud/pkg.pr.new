import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("*/webhook", () => {
    return HttpResponse.json({
      ok: true
    });
  }),
  http.post("*/check", () => {
    return HttpResponse.json({
      ok: true
    });
  }),
];


