// GET /api/skillpoints
// Returns all rows from the SkillPoints table

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

export async function getSkillPoints(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT SkillID, Category, CategoryDescription, [Action], [ActionDescription], E, P, K, TOTAL
      FROM SkillPoints
    `);

    // Transform flat result into nested structure grouped by Category
    const categoriesMap = new Map<string, any>();
    result.recordset.forEach(row => {
      if (!categoriesMap.has(row.Category)) {
        categoriesMap.set(row.Category, {
          Category: row.Category,
          CategoryDescription: row.CategoryDescription,
          items: []
        });
      }
      categoriesMap.get(row.Category).items.push({
        SkillID: row.SkillID,
        Action: row.Action,
        ActionDescription: row.ActionDescription,
        E: row.E,
        P: row.P,
        K: row.K,
        TOTAL: row.TOTAL
      });
    });

    return {
      status: 200,
      jsonBody: Array.from(categoriesMap.values())
    };
  } catch (error) {
    context.error?.(error);
    return {
      status: 500,
      jsonBody: { error: error.message }
    };
  }
}

app.http('getSkillPoints', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getSkillPoints,
  route: 'skillpoints'
});
