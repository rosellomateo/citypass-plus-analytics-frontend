import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { validateEmbedCode } from './validate-embed-code.mjs';

const directory = new URL('../dist-embed/', import.meta.url);
assert.deepEqual(await readdir(directory), ['embed.html'], 'El build debe producir un único HTML.');
const html = await readFile(new URL('embed.html', directory));
const htmlText = html.toString('utf8');
assert.ok(html.length <= 5 * 1024 * 1024, 'La plantilla supera el límite de 5 MiB del backend.');
for (const marker of ['__CITYPASS_MODULO__', '__CITYPASS_DATOS__']) {
  assert.equal(htmlText.split(marker).length - 1, 1, 'Cada marcador debe aparecer exactamente una vez.');
}
const dom = new JSDOM(htmlText);
const document = dom.window.document;
validateEmbedCode(htmlText, document);
assert.equal(document.documentElement.dataset.modulo, '__CITYPASS_MODULO__');
assert.equal(document.querySelector('#citypass-datos[type="application/json"]')?.textContent,
  '__CITYPASS_DATOS__');
assert.ok(document.querySelector('script[type="module"]')?.textContent);
assert.equal(document.querySelectorAll('[src], link[href], [srcset]').length, 0,
  'El paquete no debe depender de archivos externos.');
for (const style of document.querySelectorAll('style')) {
  assert.doesNotMatch(style.textContent, /@import\b/i, 'El CSS no debe importar recursos.');
  for (const match of style.textContent.matchAll(/url\(\s*['"]?([^)'"\s]+)/gi)) {
    assert.match(match[1], /^(data:|#)/i, 'Los recursos CSS deben estar incluidos.');
  }
}
dom.window.close();

const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
assert.match(commit, /^[a-f0-9]{40}$/);
const manifest = {
  schemaVersion: 1,
  commit,
  modules: ['reclamos', 'emergencias', 'movilidad', 'espacios', 'residuos', 'identidad'],
  template: 'embed.html',
  sha256: createHash('sha256').update(html).digest('hex'),
  bytes: html.length,
};
const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
await writeFile(new URL('manifest.json', directory), manifestJson);
await writeFile(new URL('SHA256SUMS', directory), [
  `${manifest.sha256}  embed.html`,
  `${createHash('sha256').update(manifestJson).digest('hex')}  manifest.json`,
].join('\n') + '\n');
console.log(`Paquete embed validado: ${html.length} bytes, commit ${commit}`);
