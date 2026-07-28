CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY,
	`timestamp` integer NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`permission` text,
	`outcome` text NOT NULL,
	`request_id` text,
	`correlation_id` text,
	`context` text
);
--> statement-breakpoint
CREATE TABLE `error_events` (
	`id` text PRIMARY KEY,
	`timestamp` integer NOT NULL,
	`service` text NOT NULL,
	`action` text NOT NULL,
	`error_code` text,
	`message` text,
	`request_id` text,
	`correlation_id` text,
	`duration_ms` integer,
	`context` text
);
--> statement-breakpoint
CREATE INDEX `audit_events_timestamp_idx` ON `audit_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_events_action_idx` ON `audit_events` (`action`);--> statement-breakpoint
CREATE INDEX `audit_events_correlation_id_idx` ON `audit_events` (`correlation_id`);--> statement-breakpoint
CREATE INDEX `error_events_timestamp_idx` ON `error_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `error_events_service_idx` ON `error_events` (`service`);--> statement-breakpoint
CREATE INDEX `error_events_correlation_id_idx` ON `error_events` (`correlation_id`);