// Render bindings (docs/changes/render-bindings.md): a rendering is a VIEW over
// mapped source data. Every visual channel it draws is declared here with the
// source field it reads (Port > object > field), a transform, a legend and a
// change policy. The renderer only ever receives bound values; a channel with
// no binding resolves to NOT_MAPPED and is drawn as "not mapped", never as an
// invented value.
//
// This is the LOCAL registry with the shared contract. The platform registry
// (server/lib/renderBindingRegistry.js) is not merged yet; when it lands this
// module swaps its source of bindings without changing any renderer.
//
// Binding shape:
//   { id, rendering, mark, channel,
//     source: { portKey, objectKey, fieldKey },
//     transform, legend,
//     changePolicy: 'live' | 'requires_approval', approver?,
//     value(entity, ctx)  -> the raw bound value the renderer draws,
//     read(entity, ctx)   -> a short text of the current value, for the Data map }

export const NOT_MAPPED = Object.freeze({ notMapped: true });

export function createBindingSet(rendering, bindings) {
  const byId = new Map(bindings.map((b) => [b.id, { rendering, ...b }]));
  return {
    rendering,
    list: () => [...byId.values()],
    get: (id) => byId.get(id) || null,
    /** The value for one channel of one entity, or NOT_MAPPED when the channel has no binding. */
    resolve(id, entity, ctx) {
      const b = byId.get(id);
      return b ? b.value(entity, ctx) : NOT_MAPPED;
    },
    /** Rows for the Data map panel: every channel, where it comes from, its current value and policy. */
    dataMap(entity, ctx) {
      return [...byId.values()].map((b) => ({
        id: b.id, mark: b.mark, channel: b.channel, legend: b.legend, transform: b.transform,
        source: `${b.source.portKey} › ${b.source.objectKey} › ${b.source.fieldKey}`,
        changePolicy: b.changePolicy, approver: b.approver || null,
        current: entity ? b.read(entity, ctx) : null,
      }));
    },
  };
}

export const isMapped = (v) => v !== NOT_MAPPED;
