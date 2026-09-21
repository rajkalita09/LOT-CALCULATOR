import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 7071);

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function calculatePlan(plan) {
  const totalLot = Number(plan.totalLot);
  const stopLossPips = Number(plan.stopLossPips);
  const exits = Array.isArray(plan.exits) ? plan.exits : [];
  const risk = totalLot > 0 && stopLossPips >= 0 ? Number((totalLot * stopLossPips).toFixed(2)) : 0;
  const reward = exits.reduce((sum, exit) => {
    const lot = Number(exit.lot);
    const pips = exit.type === 'trailing' ? Number(exit.trailingPips ?? exit.tpPips) : Number(exit.tpPips);
    return Number.isFinite(lot) && Number.isFinite(pips) ? sum + lot * pips : sum;
  }, 0);
  const ratio = risk > 0 ? reward / risk : 0;
  const targetReward = risk * Number(plan.targetRr ?? 0);
  const booked = exits.slice(0, -1).reduce((sum, exit) => {
    const pips = exit.type === 'trailing' ? Number(exit.trailingPips ?? exit.tpPips) : Number(exit.tpPips);
    return sum + Number(exit.lot) * pips;
  }, 0);
  const remainingLot = Number(exits.at(-1)?.lot ?? 0);
  const requiredFinalTp = remainingLot > 0 ? Math.max(0, targetReward - booked) / remainingLot : 0;

  return {
    reward,
    risk,
    ratio,
    requiredFinalTp: Number(requiredFinalTp.toFixed(0)),
    exits,
  };
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  return JSON.parse(body || '{}');
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/api/health') {
    json(response, 200, { status: 'ok', service: 'lot-calculator-api' });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/calculations') {
    try {
      const plan = await readJson(request);
      if (!Number.isFinite(Number(plan.totalLot)) || !Number.isFinite(Number(plan.stopLossPips)) || !Array.isArray(plan.exits)) {
        json(response, 400, { error: 'totalLot, stopLossPips, and exits are required' });
        return;
      }
      json(response, 200, { data: calculatePlan(plan) });
    } catch {
      json(response, 400, { error: 'Request body must be valid JSON' });
    }
    return;
  }

  json(response, 404, { error: 'Not found' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Lot calculator API listening on http://localhost:${port}`);
});
