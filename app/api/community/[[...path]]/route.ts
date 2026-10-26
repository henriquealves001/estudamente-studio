import { env } from 'cloudflare:workers';
import { communityAPI } from '../../../../server/community-api';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>communityAPI(request,env);
export const POST=GET;
export const PUT=GET;
export const DELETE=GET;
