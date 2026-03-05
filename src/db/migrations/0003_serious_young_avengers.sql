CREATE TABLE `micro_stories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` integer NOT NULL,
	`story_text` text NOT NULL,
	`highlighted_words` text DEFAULT '[]' NOT NULL,
	`difficulty_level` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `word_families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_micro_stories_family_id` ON `micro_stories` (`family_id`);