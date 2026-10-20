import { mkdir, writeFile, readFile, readdir, unlink } from "node:fs/promises";

// VSCO 2 CE: original, uncompressed flute recordings (CC0), pinned revision.
const revision = "440300901dfe9275fd84e0b7763af1f8443ae62e";
const repository = "sgossner/VSCO-2-CE";
const base = `https://raw.githubusercontent.com/${repository}/${revision}/`;
async function get(path) {
  const response = await fetch(base + path);
  if (!response.ok) throw new Error(`${response.status}: ${path}`);
  return response;
}
// Preserve the original sample rate; downmix 24-bit stereo to 16-bit mono PCM.
// These acoustic solo recordings need no lossy encoding or runtime decoder.
function monoWav(data, layer) {
  let format, pcm;
  for (let pos = 12; pos + 8 <= data.length;) {
    const size = data.readUInt32LE(pos + 4),
      id = data.toString("ascii", pos, pos + 4);
    if (id === "fmt ") format = data.subarray(pos + 8, pos + 8 + size);
    if (id === "data") pcm = data.subarray(pos + 8, pos + 8 + size);
    pos += 8 + size + (size % 2);
  }
  if (!format || !pcm || format.readUInt16LE(0) !== 1)
    throw new Error("Expected PCM WAV");
  const channels = format.readUInt16LE(2),
    rate = format.readUInt32LE(4),
    bits = format.readUInt16LE(14);
  if (![16, 24].includes(bits))
    throw new Error(`Unsupported PCM depth ${bits}`);
  const width = bits / 8,
    frames = Math.floor(pcm.length / (width * channels));
  const output = Buffer.alloc(44 + frames * 2);
  output.write("RIFF", 0);
  output.writeUInt32LE(output.length - 8, 4);
  output.write("WAVEfmt ", 8);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22);
  output.writeUInt32LE(rate, 24);
  output.writeUInt32LE(rate * 2, 28);
  output.writeUInt16LE(2, 32);
  output.writeUInt16LE(16, 34);
  output.write("data", 36);
  output.writeUInt32LE(frames * 2, 40);
  let peak = 0,
    squares = 0;
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++)
      sum +=
        pcm.readIntLE((i * channels + c) * width, width) / 2 ** (bits - 16);
    const value = Math.max(-32768, Math.min(32767, Math.round(sum / channels)));
    output.writeInt16LE(value, 44 + i * 2);
    peak = Math.max(peak, Math.abs(value) / 32768);
    squares += (value / 32768) ** 2;
  }
  if (peak < 0.0001 || frames / rate < 0.1)
    throw new Error(
      `Silent or truncated flute recording: ${JSON.stringify({ peak, frames, rate, channels, bits })}`,
    );
  const rms = Math.sqrt(squares / frames);
  const gain = Math.min(0.85 / peak, (layer === "soft" ? 0.12 : 0.18) / rms);
  for (let i = 0; i < frames; i++)
    output.writeInt16LE(
      Math.round(output.readInt16LE(44 + i * 2) * gain),
      44 + i * 2,
    );
  return { output, seconds: frames / rate, peak: peak * gain, rms: rms * gain };
}
await mkdir("public/audio/flute", { recursive: true });
const zones = [],
  metrics = [];
const pitches = ["C3", "E3", "A3", "C4", "E4", "A4", "C5"];
for (const pitch of pitches) {
  const note = pitch[0] + (Number(pitch[1]) + 1); // Source uses C3 for middle C (MIDI 60).
  for (const layer of ["soft", "loud"]) {
    const velocity = layer === "soft" ? 1 : pitch === "C5" ? 2 : 3;
    const path = `Woodwinds/Flute/susNV/LDFlute_susNV_${pitch}_v${velocity}_1.wav`;
    zones.push({
      note,
      layer,
      articulation: "sustain",
      roundRobin: 0,
      file: `sustain-${layer}-${note}.wav`,
      source: path,
    });
  }
}
for (const pitch of ["A3", "C4", "E4", "A4", "C5"]) {
  const note = pitch[0] + (Number(pitch[1]) + 1);
  for (const layer of ["soft", "loud"])
    for (const roundRobin of [0, 1]) {
      const path = `Woodwinds/Flute/stac/LDFlute_stac_${pitch}_v${layer === "soft" ? 1 : 3}_rr${roundRobin + 1}.wav`;
      zones.push({
        note,
        layer,
        articulation: "staccato",
        roundRobin,
        file: `staccato-${layer}-${roundRobin}-${note}.wav`,
        source: path,
      });
    }
}
for (let i = 0; i < zones.length; i += 4) {
  await Promise.all(
    zones.slice(i, i + 4).map(async (zone) => {
      const data = Buffer.from(await (await get(zone.source)).arrayBuffer());
      const { output, ...metric } = monoWav(data, zone.layer);
      await writeFile(`public/audio/flute/${zone.file}`, output);
      metrics.push({ file: zone.file, ...metric });
    }),
  );
}
await writeFile(
  "src/flute-manifest.json",
  JSON.stringify(zones, null, 2) + "\n",
);
await writeFile(
  "public/audio/flute/CREDITS.txt",
  `VSCO 2 Community Edition flute recordings\nRecorded by Sam Gossner & Simon Dalzell, Versilian Studios / Ivy Audio.\nSample cutting: Elan Hickler / Soundemote.\nhttps://versilian-studios.com/vsco-community/\nhttps://github.com/${repository}\nRevision: ${revision}\n\nCC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/\n\nZengo conversions: stereo downmix to mono, 24-bit PCM to 16-bit PCM, loudness matched within each dynamic layer with peak protection.\nOriginal sample rate, attacks and natural releases preserved. No lossy compression.\nSource filenames are preserved in src/flute-manifest.json.\n\n` +
    (await (await get("LICENSE")).text()),
);
// Replace the initial single-layer MP3 flute with the articulated WAV library.
for (const file of await readdir("public/audio/flute"))
  if (file.endsWith(".mp3")) await unlink(`public/audio/flute/${file}`);
const legacyManifest = JSON.parse(
  await readFile("src/sample-manifest.json", "utf8"),
);
delete legacyManifest.flute;
await writeFile(
  "src/sample-manifest.json",
  JSON.stringify(legacyManifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    files: zones.length,
    minDuration: Math.min(...metrics.map((m) => m.seconds)),
    maxDuration: Math.max(...metrics.map((m) => m.seconds)),
    minPeak: Math.min(...metrics.map((m) => m.peak)),
    totalMB:
      metrics.reduce((sum, m) => sum + m.seconds * 48000 * 2, 0) / 1024 ** 2,
  }),
);
