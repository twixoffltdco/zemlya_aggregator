import {cache} from 'react';
import * as cheerio from 'cheerio';
import {cacheSeconds,streamliveApi,streamliveApiKey,timeoutMs,sources,Source} from './config';

async function fetchJson<T>(url:string,key?:string):Promise<T|null>{
 const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeoutMs);
 try{const res=await fetch(url,{headers:{Accept:'application/json',...(key?{'X-API-Key':key}:{})},signal:c.signal,next:{revalidate:cacheSeconds}});if(!res.ok)return null;return await res.json() as T}catch{return null}finally{clearTimeout(timer)}
}
async function fetchText(url:string,key?:string){const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeoutMs);try{const r=await fetch(url,{headers:{Accept:'text/html',...(key?{'X-API-Key':key}:{})},signal:c.signal,next:{revalidate:cacheSeconds}});if(!r.ok)return null;return await r.text()}catch{return null}finally{clearTimeout(timer)}}
function withParams(base:string,p:Record<string,string|number|undefined>){const u=new URL(base);for(const[k,v]of Object.entries(p))if(v!==undefined)u.searchParams.set(k,String(v));return u.toString()}
function sourceList():Source[]{return sources.length?sources:[{id:'streamlive',name:'StreamLive',baseUrl:new URL(streamliveApi).origin,apiUrl:streamliveApi,apiKey:streamliveApiKey}]}
function abs(base:string,url?:string){if(!url)return '';try{return new URL(url,base).toString()}catch{return url||''}}
async function sourceData(s:Source,type:'videos'|'tv'|'radio'|'forum'){const api=s.apiUrl||`${s.baseUrl.replace(/\/$/,'')}/api.php`;const q=type==='videos'?{type:'videos',limit:40}:type==='forum'?{type:'forum',limit:40}:{type:'channels',type_filter:type,limit:40};const j=await fetchJson<any>(withParams(api,q),s.apiKey);return {s,data:j?.data};}
export const getChannels=cache(async(type:'tv'|'radio')=>{const all=await Promise.all(sourceList().map(s=>sourceData(s,type)));return all.flatMap(({s,data}:any)=>(Array.isArray(data)?data:[]).map((x:any)=>({...x,source:s.id,logo_url:abs(s.baseUrl,x.logo_url),player_url:abs(s.baseUrl,x.player_url||`/embed.php?slug=${encodeURIComponent(x.slug)}`)}))).filter((x:any,i:number,a:any[])=>a.findIndex(y=>y.slug===x.slug&&y.type===x.type)===i).slice(0,80)});
export const getVideos=cache(async()=>{const all=await Promise.all(sourceList().map(s=>sourceData(s,'videos')));return all.flatMap(({s,data}:any)=>(Array.isArray(data)?data:[]).map((x:any)=>({...x,source:s.id,thumbnail_url:abs(s.baseUrl,x.thumbnail_url),embed_url:abs(s.baseUrl,x.embed_url||`/embed.php?slug=${encodeURIComponent(x.slug)}`)}))).filter((x:any,i:number,a:any[])=>a.findIndex(y=>y.slug===x.slug)===i).slice(0,80)});
export const getThreads=cache(async()=>{const all=await Promise.all(sourceList().map(s=>sourceData(s,'forum')));return all.flatMap(({s,data}:any)=>{if(Array.isArray(data?.threads))return data.threads.map((x:any)=>({...x,source:s.id}));const cats=data?.categories||[];return cats.flatMap((c:any)=>c.last_thread?[{...c.last_thread,source:s.id}]:[])}).filter((x:any,i:number,a:any[])=>a.findIndex(y=>String(y.id)===String(x.id))===i).slice(0,80)});
export async function getThread(id:string){
 const detailBase=process.env.ZEMLYA_FORUM_DETAIL_API;
 if(detailBase){const j=await fetchJson<any>(withParams(detailBase,{id}),streamliveApiKey);if(j?.ok&&j.thread)return j.thread;if(j?.id)return j;}
 for(const src of sourceList()){
  const html=await fetchText(`${src.baseUrl.replace(/\/$/,'')}/forum_thread.php?id=${encodeURIComponent(id)}`,src.apiKey);if(!html)continue;
  const $=cheerio.load(html);const title=$('h1').first().text().replace(/\s+/g,' ').trim();const posts:any[]=[];
  $('.forum-post-list .forum-post').each((_,el)=>{const e=$(el);const body=e.find('.forum-post-body').first().text().replace(/\s+/g,' ').trim();if(!body)return;posts.push({id:e.attr('id')?.replace('post-','')||String(posts.length+1),username:e.find('.forum-post-author').first().find('b').first().text().trim()||e.find('.forum-post-author').first().text().replace(/\s+/g,' ').trim(),created_at:e.find('.forum-post-author span').first().text().trim(),message:body})});
  if(title||posts.length)return {id,title,posts,source:src.id};
 }
 return null;
}
