/**
 * Server-safe WebM duration repair (pure, no DOM / no deps).
 *
 * Browser MediaRecorder writes WEBM_OPUS with NO Duration in its Segment/Info
 * header (the header is finalized before recording stops). Google Speech-to-Text
 * then can't determine the clip length and rejects it on every endpoint. The
 * client patches this before upload, but audio that was ALREADY uploaded (e.g.
 * before that fix shipped) is stranded — and a candidate can't re-record a
 * submitted exam answer. So we also repair on the server, right before sending
 * the bytes to Google:
 *
 *  1. compute the real duration from the cluster/block timecodes, then
 *  2. inject a Duration element into Segment > Info.
 *
 * We only ever patch the copy sent to Google — never the stored object — so if
 * parsing is uncertain we return the bytes unchanged and transcription simply
 * fails as before (→ manual grading). It cannot make things worse.
 */

// EBML element IDs (kept with their marker bits, as they appear on the wire).
const ID_SEGMENT = 0x18538067;
const ID_INFO = 0x1549a966;
const ID_TIMECODE_SCALE = 0x2ad7b1;
const ID_DURATION = 0x4489;
const ID_CLUSTER = 0x1f43b675;
const ID_CLUSTER_TIMECODE = 0xe7;
const ID_SIMPLEBLOCK = 0xa3;
const ID_BLOCKGROUP = 0xa0;
const ID_BLOCK = 0xa1;

interface Element {
  id: number;
  contentStart: number;
  contentEnd: number; // exclusive
  sizeStart: number;
  sizeLen: number;
  unknownSize: boolean;
}

/** Read an EBML element ID at `pos`. The value keeps its marker bits. */
function readId(buf: Uint8Array, pos: number): { id: number; len: number } {
  const first = buf[pos];
  if (first === undefined) throw new Error("eof");
  let len = 1;
  let mask = 0x80;
  while (len <= 4 && (first & mask) === 0) {
    mask >>= 1;
    len++;
  }
  if (len > 4) throw new Error("bad id");
  let id = 0;
  for (let i = 0; i < len; i++) id = id * 256 + buf[pos + i];
  return { id, len };
}

/** Read an EBML size VINT at `pos`. Marker bit is stripped from the value. */
function readSize(
  buf: Uint8Array,
  pos: number,
): { size: number; len: number; unknown: boolean } {
  const first = buf[pos];
  if (first === undefined) throw new Error("eof");
  let len = 1;
  let mask = 0x80;
  while (len <= 8 && (first & mask) === 0) {
    mask >>= 1;
    len++;
  }
  if (len > 8) throw new Error("bad size");
  let value = first & (mask - 1);
  let allOnes = value === mask - 1;
  for (let i = 1; i < len; i++) {
    const b = buf[pos + i];
    value = value * 256 + b;
    if (b !== 0xff) allOnes = false;
  }
  return { size: value, len, unknown: allOnes };
}

/** Encode `value` as a VINT of exactly `len` bytes, or null if it doesn't fit. */
function writeSize(value: number, len: number): number[] | null {
  const maxByFirstByte = 0x80 >> (len - 1); // marker bit position in byte 0
  const max = maxByFirstByte * 256 ** (len - 1) - 1;
  if (value < 0 || value > max) return null;
  const bytes = new Array(len).fill(0);
  let v = value;
  for (let i = len - 1; i >= 0; i--) {
    bytes[i] = v & 0xff;
    v = Math.floor(v / 256);
  }
  bytes[0] |= maxByFirstByte;
  return bytes;
}

/** Read an unsigned big-endian integer of `len` bytes. */
function readUint(buf: Uint8Array, pos: number, len: number): number {
  let v = 0;
  for (let i = 0; i < len; i++) v = v * 256 + buf[pos + i];
  return v;
}

/** Parse one element header at `pos`, bounded by `end`. */
function readElement(buf: Uint8Array, pos: number, end: number): Element {
  const { id, len: idLen } = readId(buf, pos);
  const sizeStart = pos + idLen;
  const { size, len: sizeLen, unknown } = readSize(buf, sizeStart);
  const contentStart = sizeStart + sizeLen;
  const contentEnd = unknown ? end : contentStart + size;
  return {
    id,
    contentStart,
    contentEnd: Math.min(contentEnd, end),
    sizeStart,
    sizeLen,
    unknownSize: unknown,
  };
}

/** Iterate the direct child elements within [start, end). */
function* children(buf: Uint8Array, start: number, end: number): Generator<Element> {
  let pos = start;
  while (pos < end) {
    const el = readElement(buf, pos, end);
    yield el;
    pos = el.contentEnd;
    if (el.contentEnd <= el.contentStart && el.unknownSize) break;
  }
}

/**
 * Compute the WebM duration (in TimecodeScale ticks) by a LINEAR walk of the
 * Segment content. We descend into Cluster/BlockGroup containers and skip all
 * other elements by their size, tracking the running Cluster Timecode and the
 * furthest block end. Walking linearly (rather than trusting Cluster sizes)
 * handles the unknown-size Clusters that MediaRecorder often emits — a Cluster
 * simply ends when the next Cluster's header appears.
 */
function durationTicks(buf: Uint8Array, start: number, end: number): number | null {
  let maxEnd = -1;
  let base = 0; // current Cluster Timecode
  let pos = start;
  let steps = 0;
  while (pos < end) {
    if (++steps > 5_000_000) return null; // runaway guard
    const el = readElement(buf, pos, end);
    if (el.id === ID_CLUSTER || el.id === ID_BLOCKGROUP) {
      // Descend: step INTO the container (don't skip by size).
      pos = el.contentStart;
      continue;
    }
    if (el.id === ID_CLUSTER_TIMECODE) {
      base = readUint(buf, el.contentStart, el.contentEnd - el.contentStart);
    } else if (el.id === ID_SIMPLEBLOCK || el.id === ID_BLOCK) {
      const track = readSize(buf, el.contentStart); // track number VINT
      const relPos = el.contentStart + track.len;
      const rel = (buf[relPos] << 8) | buf[relPos + 1];
      const relSigned = rel >= 0x8000 ? rel - 0x10000 : rel;
      const blockEnd = base + relSigned;
      if (blockEnd > maxEnd) maxEnd = blockEnd;
    }
    // Skip this element by its size. An unknown-size non-container we can't
    // step past safely — bail so we don't loop.
    if (el.unknownSize) return maxEnd < 0 ? null : maxEnd + 20;
    if (el.contentEnd <= pos) return null;
    pos = el.contentEnd;
  }
  if (maxEnd < 0) return null;
  // Add ~20ms (in ticks) for the final frame's own length.
  return maxEnd + 20;
}

/** Read a float (4 or 8 bytes, big-endian) at [start, start+len). */
function readFloat(buf: Uint8Array, start: number, len: number): number {
  const dv = new DataView(buf.buffer, buf.byteOffset + start, len);
  return len === 4 ? dv.getFloat32(0, false) : dv.getFloat64(0, false);
}

/** Encode a float of `len` bytes (4 or 8), big-endian. */
function floatBytes(value: number, len: number): number[] {
  const b = new Uint8Array(len);
  const dv = new DataView(b.buffer);
  if (len === 4) dv.setFloat32(0, value, false);
  else dv.setFloat64(0, value, false);
  return Array.from(b);
}

/**
 * Ensure the WebM has a Segment > Info > Duration. Returns a NEW byte array with
 * the duration injected, or the original bytes when a Duration is already
 * present or anything can't be parsed with confidence.
 */
export function ensureWebmDuration(input: Uint8Array): Uint8Array {
  try {
    // Locate the Segment at the top level.
    let segment: Element | null = null;
    for (const el of children(input, 0, input.length)) {
      if (el.id === ID_SEGMENT) {
        segment = el;
        break;
      }
    }
    if (!segment) return input;

    // Find Info, its TimecodeScale, and any existing Duration element.
    let info: Element | null = null;
    let durationEl: Element | null = null;
    let timecodeScale = 1_000_000; // default: 1ms per tick
    for (const el of children(input, segment.contentStart, segment.contentEnd)) {
      if (el.id !== ID_INFO) continue;
      info = el;
      for (const c of children(input, el.contentStart, el.contentEnd)) {
        if (c.id === ID_DURATION) durationEl = c;
        else if (c.id === ID_TIMECODE_SCALE) {
          timecodeScale = readUint(
            input,
            c.contentStart,
            c.contentEnd - c.contentStart,
          );
        }
      }
      break;
    }
    if (!info || timecodeScale <= 0) return input;

    // A valid, positive Duration already present → leave the file untouched.
    if (durationEl) {
      const len = durationEl.contentEnd - durationEl.contentStart;
      if (len === 4 || len === 8) {
        const cur = readFloat(input, durationEl.contentStart, len);
        if (Number.isFinite(cur) && cur > 0) return input;
      }
    }

    const ticks = durationTicks(input, segment.contentStart, segment.contentEnd);
    // Sanity-bound: > 0 and ≤ 6h, so a mis-parse can't inject a wild value.
    const maxTicks = (6 * 3600 * 1000 * 1_000_000) / timecodeScale;
    if (ticks == null || ticks <= 0 || ticks > maxTicks) return input;

    // Case A: a Duration element exists but is zero/invalid — overwrite it in
    // place (same byte length), so no size fields need to change.
    if (durationEl) {
      const len = durationEl.contentEnd - durationEl.contentStart;
      if (len !== 4 && len !== 8) return input;
      const out = input.slice();
      const bytes = floatBytes(ticks, len);
      for (let i = 0; i < len; i++) out[durationEl.contentStart + i] = bytes[i];
      return out;
    }

    // Case B: no Duration element — insert one as Info's first child.
    // Duration element: id 0x4489 + size 0x88 (8) + 8-byte double, value in ticks.
    const newEl = [0x44, 0x89, 0x88, ...floatBytes(ticks, 8)];
    const insertAt = info.contentStart;
    const added = newEl.length; // 11

    // Grow Info's size (same-width VINT) to cover the new child.
    if (info.unknownSize) return input; // Info with unknown size: bail (rare).
    const infoSize = readSize(input, info.sizeStart);
    const newInfoSizeBytes = writeSize(infoSize.size + added, infoSize.len);
    if (!newInfoSizeBytes) return input;

    // Grow the Segment's size too, unless it's the unknown-size sentinel.
    let newSegSizeBytes: number[] | null = null;
    if (!segment.unknownSize) {
      const segSize = readSize(input, segment.sizeStart);
      newSegSizeBytes = writeSize(segSize.size + added, segment.sizeLen);
      if (!newSegSizeBytes) return input;
    }

    // Rebuild the buffer with the patches applied.
    const out = new Uint8Array(input.length + added);
    out.set(input, 0);
    // Shift everything from insertAt right by `added`, then write the element.
    out.copyWithin(insertAt + added, insertAt, input.length);
    for (let i = 0; i < newEl.length; i++) out[insertAt + i] = newEl[i];
    // Overwrite size fields in place (positions are before insertAt).
    for (let i = 0; i < newInfoSizeBytes.length; i++) {
      out[info.sizeStart + i] = newInfoSizeBytes[i];
    }
    if (newSegSizeBytes) {
      for (let i = 0; i < newSegSizeBytes.length; i++) {
        out[segment.sizeStart + i] = newSegSizeBytes[i];
      }
    }
    return out;
  } catch {
    return input; // Any parse trouble → leave the bytes untouched.
  }
}
