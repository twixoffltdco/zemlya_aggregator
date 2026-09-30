export type Source={id:string;name:string;baseUrl:string;apiUrl?:string;apiKey?:string};

export const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||'https://zemlya.example.com').replace(/\/$/,'');

const defaultSources:Source[]=[
  {id:'domtv',name:'DOM TV',baseUrl:'https://domtv.blyz.ru'},
  {id:'streamlive',name:'StreamLive',baseUrl:'https://streamlivetv.freedev.app'},
  {id:'streamliveru',name:'StreamLive RU',baseUrl:'https://streamliveru.web1.websitegame.ru'},
  {id:'myrn',name:'StreamLive Catalog',baseUrl:'https://mtwixoffbe846.users.myrn.ru'},
];

function normalizeSources(value:unknown):Source[]{
  if(!Array.isArray(value)||value.length===0)return [];
  return value.filter((s:any)=>s&&typeof s==='object'&&typeof s.id==='string'&&typeof s.baseUrl==='string')
    .map((s:any)=>({id:s.id,name:typeof s.name==='string'&&s.name?s.name:s.id,baseUrl:String(s.baseUrl).replace(/\/$/,''),apiUrl:typeof s.apiUrl==='string'&&s.apiUrl?s.apiUrl:undefined,apiKey:typeof s.apiKey==='string'&&s.apiKey?s.apiKey:undefined}));
}

export const sources:Source[]=(()=>{try{
  const raw=process.env.ZEMLYA_SOURCES_JSON;
  if(raw){const parsed=normalizeSources(JSON.parse(raw));if(parsed.length)return parsed;}
}catch{}
return defaultSources.map((s)=>({...s,apiUrl:`${s.baseUrl}/api.php`}));
})();

export const streamliveApi=process.env.ZEMLYA_STREAMLIVE_API||'https://mtwixoffbe846.users.myrn.ru/api.php';
export const streamliveApiKey=process.env.ZEMLYA_STREAMLIVE_API_KEY||'';
export const cacheSeconds=Math.max(30,Number(process.env.ZEMLYA_CACHE_SECONDS||60));
export const timeoutMs=Math.max(2000,Number(process.env.ZEMLYA_REQUEST_TIMEOUT_MS||8000));
