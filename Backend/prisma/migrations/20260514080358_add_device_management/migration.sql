BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[devices] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [location] NVARCHAR(255),
    [totalQuantity] INT NOT NULL CONSTRAINT [devices_totalQuantity_df] DEFAULT 1,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [devices_status_df] DEFAULT 'ACTIVE',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [devices_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [devices_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[device_reservations] (
    [id] NVARCHAR(1000) NOT NULL,
    [deviceId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [startAt] DATETIME2 NOT NULL,
    [endAt] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [device_reservations_status_df] DEFAULT 'CONFIRMED',
    [notes] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [device_reservations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [device_reservations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[device_usage_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [deviceId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [usedAt] DATETIME2 NOT NULL CONSTRAINT [device_usage_logs_usedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [durationMinutes] INT,
    [action] NVARCHAR(1000) NOT NULL CONSTRAINT [device_usage_logs_action_df] DEFAULT 'RESERVED',
    [notes] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [device_usage_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [device_usage_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [devices_name_idx] ON [dbo].[devices]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [device_reservations_deviceId_idx] ON [dbo].[device_reservations]([deviceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [device_reservations_userId_idx] ON [dbo].[device_reservations]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [device_reservations_status_idx] ON [dbo].[device_reservations]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [device_usage_logs_deviceId_idx] ON [dbo].[device_usage_logs]([deviceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [device_usage_logs_userId_idx] ON [dbo].[device_usage_logs]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[device_reservations] ADD CONSTRAINT [device_reservations_deviceId_fkey] FOREIGN KEY ([deviceId]) REFERENCES [dbo].[devices]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[device_reservations] ADD CONSTRAINT [device_reservations_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[device_usage_logs] ADD CONSTRAINT [device_usage_logs_deviceId_fkey] FOREIGN KEY ([deviceId]) REFERENCES [dbo].[devices]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[device_usage_logs] ADD CONSTRAINT [device_usage_logs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
