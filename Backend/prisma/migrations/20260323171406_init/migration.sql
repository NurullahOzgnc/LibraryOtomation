BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [phone] NVARCHAR(20),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[books] (
    [id] NVARCHAR(1000) NOT NULL,
    [isbn] NVARCHAR(20) NOT NULL,
    [title] NVARCHAR(500) NOT NULL,
    [description] NVARCHAR(max),
    [publisher] NVARCHAR(255),
    [publishedYear] INT,
    [pageCount] INT,
    [language] NVARCHAR(10),
    [coverImage] NVARCHAR(500),
    [stock] INT NOT NULL CONSTRAINT [books_stock_df] DEFAULT 1,
    [totalCopies] INT NOT NULL CONSTRAINT [books_totalCopies_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [books_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [books_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [books_isbn_key] UNIQUE NONCLUSTERED ([isbn])
);

-- CreateTable
CREATE TABLE [dbo].[authors] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [authors_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [authors_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [authors_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [slug] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [categories_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [categories_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[transactions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [bookId] NVARCHAR(1000) NOT NULL,
    [borrowedAt] DATETIME2 NOT NULL CONSTRAINT [transactions_borrowedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [dueDate] DATETIME2 NOT NULL,
    [returnedAt] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [transactions_status_df] DEFAULT 'ACTIVE',
    [fineAmount] FLOAT(53) NOT NULL CONSTRAINT [transactions_fineAmount_df] DEFAULT 0,
    [notes] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [transactions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [transactions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[_BookCategories] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_BookCategories_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateTable
CREATE TABLE [dbo].[_BookAuthors] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_BookAuthors_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_email_idx] ON [dbo].[users]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [books_isbn_idx] ON [dbo].[books]([isbn]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [books_title_idx] ON [dbo].[books]([title]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [transactions_userId_idx] ON [dbo].[transactions]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [transactions_bookId_idx] ON [dbo].[transactions]([bookId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [transactions_status_idx] ON [dbo].[transactions]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [transactions_dueDate_idx] ON [dbo].[transactions]([dueDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_BookCategories_B_index] ON [dbo].[_BookCategories]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_BookAuthors_B_index] ON [dbo].[_BookAuthors]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[transactions] ADD CONSTRAINT [transactions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[transactions] ADD CONSTRAINT [transactions_bookId_fkey] FOREIGN KEY ([bookId]) REFERENCES [dbo].[books]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_BookCategories] ADD CONSTRAINT [_BookCategories_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[books]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_BookCategories] ADD CONSTRAINT [_BookCategories_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[categories]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_BookAuthors] ADD CONSTRAINT [_BookAuthors_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[authors]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_BookAuthors] ADD CONSTRAINT [_BookAuthors_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[books]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
