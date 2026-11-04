import sharp from 'sharp';

export async function validateWebp(buffer, viewport) {
  const image = sharp(buffer, { failOn: 'warning' });
  const metadata = await image.metadata();
  if (metadata.format !== 'webp' || metadata.width !== viewport.width || metadata.height !== viewport.height || (metadata.pages ?? 1) !== 1) {
    throw new Error(`Expected a static ${viewport.width}×${viewport.height} WebP; got ${metadata.format} ${metadata.width}×${metadata.height}`);
  }
  await image.raw().toBuffer(); // Decode the entire file, including pixel data.
}
