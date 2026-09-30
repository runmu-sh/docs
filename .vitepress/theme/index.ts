// The docs theme: VitePress's default theme (sidebar, outline, search, code groups, prev/next) with
// the runmu.sh shell around it from @muclient/brand, a section bar in place of the default navbar,
// and every --vp-c-* remapped to the brand tokens (theme.css). No fonts from the theme: the brand's
// come from Google Fonts through config.ts's head.
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme-without-fonts';
import '@muclient/brand/styles/tokens.css';
import '@muclient/brand/styles/shell.css';
import './theme.css';
import Layout from './Layout.vue';
import Cards from './components/Cards.vue';
import Card from './components/Card.vue';
import Since from './components/Since.vue';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // What VitePress's inline check-mac-os script did (csp.ts removes it): the ⌘/Ctrl hint on the search button.
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('mac', /Mac|iPhone|iPod|iPad/i.test(navigator.platform));
    app.component('Cards', Cards);
    app.component('Card', Card);
    app.component('Since', Since);
  },
} satisfies Theme;
