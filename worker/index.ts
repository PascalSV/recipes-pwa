import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { recipeRoutes } from './routes/recipes';
import { parseRoutes } from './routes/parse';

export interface Env {
  RECIPES_BUCKET: R2Bucket;
  TOKEN_CLAUDIA: string;
  TOKEN_PASCAL: string;
  ANTHROPIC_API_KEY: string;
  ALLOWED_USERS: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'] }));

app.route('/api/auth', authRoutes);
app.route('/api/recipes', recipeRoutes);
app.route('/api/recipes', parseRoutes);

export default app;
