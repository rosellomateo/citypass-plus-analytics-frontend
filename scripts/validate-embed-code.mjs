import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

export function validateEmbedCode(html, document) {
  assert.doesNotMatch(html, /undefined</,
    'La plantilla contiene undefined<; no se puede publicar código alterado.');

  const javascriptTypes = new Set(['', 'module', 'text/javascript', 'application/javascript']);
  for (const [index, script] of [...document.querySelectorAll('script')].entries()) {
    const type = script.getAttribute('type')?.trim().toLowerCase() ?? '';
    // El JSON con los datos/marcadores es contenido inerte, no JavaScript.
    if (!javascriptTypes.has(type)) continue;
    const result = spawnSync(process.execPath, [
      '--input-type=' + (type === 'module' ? 'module' : 'commonjs'), '--check',
    ], {
      input: script.textContent,
      encoding: 'utf8',
      timeout: 10_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    // No ejecutar el código ni volcar el bundle completo en los logs del pipeline.
    assert.ifError(result.error);
    assert.equal(result.status, 0, `El JavaScript inline del script ${index + 1} tiene sintaxis inválida.`);
  }
}
