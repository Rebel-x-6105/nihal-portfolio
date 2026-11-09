// Shared per-particle flow values for the gallery data tunnel.
export function createNetworkAttributes(count) {
  const flow = new Float32Array(count);
  const radius = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    flow[i] = Math.random();
    radius[i] = Math.sqrt(Math.random());
  }
  return { aFlowT: [flow, 1], aNodeRadius: [radius, 1] };
}
