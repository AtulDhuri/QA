# Environment Configuration

This project uses Angular environment files to manage different configurations for development and production.

## Environment Files

### Development Environment (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api',
  baseUrl: 'http://localhost:4200',
  backendUrl: 'http://localhost:3001'
};
```

### Production Environment (`src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: '/api', // Relative URL for production (same server)
  baseUrl: '', // Empty for same-origin requests
  backendUrl: '' // Empty for same-origin requests
};
```

## Usage

### Development
```bash
# Start development server
npm start
# or
ng serve
```

### Production Build
```bash
# Build for production
npm run build:prod
# or
ng build --configuration=production
```

### Development Build
```bash
# Build for development
npm run build:dev
# or
ng build --configuration=development
```

## How It Works

1. **Development**: Uses `environment.ts` with full URLs pointing to localhost
2. **Production**: Uses `environment.prod.ts` with relative URLs (same server)
3. **File Replacement**: Angular CLI automatically replaces `environment.ts` with `environment.prod.ts` during production builds

## API Endpoints

All services now use `environment.apiUrl` to construct API endpoints:

- **Development**: `http://localhost:3001/api/auth/login`
- **Production**: `/api/auth/login` (relative to same server)

## Proxy Configuration

The `proxy.conf.json` is used only in development to forward API requests from Angular dev server (port 4200) to backend server (port 3001). 