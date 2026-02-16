export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'servicescape',
    user: process.env.DB_USER || 'servicescape_user',
    password: process.env.DB_PASSWORD || 'servicescape_pass',
  };
}
