export const themes = {
 violet: {label:'Violet',accent:'#7050c9',soft:'#f1ecfb',border:'#c9b9ed',ink:'#493477'},
 ocean: {label:'Ocean',accent:'#2264c5',soft:'#eaf2ff',border:'#aecbf2',ink:'#193f78'},
 forest: {label:'Forest',accent:'#23754e',soft:'#eaf6ef',border:'#add6bc',ink:'#184c33'},
 rose: {label:'Rose',accent:'#b13d68',soft:'#fceef3',border:'#edb6c9',ink:'#772947'},
 amber: {label:'Amber',accent:'#92600d',soft:'#fff5df',border:'#e8cc91',ink:'#634109'},
 slate: {label:'Slate',accent:'#526175',soft:'#eef1f5',border:'#bdc7d4',ink:'#303d50'},
} as const;
export type ThemeName=keyof typeof themes;
export function themeVars(name:ThemeName='violet'){const t=themes[name]??themes.violet;return {'--accent':t.accent,'--accent-soft':t.soft,'--accent-border':t.border,'--accent-ink':t.ink};}
