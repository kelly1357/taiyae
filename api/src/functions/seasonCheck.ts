import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

/**
 * Horizon Calendar Constants - must match client-side horizonCalendar.ts
 */
const EPOCH_DATE = new Date('2025-08-23T00:00:00Z');
const DAYS_PER_PHASE = 28;
const PHASES_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_PHASE * PHASES_PER_YEAR; // 336 days

const SEASON_PHASES = [
    'Full Winter', 'Late Winter', 'Early Spring', 'Full Spring', 'Late Spring',
    'Early Summer', 'Full Summer', 'Late Summer', 'Early Autumn', 'Full Autumn',
    'Late Autumn', 'Early Winter'
];

/**
 * Calculate the current Horizon phase index (0-11)
 */
function getCurrentPhaseIndex(): number {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceEpoch = Math.floor((now.getTime() - EPOCH_DATE.getTime()) / msPerDay);
    
    if (daysSinceEpoch < 0) return 0;
    
    const dayInYear = daysSinceEpoch % DAYS_PER_YEAR;
    return Math.floor(dayInYear / DAYS_PER_PHASE);
}

/**
 * Check if season has changed and age all active characters if so
 */
export async function checkSeasonChange(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const currentPhase = getCurrentPhaseIndex();
        
        // Get the last recorded phase
        const settingsResult = await pool.request()
            .query("SELECT SettingValue FROM GameSettings WHERE SettingKey = 'LastSeasonPhase'");
        
        let lastPhase = -1;
        if (settingsResult.recordset.length > 0) {
            lastPhase = parseInt(settingsResult.recordset[0].SettingValue);
        }
        
        // If phase hasn't changed, nothing to do
        if (lastPhase === currentPhase) {
            return {
                jsonBody: {
                    seasonChanged: false,
                    currentPhase: currentPhase,
                    currentPhaseName: SEASON_PHASES[currentPhase],
                    message: "No season change detected"
                }
            };
        }
        
        // Calculate how many phases have passed (handles multiple phases if server was down)
        let phasesPassed = 0;
        if (lastPhase === -1) {
            // First time, don't age characters
            phasesPassed = 0;
        } else if (currentPhase > lastPhase) {
            phasesPassed = currentPhase - lastPhase;
        } else {
            // Wrapped around (e.g., from phase 11 to phase 0)
            phasesPassed = (PHASES_PER_YEAR - lastPhase) + currentPhase;
        }
        
        let charactersAged = 0;
        
        if (phasesPassed > 0) {
            // Age all active and inactive characters by the number of phases passed
            // Dead characters should NOT age
            const ageResult = await pool.request()
                .input('monthsToAdd', sql.Int, phasesPassed)
                .query(`
                    UPDATE Character 
                    SET MonthsAge = MonthsAge + @monthsToAdd
                    WHERE COALESCE(Status, CASE WHEN Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) <> 'Dead'
                `);
            
            charactersAged = ageResult.rowsAffected[0];
            
            context.log(`Season changed from ${SEASON_PHASES[lastPhase]} to ${SEASON_PHASES[currentPhase]}. Aged ${charactersAged} characters by ${phasesPassed} month(s).`);
        }
        
        // Update the stored phase
        await pool.request()
            .input('phase', sql.NVarChar, currentPhase.toString())
            .query(`
                UPDATE GameSettings 
                SET SettingValue = @phase, LastUpdated = GETDATE() 
                WHERE SettingKey = 'LastSeasonPhase'
            `);
        
        return {
            jsonBody: {
                seasonChanged: true,
                previousPhase: lastPhase,
                previousPhaseName: lastPhase >= 0 ? SEASON_PHASES[lastPhase] : 'Unknown',
                currentPhase: currentPhase,
                currentPhaseName: SEASON_PHASES[currentPhase],
                phasesPassed: phasesPassed,
                charactersAged: charactersAged,
                message: phasesPassed > 0 
                    ? `Season changed! ${charactersAged} characters aged by ${phasesPassed} month(s). Dead characters excluded.`
                    : "Season tracking initialized"
            }
        };
        
    } catch (error) {
        context.error('Season check error:', error);
        return {
            status: 500,
            jsonBody: { error: "Internal Server Error" }
        };
    }
}

app.http('checkSeasonChange', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'season-check',
    handler: checkSeasonChange
});
