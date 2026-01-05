export default {
  async fetch(_request) {
    return new Response("ASIAGOLD Worker OK", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
