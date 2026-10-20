import { mkdir, writeFile, stat } from "node:fs/promises";

// Run explicitly to vendor the CC BY 3.0 recordings; playback never uses a CDN.
const repository = "nbrosowsky/tonejs-instruments";
const headers = { "User-Agent": "Zengo-sample-import" };
async function get(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
}
const revision = "622c2f1c32c8cfce4158ddc3eb26e518ddef37e5";
const tree = (
  await (
    await get(
      `https://api.github.com/repos/${repository}/git/trees/${revision}?recursive=1`,
    )
  ).json()
).tree;
const manifest = {};
for (const [id, directory] of Object.entries({
  guitar: "guitar-acoustic",
  violin: "violin",
  trumpet: "trumpet",
})) {
  const files = tree.filter(
    (f) =>
      f.path.startsWith(`samples/${directory}/`) && f.path.endsWith(".mp3"),
  );
  if (!files.length) throw new Error(`No samples for ${id}`);
  await mkdir(`public/audio/${id}`, { recursive: true });
  manifest[id] = files.map((f) =>
    f.path.split("/").at(-1).replace(".mp3", "").replace("s", "#"),
  );
  for (let i = 0; i < files.length; i += 4) {
    await Promise.all(
      files.slice(i, i + 4).map(async (f) => {
        const destination = `public/audio/${id}/${f.path.split("/").at(-1)}`;
        if ((await stat(destination).catch(() => null))?.size > 1000) return;
        const data = await (
          await get(
            `https://raw.githubusercontent.com/${repository}/${revision}/${f.path}`,
          )
        ).arrayBuffer();
        if (data.byteLength < 1000)
          throw new Error(`Invalid recording: ${f.path}`);
        await writeFile(destination, Buffer.from(data));
      }),
    );
  }
  console.log(`${id}: ${files.length} recordings`);
}
await writeFile(
  "src/sample-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  "public/audio/INSTRUMENT-CREDITS.txt",
  `Zengo instrument recordings\n\nAcoustic guitar, violin and trumpet: N. P. Brosowsky, tonejs-instruments.\nhttps://github.com/${repository}\nSource revision: ${revision}\nSamples licensed under Creative Commons Attribution 3.0 Unported:\nhttps://creativecommons.org/licenses/by/3.0/\n\nMP3 files are redistributed unchanged. Zengo applies playback envelopes and gain.\nFlute: VSCO 2 CE / Versilian Studios, CC0. See flute/CREDITS.txt for source and conversions.\nOriginal source information:\n\n` +
    (await (
      await get(
        `https://raw.githubusercontent.com/${repository}/${revision}/sample-source-info.txt`,
      )
    ).text()),
);
