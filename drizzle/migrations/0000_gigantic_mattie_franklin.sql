CREATE TABLE `contact` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer,
	`phone_number` text,
	`email` text,
	`linked_id` integer,
	`link_precedence` text DEFAULT 'primary' NOT NULL
);
