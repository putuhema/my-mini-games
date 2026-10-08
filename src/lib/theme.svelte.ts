// Night (default) or day theme. app.html applies the saved choice before first paint;
// this keeps it reactive and persists toggles.

export type Theme = 'night' | 'day';

const THEME_KEY = 'ldr.theme';

export const theme = $state({
	current: (document.documentElement.dataset.theme === 'day' ? 'day' : 'night') as Theme
});

export function setTheme(next: Theme) {
	theme.current = next;
	document.documentElement.dataset.theme = next;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute('content', next === 'day' ? '#e6efd8' : '#050b08');
	localStorage.setItem(THEME_KEY, next);
}

export function toggleTheme() {
	setTheme(theme.current === 'day' ? 'night' : 'day');
}
