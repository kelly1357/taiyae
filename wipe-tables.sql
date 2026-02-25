-- =============================================================
-- Taiyae / Horizon Wolves - Production Table Wipe Script
-- Deletes all row data while preserving table structure.
-- Tables are ordered to respect foreign key constraints.
-- =============================================================

BEGIN TRANSACTION;

-- ---------- child / junction tables first ----------

-- Achievements (user-facing)
DELETE FROM dbo.AchievementRequest;
DELETE FROM dbo.UserAchievement;

-- Character threads & skills
DELETE FROM dbo.CharacterThreadSummary;
DELETE FROM dbo.CharacterSkillPointsAssignment;

-- Messaging
DELETE FROM dbo.Message;
DELETE FROM dbo.Conversation;

-- Forum posts & threads (IC)
DELETE FROM dbo.Post;
DELETE FROM dbo.Thread;

-- OOC forum posts & threads
DELETE FROM dbo.OOCPost;
DELETE FROM dbo.OOCThread;

-- Packs hierarchy
DELETE FROM dbo.PackStats;
DELETE FROM dbo.PackSubareas;
DELETE FROM dbo.PackHierarchy;

-- Characters (depends on PackRanks)
DELETE FROM dbo.Character;

-- Pack ranks (depends on Packs)
DELETE FROM dbo.PackRanks;
DELETE FROM dbo.Packs;
DROP TABLE dbo.Pack;

-- Adoptables (depends on User, Build, Height)
DELETE FROM dbo.Adoptable;

-- Staff & moderation
 DELETE FROM dbo.StaffPing;

-- Content tables
-- DELETE FROM dbo.WikiPage;
 DELETE FROM dbo.PlotNews;
 DELETE FROM dbo.SitewideUpdates;
 DELETE FROM dbo.Bulletin;

-- ---------- reference / lookup tables ----------

 DELETE FROM dbo.Achievement;
 DELETE FROM dbo.SkillPoints;
-- DELETE FROM dbo.Subareas;
-- DELETE FROM dbo.Region;
-- DELETE FROM dbo.OOCForum;
 DELETE FROM dbo.Build;
 DELETE FROM dbo.Height;
 DELETE FROM dbo.HealthStatus;
 DELETE FROM dbo.SpiritSymbol;
-- DELETE FROM dbo.GameSettings;
 DELETE FROM dbo.GuestSession;

-- ---------- core tables last ----------

DELETE FROM dbo.[User] WHERE UserID NOT IN (6,11);
-- DELETE FROM dbo.UserStatus;

COMMIT TRANSACTION;

PRINT 'All tables wiped successfully.';

--Ran on 2024-02-24 7:04P CST by Marshall.