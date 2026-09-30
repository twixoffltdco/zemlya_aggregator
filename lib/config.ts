export type Source={id:string;name:string;baseUrl:string;apiUrl?:string;apiKey?:string};
export const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||'https://zemlya.example.com').replace(/\/$/,'');
export const sources:Source[]=(()=>{try{return JSON.parse(process.env.ZEMLYA_SOURCES_JSON||'[]')}catch{return[]}})();
export const streamliveApi=process.env.ZEMLYA_STREAMLIVE_API||'https://mtwixoffbe846.users.myrn.ru/api.php';
export const streamliveApiKey=process.env.ZEMLYA_STREAMLIVE_API_KEY||'';
export const cacheSeconds=Math.max(30,Number(process.env.ZEMLYA_CACHE_SECONDS||60));
export const timeoutMs=Math.max(2000,Number(process.env.ZEMLYA_REQUEST_TIMEOUT_MS||7000));
