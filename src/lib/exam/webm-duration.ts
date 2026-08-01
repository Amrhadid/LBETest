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

/** Compute the WebM duration (in TimecodeScale ticks) from block timecodes. */
function durationTicks(buf: Uint8Array, segment: Element): number | null {
  let maxEnd = -1;
  for (const el of children(buf, segment.contentStart, segment.contentEnd)) {
    if (el.id !== ID_CLUSTER) continue;
    let clusterTc = 0;
    for (const c of children(buf, el.contentStart, el.contentEnd)) {
      if (c.id === ID_CLUSTER_TIMECODE) {
        clusterTc = readUint(buf, c.contentStart, c.contentEnd - c.contentStart);
        break;
      }
    }
    for (const c of children(buf, el.contentStart, el.contentEnd)) {
      let blockStart: number | null = null;
      if (c.id === ID_SIMPLEBLOCK) blockStart = c.contentStart;
      else if (c.id === ID_BLOCKGROUP) {
        for (const bg of children(buf, c.contentStart, c.contentEnd)) {
          if (bg.id === ID_BLOCK) {
            blockStart = bg.contentStart;
            break;
          }
        }
      }
      if (blockStart == null) continue;
      const track = readSize(buf, blockStart); // track number VINT
      const relPos = blockStart + track.len;
      const rel = (buf[relPos] << 8) | buf[relPos + 1];
      const relSigned = rel >= 0x8000 ? rel - 0x10000 : rel;
      const end = clusterTc + relSigned;
      if (end > maxEnd) maxEnd = end;
    }
  }
  if (maxEnd < 0) return null;
  // Add ~20ms (in ticks) for the final frame's own length.
  return maxEnd + 20;
}

/** Big-endian IEEE-754 double as 8 bytes. */
function f64be(value: number): number[] {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setFloat64(0, value, false);
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

    // Find Info, its TimecodeScale, and whether a Duration already exists.
    let info: Element | null = null;
    let hasDuration = false;
    let timecodeScale = 1_000_000; // default: 1ms per tick
    for (const el of children(input, segment.contentStart, segment.contentEnd)) {
      if (el.id !== ID_INFO) continue;
      info = el;
      for (const c of children(input, el.contentStart, el.contentEnd)) {
        if (c.id === ID_DURATION) hasDuration = true;
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
    if (!info || hasDuration || timecodeScale <= 0) return input;

    const ticks = durationTicks(input, segment);
    if (ticks == null || ticks <= 0) return input;

    // Duration element: id 0x4489 + size 0x88 (8) + 8-byte double, value in ticks.
    const durationEl = [0x44, 0x89, 0x88, ...f64be(ticks)];
    const insertAt = info.contentStart;
    const added = durationEl.length; // 11

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
    for (let i = 0; i < durationEl.length; i++) out[insertAt + i] = durationEl[i];
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
