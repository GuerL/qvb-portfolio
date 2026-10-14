import { renderToString } from 'react-dom/server';
import App from './App';
export { metadata, metaEntries, indexableRoutes, serializeJsonLd, site } from './data/seo';
export function render(path: string) { return renderToString(<App path={path}/>); }
