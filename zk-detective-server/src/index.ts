// F14: Worker entry — routes all requests to the single GameServerDO instance
export { GameServerDO } from './game-server'

interface Env {
  GAME_SERVER: DurableObjectNamespace
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

    // Route /ws and /health to the single DO instance
    if (url.pathname === '/ws' || url.pathname === '/health') {
      const id = env.GAME_SERVER.idFromName('main')
      const stub = env.GAME_SERVER.get(id)
      const response = await stub.fetch(request)

      // WebSocket upgrades can't have extra headers; only add CORS to non-101
      if (response.status === 101) {
        return response
      }

      const newResponse = new Response(response.body, response)
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        newResponse.headers.set(k, v)
      }
      return newResponse
    }

    return new Response('ZK Detective PvP Server', {
      status: 200,
      headers: CORS_HEADERS,
    })
  },
} satisfies ExportedHandler<Env>
