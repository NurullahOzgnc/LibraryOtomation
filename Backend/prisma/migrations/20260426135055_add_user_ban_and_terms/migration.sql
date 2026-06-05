BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[users] ADD [banReason] NVARCHAR(500),
[bannedAt] DATETIME2,
[isBanned] BIT NOT NULL CONSTRAINT [users_isBanned_df] DEFAULT 0,
[termsAcceptedAt] DATETIME2;

-- CreateTable
CREATE TABLE [dbo].[terms_acceptances] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [version] NVARCHAR(1000) NOT NULL CONSTRAINT [terms_acceptances_version_df] DEFAULT '1.0',
    [ipAddress] NVARCHAR(50),
    [userAgent] NVARCHAR(500),
    [acceptedAt] DATETIME2 NOT NULL CONSTRAINT [terms_acceptances_acceptedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [terms_acceptances_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [terms_acceptances_userId_idx] ON [dbo].[terms_acceptances]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_isBanned_idx] ON [dbo].[users]([isBanned]);

-- AddForeignKey
ALTER TABLE [dbo].[terms_acceptances] ADD CONSTRAINT [terms_acceptances_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
