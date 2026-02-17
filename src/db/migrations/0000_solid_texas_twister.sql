CREATE TABLE `learning_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`event_type` text NOT NULL,
	`payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `vocabulary_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_learning_events_user_id` ON `learning_events` (`user_id`);--> statement-breakpoint
CREATE TABLE `sr_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`interval` integer DEFAULT 0 NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`next_review_at` text DEFAULT (datetime('now')) NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`accuracy` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `vocabulary_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sr_schedule_user_id_next_review_at` ON `sr_schedule` (`user_id`,`next_review_at`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`learning_goal` text,
	`level` integer DEFAULT 0,
	`device_tier` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `vocabulary_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`definition` text NOT NULL,
	`part_of_speech` text NOT NULL,
	`ipa` text,
	`example_sentence` text,
	`audio_url_american` text,
	`audio_url_british` text,
	`image_url` text,
	`difficulty_level` integer DEFAULT 0 NOT NULL,
	`topic_tags` text DEFAULT '[]',
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vocabulary_cards_word` ON `vocabulary_cards` (`word`);--> statement-breakpoint
CREATE INDEX `idx_vocabulary_cards_difficulty_level` ON `vocabulary_cards` (`difficulty_level`);