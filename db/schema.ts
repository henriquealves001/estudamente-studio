import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const accounts = sqliteTable('accounts', {
 id:text('id').primaryKey(), email:text('email').notNull().default(''), name:text('name').notNull().default(''), bio:text('bio').notNull().default(''), avatarKey:text('avatar_key'), created:text('created_at').notNull()
});
export const accountIdentities = sqliteTable('account_identities', {
 provider:text('provider').notNull(), subject:text('subject').notNull(), accountId:text('account_id').notNull()
}, t=>[primaryKey({columns:[t.provider,t.subject]}),uniqueIndex('account_provider_owner_unique').on(t.provider,t.accountId)]);
export const accountSessions = sqliteTable('account_sessions', {
 tokenHash:text('token_hash').primaryKey(), accountId:text('account_id').notNull(), providerSession:text('provider_session').notNull(), expires:integer('expires_at').notNull()
});
export const revokedSessions = sqliteTable('account_revoked_sessions', { providerSession:text('provider_session').primaryKey(), created:text('created_at').notNull() });
export const profiles = sqliteTable('community_profiles', {
 userId:text('user_id').primaryKey(), publicId:text('public_id').notNull().unique(), name:text('name').notNull(), bio:text('bio').notNull().default(''), avatarKey:text('avatar_key'), ranking:integer('ranking').notNull().default(0), updated:text('updated_at').notNull()
});
export const plans=sqliteTable('community_plans',{
 id:text('id').primaryKey(), owner:text('owner').notNull(), title:text('title').notNull(), organization:text('organization').notNull(), edition:text('edition').notNull(), sourceUrl:text('source_url').notNull(), description:text('description').notNull(), plan:text('plan_json').notNull(), pdfKey:text('pdf_key'), subjects:integer('subjects').notNull(), topics:integer('topics').notNull(), created:text('created_at').notNull(), removed:integer('removed').notNull().default(0)
});
export const daily=sqliteTable('community_daily',{userId:text('user_id').notNull(),date:text('date').notNull(),minutes:integer('minutes').notNull(),questions:integer('questions').notNull()},t=>[primaryKey({columns:[t.userId,t.date]})]);
export const groups=sqliteTable('community_groups',{id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),invite:text('invite').notNull().unique(),created:text('created_at').notNull()});
export const members=sqliteTable('community_members',{groupId:text('group_id').notNull(),userId:text('user_id').notNull()},t=>[primaryKey({columns:[t.groupId,t.userId]})]);
export const reports=sqliteTable('community_reports',{id:text('id').primaryKey(),planId:text('plan_id').notNull(),reporter:text('reporter').notNull(),reason:text('reason').notNull(),created:text('created_at').notNull()},t=>[uniqueIndex('community_report_once').on(t.planId,t.reporter)]);
