import {cache} from 'react';
import * as cheerio from 'cheerio';
import {cacheSeconds,streamliveApi,streamliveApiKey,timeoutMs,sources,Source} from './config';

type Kind='videos'|'tv'|'radio'|'forum';

async function fetchJson<T>(url:string,key?:string):Promise<T|null>{
 const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeoutMs);
 try{
  const res=await fetch(url,{headers:{Accept:'application/json',...(key?{'X-API-Key':key}:{})},signal:c.signal,next:{revalidate:cacheSeconds}});
  if(!res.ok)return null;
  return await res.json() as T;
 }catch{return null}finally{clearTimeout(timer)}
}

async function fetchText(url:string,key?:string){
 const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeoutMs);
 try{
  const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',...(key?{'X-API-Key':key}:{})},signal:c.signal,next:{revalidate:cacheSeconds}});
  if(!r.ok)return null;
  return await r.text();
 }catch{return null}finally{clearTimeout(timer)}
}

function withParams(base:string,p:Record<string,string|number|undefined>){
 const u=new URL(base);for(const[k,v]of Object.entries(p))if(v!==undefined)u.searchParams.set(k,String(v));return u.toString();
}
function abs(base:string,url?:string){if(!url)return '';try{return new URL(url,base).toString()}catch{return url||''}}
function baseUrl(s:Source){return s.baseUrl.replace(/\/$/,'')}
function apiUrl(s:Source){return s.apiUrl||`${baseUrl(s)}/api.php`}

function asArray(v:any):any[]{return Array.isArray(v)?v:[]}

function normalizeChannel(x:any,s:Source,type:'tv'|'radio'){
 const slug=String(x?.slug??x?.key??x?.id??'');
 return {...x,slug,type:x?.type||type,source:s.id,
  logo_url:abs(baseUrl(s),x?.logo_url||x?.cover_url||x?.avatar_url||x?.logo),
  player_url:abs(baseUrl(s),x?.player_url||x?.embed||x?.embed_url||`/embed.php?slug=${encodeURIComponent(slug)}`),
  channel_url:abs(baseUrl(s),x?.channel_url||`/channel.php?slug=${encodeURIComponent(slug)}`)
 };
}

async function fetchChannels(s:Source,type:'tv'|'radio'){
 const candidates=[
  withParams(apiUrl(s),{type:'channels',type_filter:type,limit:50}),
  withParams(`${baseUrl(s)}/api_channels.php`,{type,limit:50}),
  withParams(`${baseUrl(s)}/platforma/api_channels.php`,{type,limit:80})
 ];
 for(const url of candidates){
  const j=await fetchJson<any>(url,s.apiKey);
  const data=asArray(j?.data).length?j.data:asArray(j?.channels).length?j.channels:asArray(j?.items);
  if(data.length)return data.map((x:any)=>normalizeChannel(x,s,type));
 }
 return [];
}

async function fetchVideos(s:Source){
 const candidates=[
  withParams(apiUrl(s),{type:'videos',limit:50}),
  withParams(`${baseUrl(s)}/api_videos.php`,{limit:50})
 ];
 for(const url of candidates){
  const j=await fetchJson<any>(url,s.apiKey);
  const data=asArray(j?.data).length?j.data:asArray(j?.videos).length?j.videos:asArray(j?.items);
  if(data.length)return data.map((x:any)=>({
    ...x,source:s.id,
    thumbnail_url:abs(baseUrl(s),x?.thumbnail_url||x?.thumb||x?.image),
    embed_url:abs(baseUrl(s),x?.embed_url||x?.embed||`/video_embed.php?slug=${encodeURIComponent(String(x?.slug||''))}`),
    video_url:abs(baseUrl(s),x?.watch_url||x?.video_url||`/video.php?slug=${encodeURIComponent(String(x?.slug||''))}`)
  }));
 }
 // Последний резерв — штатный RSS этого движка.
 const xml=await fetchText(`${baseUrl(s)}/rss_videos.php?limit=100`,s.apiKey);
 if(xml){
  try{
   const $=cheerio.load(xml,{xml:true});const out:any[]=[];
   $('item').each((_,el)=>{
    const e=$(el),link=e.find('link').text().trim(),title=e.find('title').text().trim();
    const m=e.find('description').text().trim();const slug=(link.match(/[?&]slug=([^&]+)/)||[])[1]||'';
    if(title&&slug)out.push({slug:decodeURIComponent(slug),title,description:m,source:s.id,thumbnail_url:e.find('image').text().trim(),embed_url:abs(baseUrl(s),`/video_embed.php?slug=${encodeURIComponent(decodeURIComponent(slug))}`)});
   });if(out.length)return out;
  }catch{}
 }
 return [];
}

async function fetchForum(s:Source){
 // Этот endpoint есть именно в движке из архива и отдаёт последние темы напрямую.
 const p=await fetchJson<any>(withParams(`${baseUrl(s)}/platforma/api_forum.php`,{limit:40}),s.apiKey);
 if(Array.isArray(p)&&p.length)return p.map((x:any)=>({...x,source:s.id}));
 // Официальный api.php: сначала получаем категории, затем темы каждой категории.
 const j=await fetchJson<any>(withParams(apiUrl(s),{type:'forum',limit:50}),s.apiKey);
 const direct=asArray(j?.threads);
 if(direct.length)return direct.map((x:any)=>({...x,source:s.id}));
 const cats=asArray(j?.data?.categories||j?.categories);
 const all:any[]=[];
 for(const c of cats.slice(0,30)){
  const q=await fetchJson<any>(withParams(apiUrl(s),{type:'forum',category_id:Number(c.id),limit:50}),s.apiKey);
  const rows=asArray(q?.data?.threads).length?q.data.threads:asArray(q?.threads);
  all.push(...rows.map((x:any)=>({...x,source:s.id})));
 }
 if(all.length)return all;
 const xml=await fetchText(`${baseUrl(s)}/rss_forum.php?limit=100`,s.apiKey);
 if(xml){
  try{
   const $=cheerio.load(xml,{xml:true});const out:any[]=[];
   $('item').each((_,el)=>{
    const e=$(el),link=e.find('link').text().trim(),title=e.find('title').text().trim();
    const id=(link.match(/[?&]id=(\d+)/)||[])[1];
    if(title&&id)out.push({id,title,source:s.id,created_at:e.find('pubDate').text().trim(),thread_url:link});
   });if(out.length)return out;
  }catch{}
 }
 return [];
}

export const getChannels=cache(async(type:'tv'|'radio')=>{
 const all=await Promise.all(sources.map(s=>fetchChannels(s,type)));
 const seen=new Set<string>();const out:any[]=[];
 for(const rows of all)for(const x of rows){
  const key=`${x.source}:${x.slug}`;
  if(!x.slug||seen.has(key))continue;seen.add(key);out.push(x);
 }
 return out.slice(0,200);
});

export const getVideos=cache(async()=>{
 const all=await Promise.all(sources.map(fetchVideos));
 const seen=new Set<string>();const out:any[]=[];
 for(const rows of all)for(const x of rows){
  const key=`${x.source}:${x.slug||x.id}`;
  if(seen.has(key))continue;seen.add(key);out.push(x);
 }
 return out.slice(0,200);
});

export const getThreads=cache(async()=>{
 const all=await Promise.all(sources.map(fetchForum));
 const seen=new Set<string>();const out:any[]=[];
 for(const rows of all)for(const x of rows){
  const key=`${x.source}:${x.id}`;
  if(seen.has(key))continue;seen.add(key);out.push(x);
 }
 return out.sort((a,b)=>String(b.last_post_at||b.created_at||'').localeCompare(String(a.last_post_at||a.created_at||''))).slice(0,200);
});

export async function getThread(id:string,sourceId?:string){
 const wanted=sources.filter(s=>!sourceId||s.id===sourceId);
 const detailBase=process.env.ZEMLYA_FORUM_DETAIL_API;
 if(detailBase){
  const j=await fetchJson<any>(withParams(detailBase,{id,source:sourceId}),streamliveApiKey);
  if(j?.ok&&j.thread)return j.thread;if(j?.id)return j;
 }
 for(const src of wanted){
  const html=await fetchText(`${baseUrl(src)}/forum_thread.php?id=${encodeURIComponent(id)}`,src.apiKey);
  if(!html)continue;
  const $=cheerio.load(html);
  const title=$('h1').first().text().replace(/\s+/g,' ').trim();
  const posts:any[]=[];
  $('.forum-post-list .forum-post').each((_,el)=>{
   const e=$(el);
   const body=e.find('.forum-post-body').first().text().replace(/\s+/g,' ').trim();
   if(!body)return;
   const author=e.find('.forum-post-author b').first().text().replace(/\s+/g,' ').trim()||
     e.find('.forum-post-author').first().clone().children().remove().end().text().replace(/\s+/g,' ').trim();
   const created=e.find('.forum-post-author span').first().text().trim();
   posts.push({id:e.attr('id')?.replace('post-','')||String(posts.length+1),username:author||'Автор',created_at:created,message:body});
  });
  if(title||posts.length)return {id,title,posts,source:src.id};
 }
 return null;
}
