import { env } from 'cloudflare:workers';
import { accountAPI } from '../../../../server/account-api';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => accountAPI(request, env);
export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
