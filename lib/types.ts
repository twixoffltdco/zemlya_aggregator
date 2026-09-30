export type Video={id?:number|string;slug:string;title:string;thumbnail_url?:string;views_count?:number;channel_title?:string;channel_slug?:string;description?:string;embed_url?:string;source?:string};
export type Channel={id?:number|string;slug:string;title:string;logo_url?:string;type:'tv'|'radio';views?:number;description?:string;player_url?:string;source?:string};
export type Thread={id:number|string;title:string;username?:string;author_username?:string;created_at?:string;last_post_at?:string;post_count?:number;source?:string};
export type Post={id:number|string;username?:string;message:string;created_at?:string;avatar?:string};
export type ThreadDetail={id:number|string;title:string;category_title?:string;posts:Post[];source?:string};
