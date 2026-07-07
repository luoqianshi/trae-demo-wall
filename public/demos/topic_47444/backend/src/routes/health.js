export default async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
