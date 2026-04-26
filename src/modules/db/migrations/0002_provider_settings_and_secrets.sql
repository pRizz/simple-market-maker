CREATE TABLE IF NOT EXISTS "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"default_provider" text DEFAULT 'alpha_vantage' NOT NULL,
	"missing_data_behavior" text DEFAULT 'confirm_before_fetch' NOT NULL,
	"show_sample_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO app_settings (id, default_provider, missing_data_behavior, show_sample_data) VALUES ('singleton', 'alpha_vantage', 'confirm_before_fetch', false) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"encryption_auth_tag" text NOT NULL,
	"masked_suffix" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"validation_status" text DEFAULT 'not_validated' NOT NULL,
	"validation_message" text,
	"last_validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_api_keys_provider_id_unique" UNIQUE("provider_id")
);
