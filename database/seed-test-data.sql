-- Seed User
INSERT INTO [dbo].[User] (UserID, Username, Email, PasswordHash, Created, Modified, Is_Active, Last_Login_IP, Description) VALUES
(1, 'wolfadmin', 'admin@example.com', 'hashed-password', GETDATE(), GETDATE(), 1, '127.0.0.1', 'Admin user');

-- Seed HealthStatus
INSERT INTO dbo.HealthStatus (StatusID, StatusValue) VALUES
(1, 'Healthy'),
(2, 'Injured');

-- Seed Height
INSERT INTO dbo.Height (HeightID, HeightValue) VALUES
(1, 'Short'),
(2, 'Average'),
(3, 'Tall');

-- Seed Build
INSERT INTO dbo.Build (BuildID, BuildValue) VALUES
(1, 'Lean'),
(2, 'Average'),
(3, 'Muscular');

-- Seed SpiritSymbol
INSERT INTO dbo.SpiritSymbol (SymbolID, SymbolValue) VALUES
(1, 'Moon'),
(2, 'Sun');

-- Seed Region
INSERT INTO dbo.Region (RegionID, RegionName, Description) VALUES
(1, 'Eastern Wasteland', 'A desolate place where few dare to tread.'),
(2, 'Verdant Hills', 'Lush green hills rolling as far as the eye can see.');

-- Seed Pack
INSERT INTO dbo.Pack (PackID, PackName, RegionID, Colors, Description, Founded, HeaderCSS, Created, Modified) VALUES
(1, 'Adunati Rangers', 1, '#4a5d23,#8a9a5b', 'A hardy ranger pack.', '2020', NULL, GETDATE(), GETDATE()),
(2, 'Hillside Sanctuary', 2, '#2e8b57,#98fb98', 'A gentle, healing pack.', '2019', NULL, GETDATE(), GETDATE());

-- Seed PackHierarchy
INSERT INTO dbo.PackHierarchy (HierachyID, PackID, HierachyName) VALUES
(1, 1, 'Alpha'),
(2, 1, 'Scout'),
(3, 2, 'Guardian'),
(4, 2, 'Healer');

-- Seed Subareas
INSERT INTO dbo.Subareas (id, regionId, name, description) VALUES
('adder-creek', '1', 'Adder Creek', 'Creek in the wasteland.'),
('verdant-meadow', '2', 'Verdant Meadow', 'Open meadow in the hills.');

-- Seed Character
INSERT INTO dbo.Character (
    CharacterID, UserID, PackID, CharacterName, Created, Modified,
    Sex, MonthsAge, HealthStatus_Id, AvatarImage,
    HeightID, BuildID, Birthplace, Father, Mother, Is_Active
) VALUES
(1, 1, 1, 'Fenrir', GETDATE(), GETDATE(), 'Male', 48, 1, NULL, 3, 2, 'Wasteland', NULL, NULL, 1),
(2, 1, 2, 'Luna', GETDATE(), GETDATE(), 'Female', 24, 1, NULL, 2, 1, 'Verdant Hills', NULL, NULL, 1);

-- Seed SkillPoints
INSERT INTO dbo.SkillPoints (CharacterID, Experience, Physical, Knowledge) VALUES
(1, 100, 30, 20),
(2, 40, 10, 15);

-- Seed Achievement
INSERT INTO dbo.Achievement (id, name, description, imageUrl) VALUES
('achv-1', 'First Steps', 'Created a character.', NULL),
('achv-2', 'Explorer', 'Visited two regions.', NULL);

-- Seed Thread
INSERT INTO dbo.Thread (ThreadID, RegionId, Created, Modified) VALUES
(1, 1, GETDATE(), GETDATE());

-- Seed Post
INSERT INTO dbo.Post (UserID, CharacterID, RegionID, ThreadID, PostID, Subject, Body, Created, Modified) VALUES
(1, 1, 1, 1, 1, 'No wonder they call it a wasteland', 'It really is dry out here.', GETDATE(), GETDATE());

-- Note: SkillPoints has no PK; inserts assume unique CharacterID rows.