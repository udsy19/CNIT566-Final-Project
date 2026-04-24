CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`brightspace_id` integer NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`created_date` integer,
	`is_global` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_unique` ON `announcements` (`user_id`,`course_id`,`brightspace_id`);--> statement-breakpoint
CREATE INDEX `idx_announcements_user_created` ON `announcements` (`user_id`,`created_date`);--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`brightspace_id` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`instructions` text,
	`due_date` integer,
	`end_date` integer,
	`points_numerator` real,
	`points_denominator` real,
	`weight` real,
	`is_completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignments_unique` ON `assignments` (`user_id`,`course_id`,`brightspace_id`,`type`);--> statement-breakpoint
CREATE INDEX `idx_assignments_user_due_date` ON `assignments` (`user_id`,`due_date`);--> statement-breakpoint
CREATE TABLE `briefings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`briefing_date` text NOT NULL,
	`content` text NOT NULL,
	`generated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `briefings_user_date_unique` ON `briefings` (`user_id`,`briefing_date`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_messages_user_created` ON `chat_messages` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_course_id` ON `chat_messages` (`course_id`);--> statement-breakpoint
CREATE TABLE `content_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`brightspace_module_id` integer NOT NULL,
	`parent_module_id` integer,
	`title` text NOT NULL,
	`description` text,
	`sort_order` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_modules_unique` ON `content_modules` (`user_id`,`course_id`,`brightspace_module_id`);--> statement-breakpoint
CREATE TABLE `content_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`module_id` text NOT NULL,
	`brightspace_topic_id` integer NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`type_identifier` text,
	`sort_order` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `content_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_topics_unique` ON `content_topics` (`user_id`,`course_id`,`brightspace_topic_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`brightspace_org_unit_id` integer NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`start_date` integer,
	`end_date` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`current_grade` real,
	`final_grade_points` real,
	`final_grade_denominator` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_user_org_unit_unique` ON `courses` (`user_id`,`brightspace_org_unit_id`);--> statement-breakpoint
CREATE INDEX `idx_courses_user_id` ON `courses` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`brightspace_user_id` text,
	`brightspace_access_token` text,
	`brightspace_refresh_token` text,
	`brightspace_token_expires_at` integer,
	`sync_status` text DEFAULT 'idle' NOT NULL,
	`sync_progress` text,
	`last_synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);