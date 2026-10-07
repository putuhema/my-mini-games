import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_CONVEX_URL: {
		public: true,
		static: true,
		description: 'Convex deployment URL (written to .env.local by `convex dev`)'
	},
	PUBLIC_VAPID_KEY: {
		public: true,
		static: true,
		description: 'Web Push public key for turn reminders. Optional — reminders are hidden without it.',
		schema: (value) => value || undefined
	}
});
