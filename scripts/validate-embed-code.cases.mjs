import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { validateEmbedCode } from './validate-embed-code.mjs';

function validate(html) {
  const dom = new JSDOM(html);
  try {
    validateEmbedCode(html, dom.window.document);
  } finally {
    dom.window.close();
  }
}

test('accepts valid module code without executing it or interpreting the JSON marker', () => {
  assert.doesNotThrow(() => validate(`
    <html data-modulo="__CITYPASS_MODULO__">
      <script type="module">throw new Error('must not execute');</script>
      <script id="citypass-datos" type="application/json">__CITYPASS_DATOS__</script>
    </html>`));
});

for (const [name, html] of [
  ['HTML', '<body>undefined<div id="root"></div></body>'],
  ['JavaScript', '<script type="module">if (valueundefined<2) {}</script>'],
  ['CSS', '<style>@media (widthundefined<=768px) {}</style>'],
]) {
  test(`rejects undefined< corruption in ${name}`, () => {
    assert.throws(() => validate(html), /La plantilla contiene undefined</);
  });
}

test('rejects other JavaScript syntax errors without undefined<', () => {
  assert.throws(() => validate('<script type="module">const value = ;</script>'),
    /JavaScript inline.*sintaxis inválida/);
});

test('checks every executable script, including classic JavaScript', () => {
  assert.throws(() => validate('<script type="module">const a = 1;</script><script>const b = ;</script>'),
    /script 2.*sintaxis inválida/);
});

test('accepts legitimate undefined values and less-than operators', () => {
  assert.doesNotThrow(() => validate('<script>let value; if (1<2) console.log(typeof value === "undefined");</script>'));
});
