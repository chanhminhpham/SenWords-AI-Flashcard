CREATE TABLE `word_families` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`root_word` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `word_families_root_word_unique` ON `word_families` (`root_word`);--> statement-breakpoint
CREATE TABLE `word_family_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` integer NOT NULL,
	`card_id` integer,
	`word_text` text NOT NULL,
	`part_of_speech` text NOT NULL,
	`form_label` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `word_families`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_id`) REFERENCES `vocabulary_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wfm_family_id` ON `word_family_members` (`family_id`);--> statement-breakpoint
CREATE INDEX `idx_wfm_card_id` ON `word_family_members` (`card_id`);