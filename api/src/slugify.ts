/**
 * Generates a URL-safe slug from a character name.
 * - Converts to lowercase
 * - Removes accents/diacritics
 * - Replaces spaces with hyphens
 * - Removes special characters
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accents (é → e + combining accent)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug by appending -2, -3, etc. if duplicates exist.
 * @param pool - SQL connection pool
 * @param name - Character name to slugify
 * @param excludeCharacterId - Character ID to exclude from duplicate check (for updates)
 */
export async function generateUniqueSlug(
  pool: any,
  name: string,
  excludeCharacterId?: number
): Promise<string> {
  const baseSlug = generateSlug(name);
  
  // Check if base slug exists
  let slug = baseSlug;
  let counter = 2;
  
  while (true) {
    const query = excludeCharacterId
      ? `SELECT COUNT(*) as count FROM Character WHERE Slug = @slug AND CharacterID != @excludeId`
      : `SELECT COUNT(*) as count FROM Character WHERE Slug = @slug`;
    
    const request = pool.request().input('slug', slug);
    if (excludeCharacterId) {
      request.input('excludeId', excludeCharacterId);
    }
    
    const result = await request.query(query);
    
    if (result.recordset[0].count === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
