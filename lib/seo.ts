import {siteUrl} from './config';
export function jsonLd(data:unknown){return {__html:JSON.stringify(data)}}
export const organization={"@context":"https://schema.org","@type":"Organization",name:"Земля",url:siteUrl,logo:`${siteUrl}/logo.svg`,description:"Платформа для просмотра ТВ, радио, видео и публикаций форума."};
export function videoSchema(v:any){return {"@context":"https://schema.org","@type":"VideoObject",name:v.title,description:v.description||v.title,thumbnailUrl:v.thumbnail_url?[v.thumbnail_url]:undefined,url:`${siteUrl}/video/${v.slug}`}}
