const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
  server: 'taiaye.database.windows.net',
  port: 1433,
  database: 'taiyae',
  user: 'wolfadmin',
  password: 'puhTog-pychys-7kumru',
  options: { encrypt: true, trustServerCertificate: false }
};

async function main() {
  const pool = await sql.connect(config);
  try {
    // Pull tables and columns with types/nullability/defaults
    const result = await pool.request().query(`
      SELECT
        t.TABLE_SCHEMA,
        t.TABLE_NAME,
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.NUMERIC_PRECISION,
        c.NUMERIC_SCALE,
        c.IS_NULLABLE,
        c.COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c
        ON t.TABLE_SCHEMA = c.TABLE_SCHEMA
       AND t.TABLE_NAME = c.TABLE_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME, c.ORDINAL_POSITION;
    `);

    // Pull primary keys
    const pkResult = await pool.request().query(`
      SELECT
        KU.TABLE_SCHEMA,
        KU.TABLE_NAME,
        KU.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS TC
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KU
        ON TC.CONSTRAINT_NAME = KU.CONSTRAINT_NAME
       AND TC.TABLE_NAME = KU.TABLE_NAME
       AND TC.TABLE_SCHEMA = KU.TABLE_SCHEMA
      WHERE TC.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ORDER BY KU.TABLE_SCHEMA, KU.TABLE_NAME, KU.ORDINAL_POSITION;
    `);

    // Pull foreign keys
    const fkResult = await pool.request().query(`
      SELECT
        fk.name AS FK_NAME,
        sch1.name AS SRC_SCHEMA,
        tab1.name AS SRC_TABLE,
        col1.name AS SRC_COLUMN,
        sch2.name AS REF_SCHEMA,
        tab2.name AS REF_TABLE,
        col2.name AS REF_COLUMN
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables tab1 ON tab1.object_id = fkc.parent_object_id
      JOIN sys.schemas sch1 ON tab1.schema_id = sch1.schema_id
      JOIN sys.columns col1 ON col1.column_id = fkc.parent_column_id AND col1.object_id = tab1.object_id
      JOIN sys.tables tab2 ON tab2.object_id = fkc.referenced_object_id
      JOIN sys.schemas sch2 ON tab2.schema_id = sch2.schema_id
      JOIN sys.columns col2 ON col2.column_id = fkc.referenced_column_id AND col2.object_id = tab2.object_id
      ORDER BY sch1.name, tab1.name, fk.name;
    `);

    const pkMap = new Map();
    pkResult.recordset.forEach(r => {
      const key = `${r.TABLE_SCHEMA}.${r.TABLE_NAME}`;
      if (!pkMap.has(key)) pkMap.set(key, []);
      pkMap.get(key).push(r.COLUMN_NAME);
    });

    const fkMap = new Map();
    fkResult.recordset.forEach(r => {
      const key = `${r.SRC_SCHEMA}.${r.SRC_TABLE}`;
      if (!fkMap.has(key)) fkMap.set(key, []);
      fkMap.get(key).push(r);
    });

    // Group columns by table
    const tables = new Map();
    result.recordset.forEach(r => {
      const key = `${r.TABLE_SCHEMA}.${r.TABLE_NAME}`;
      if (!tables.has(key)) tables.set(key, { schema: r.TABLE_SCHEMA, name: r.TABLE_NAME, columns: [] });
      tables.get(key).columns.push(r);
    });

    const lines = [];
    tables.forEach(table => {
      lines.push(`-- ${table.schema}.${table.name}`);
      lines.push(`CREATE TABLE ${table.schema}.${table.name} (`);
      const cols = table.columns.map(col => {
        let type = col.DATA_TYPE;
        if (col.CHARACTER_MAXIMUM_LENGTH) {
          type += `(${col.CHARACTER_MAXIMUM_LENGTH === -1 ? 'MAX' : col.CHARACTER_MAXIMUM_LENGTH})`;
        } else if (col.NUMERIC_PRECISION) {
          type += `(${col.NUMERIC_PRECISION}${col.NUMERIC_SCALE != null ? ',' + col.NUMERIC_SCALE : ''})`;
        }
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const def = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT.trim()}` : '';
        return `    ${col.COLUMN_NAME} ${type} ${nullable}${def}`.trimEnd();
      });

      // Primary key
      const pkKey = `${table.schema}.${table.name}`;
      if (pkMap.has(pkKey)) {
        cols.push(`    CONSTRAINT PK_${table.name} PRIMARY KEY (${pkMap.get(pkKey).join(', ')})`);
      }

      // Foreign keys
      if (fkMap.has(pkKey)) {
        fkMap.get(pkKey).forEach(fk => {
          cols.push(`    CONSTRAINT ${fk.FK_NAME} FOREIGN KEY (${fk.SRC_COLUMN}) REFERENCES ${fk.REF_SCHEMA}.${fk.REF_TABLE}(${fk.REF_COLUMN})`);
        });
      }

      lines.push(cols.join(',\n'));
      lines.push(');\n');
    });

    const outPath = path.join(__dirname, '../database/schema.export.sql');
    fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
    console.log(`Schema exported to ${outPath}`);
  } finally {
    await pool.close();
  }
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});