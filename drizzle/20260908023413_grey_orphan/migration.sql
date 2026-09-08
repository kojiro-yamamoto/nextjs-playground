CREATE TABLE `posts` (
	`slug` text PRIMARY KEY,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL
);
