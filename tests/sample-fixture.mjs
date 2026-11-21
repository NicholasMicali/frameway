// Synthetic editor fixture imported through the same public backup flow as real projects.
export async function openSample(page) {
  const bytes = await page.evaluate(async () => {
    const { sampleProject } = await import('/src/sample.ts');
    const { exportProject } = await import('/src/archive.ts');
    return Array.from(
      new Uint8Array(await (await exportProject(await sampleProject())).arrayBuffer()),
    );
  });
  await page.locator('input[type="file"][accept=".zip"]').setInputFiles({
    name: 'synthetic.frameway.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(bytes),
  });
  return bytes;
}

export async function openAdvanced(page) {
  const toggle = page.getByRole('button', { name: 'Advanced', exact: true });
  if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
}
