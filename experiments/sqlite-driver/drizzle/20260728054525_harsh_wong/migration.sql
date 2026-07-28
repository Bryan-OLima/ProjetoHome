CREATE TABLE `job_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`job_id` text NOT NULL,
	`outcome` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_job_attempts_job_id_webhook_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `webhook_jobs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `webhook_jobs` (
	`id` text PRIMARY KEY,
	`source` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
