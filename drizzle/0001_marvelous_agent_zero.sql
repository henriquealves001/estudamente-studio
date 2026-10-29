CREATE TABLE `account_identities` (
	`provider` text NOT NULL,
	`subject` text NOT NULL,
	`account_id` text NOT NULL,
	PRIMARY KEY(`provider`, `subject`)
);
--> statement-breakpoint
CREATE TABLE `account_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_session` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar_key` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account_revoked_sessions` (
	`provider_session` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO accounts(id,email,name,bio,avatar_key,created_at)
SELECT user_id,'',name,bio,avatar_key,updated_at FROM community_profiles;
--> statement-breakpoint
INSERT INTO account_identities(provider,subject,account_id)
SELECT 'chatgpt',user_id,user_id FROM community_profiles;
