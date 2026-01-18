/**
 * Script to generate slugs for existing characters that don't have one.
 * Run this after adding the Slug column to the database.
 * 
 * Usage: node generate-slugs.js
 */

const sql = require('mssql');
require('dotenv').config();

// Slug generation function (same as in slugify.ts)
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(pool, name, excludeCharacterId) {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 2;
  
  while (true) {
    const query = excludeCharacterId
      ? `SELECT COUNT(*) as count FROM Character WHERE Slug = @slug AND CharacterID != @excludeId`
      : `SELECT COUNT(*) as count FROM Character WHERE Slug = @slug`;
    
    const request = pool.request().input('slug', sql.NVarChar, slug);
    if (excludeCharacterId) {
      request.input('excludeId', sql.Int, excludeCharacterId);
    }
    
    const result = await request.query(query);
    
    if (result.recordset[0].count === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function main() {
  console.log('Connecting to database...');
  
  const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
  
  const pool = await sql.connect(config);
  console.log('Connected!');
  
  // Get all characters without slugs
  const result = await pool.request().query(`
    SELECT CharacterID, CharacterName 
    FROM Character 
    WHERE Slug IS NULL
    ORDER BY CharacterID
  `);
  
  console.log(`Found ${result.recordset.length} characters without slugs.`);
  
  let updated = 0;
  for (const char of result.recordset) {
    const slug = await generateUniqueSlug(pool, char.CharacterName, char.CharacterID);
    
    await pool.request()
      .input('slug', sql.NVarChar, slug)
      .input('id', sql.Int, char.CharacterID)
      .query('UPDATE Character SET Slug = @slug WHERE CharacterID = @id');
    
    console.log(`  ${char.CharacterName} -> ${slug}`);
    updated++;
  }
  
  console.log(`\nDone! Updated ${updated} characters.`);
  await pool.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
