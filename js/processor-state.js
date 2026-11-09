// Processor destinations in viewport NDC, consumed by the shared particle cloud.
export const processorState = {
  positions: new Float32Array(44000 * 3),
  strengths: new Float32Array(44000),
  version: 0,
  ready: false,
};
