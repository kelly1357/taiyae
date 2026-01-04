-- dbo.Achievement
CREATE TABLE dbo.Achievement (
    id nvarchar(50) NOT NULL,
    name nvarchar(100) NOT NULL,
    description nvarchar(MAX) NULL,
    imageUrl nvarchar(MAX) NULL,
    CONSTRAINT PK_Achievement PRIMARY KEY (id)
);

-- dbo.Build
CREATE TABLE dbo.Build (
    BuildID INT  NOT NULL,
    BuildValue nvarchar(100) NOT NULL,
    CONSTRAINT PK_Build PRIMARY KEY (BuildID)
);

-- dbo.Character
CREATE TABLE dbo.Character (
    CharacterID INT  NOT NULL,
    UserID INT  NULL,
    PackID INT  NULL,
    CharacterName nvarchar(100) NOT NULL,
    Created datetime NULL,
    Modified datetime NULL,
    Sex nvarchar(10) NULL,
    MonthsAge INT  NULL,
    HealthStatus_Id INT  NULL,
    AvatarImage nvarchar(MAX) NULL,
    ProfileImage1 nvarchar(MAX) NULL,
    ProfileImage2 nvarchar(MAX) NULL,
    ProfileImage3 nvarchar(MAX) NULL,
    ProfileImage4 nvarchar(MAX) NULL,
    ProfileImage5 nvarchar(MAX) NULL,
    CI_General_HTML nvarchar(MAX) NULL,
    CI_Appearance_HTML nvarchar(MAX) NULL,
    CI_Personality_HTML nvarchar(MAX) NULL,
    CI_History_HTML nvarchar(MAX) NULL,
    HeightID INT  NULL,
    BuildID INT  NULL,
    Birthplace nvarchar(MAX) NULL,
    Father nvarchar(MAX) NULL,
    Mother nvarchar(MAX) NULL,
    Siblings nvarchar(MAX) NULL,
    Mate nvarchar(MAX) NULL,
    Pups nvarchar(MAX) NULL,
    OtherRelationships nvarchar(MAX) NULL,
    SpiritSymbolID INT  NULL,
    Is_Active bit NULL DEFAULT ((1)),
    CONSTRAINT PK_Character PRIMARY KEY (CharacterID)
);

-- dbo.HealthStatus
CREATE TABLE dbo.HealthStatus (
    StatusID INT NOT NULL,
    StatusValue nvarchar(MAX) NULL,
    CONSTRAINT PK_HealthStatus PRIMARY KEY (StatusID)
);

-- dbo.Height
CREATE TABLE dbo.Height (
    HeightID INT NOT NULL,
    HeightValue nvarchar(50) NOT NULL,
    CONSTRAINT PK_Height PRIMARY KEY (HeightID)
);

-- dbo.Pack
CREATE TABLE dbo.Pack (
    PackID INT NOT NULL,
    PackName nvarchar(100) NOT NULL,
    RegionID INT NULL,
    Colors nvarchar(MAX) NULL,
    Description nvarchar(MAX) NULL,
    Founded nvarchar(MAX) NULL,
    HeaderCSS nvarchar(MAX) NULL,
    Created datetime NULL,
    Modified datetime NULL,
    CONSTRAINT PK_Pack PRIMARY KEY (PackID)
);

-- dbo.PackHierarchy
CREATE TABLE dbo.PackHierarchy (
    HierachyID INT NOT NULL,
    PackID INT NULL,
    HierachyName nvarchar(MAX) NULL,
    CONSTRAINT PK_PackHierarchy PRIMARY KEY (HierachyID)
);

-- dbo.Post
CREATE TABLE dbo.Post (
    UserID INT NULL,
    CharacterID INT NULL,
    RegionID INT NULL,
    ThreadID INT NULL,
    PostID INT NOT NULL,
    Subject nvarchar(MAX) NULL,
    Body nvarchar(MAX) NULL,
    Created datetime NULL,
    Modified datetime NULL,
    CONSTRAINT PK_Post PRIMARY KEY (PostID)
);

-- dbo.Region
CREATE TABLE dbo.Region (
    RegionID INT NOT NULL,
    RegionName nvarchar(100) NOT NULL,
    Description nvarchar(MAX) NULL,
    CONSTRAINT PK_Region PRIMARY KEY (RegionID)
);

-- dbo.SkillPoints
CREATE TABLE dbo.SkillPoints (
    CharacterID INT NULL,
    Experience INT NULL DEFAULT ((0)),
    Physical INT NULL DEFAULT ((0)),
    Knowledge INT NULL DEFAULT ((0)),
    Total INT NULL
);

-- dbo.SpiritSymbol
CREATE TABLE dbo.SpiritSymbol (
    SymbolID INT NOT NULL,
    SymbolValue nvarchar(100) NOT NULL,
    CONSTRAINT PK_SpiritSymbol PRIMARY KEY (SymbolID)
);

-- dbo.Subareas
CREATE TABLE dbo.Subareas (
    id nvarchar(50) NOT NULL,
    regionId nvarchar(50) NOT NULL,
    name nvarchar(100) NOT NULL,
    description nvarchar(MAX) NULL,
    CONSTRAINT PK_Subareas PRIMARY KEY (id)
);

-- dbo.Thread
CREATE TABLE dbo.Thread (
    ThreadID INT NOT NULL,
    RegionId INT NULL,
    Created datetime NULL,
    Modified datetime NULL,
    CONSTRAINT PK_Thread PRIMARY KEY (ThreadID)
);

-- dbo.User
CREATE TABLE [dbo.User] (
    UserID INT NOT NULL,
    Username nvarchar(MAX) NULL,
    Email nvarchar(MAX) NULL,
    PasswordHash varchar(255) NULL,
    Created datetime NULL,
    Modified datetime NULL,
    Is_Active bit NULL DEFAULT ((1)),
    Last_Login_IP nvarchar(MAX) NULL,
    Description nvarchar(MAX) NULL,
    CONSTRAINT PK_User PRIMARY KEY (UserID)
);
