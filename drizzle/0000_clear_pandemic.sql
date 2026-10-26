CREATE TABLE `community_daily` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`minutes` integer NOT NULL,
	`questions` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date`)
);
--> statement-breakpoint
CREATE TABLE `community_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`invite` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_groups_invite_unique` ON `community_groups` (`invite`);--> statement-breakpoint
CREATE TABLE `community_members` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `community_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`organization` text NOT NULL,
	`edition` text NOT NULL,
	`source_url` text NOT NULL,
	`description` text NOT NULL,
	`plan_json` text NOT NULL,
	`pdf_key` text,
	`subjects` integer NOT NULL,
	`topics` integer NOT NULL,
	`created_at` text NOT NULL,
	`removed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar_key` text,
	`ranking` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_profiles_public_id_unique` ON `community_profiles` (`public_id`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`reporter` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_report_once` ON `community_reports` (`plan_id`,`reporter`);
