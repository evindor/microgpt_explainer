export interface ThemeMeta {
  id: string;
  label: string;
  isDark: boolean;
}

const themes: ThemeMeta[] = [
  { id: 'midnight', label: 'Midnight', isDark: true },
  { id: 'monokai', label: 'Monokai', isDark: true },
  { id: 'dracula', label: 'Dracula', isDark: true },
  { id: 'solarized-dark', label: 'Solarized Dark', isDark: true },
  { id: 'solarized-light', label: 'Solarized Light', isDark: false },
  { id: 'github-light', label: 'GitHub Light', isDark: false },
];

export default themes;
