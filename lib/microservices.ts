// Microservices architecture for horizontal scaling

export interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  healthCheck: string;
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
    targetMemoryUtilization: number;
  };
}

export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
  healthCheckInterval: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  timeout: number;
}

export class MicroservicesArchitecture {
  private static services: Map<string, ServiceConfig> = new Map();

  static initializeServices(): void {
    // User Service
    this.services.set('user-service', {
      name: 'user-service',
      version: '1.0.0',
      port: 3001,
      healthCheck: '/health',
      scaling: {
        minInstances: 2,
        maxInstances: 10,
        targetCpuUtilization: 70,
        targetMemoryUtilization: 80,
      },
    });

    // Commitment Service
    this.services.set('commitment-service', {
      name: 'commitment-service',
      version: '1.0.0',
      port: 3002,
      healthCheck: '/health',
      scaling: {
        minInstances: 3,
        maxInstances: 20,
        targetCpuUtilization: 75,
        targetMemoryUtilization: 85,
      },
    });

    // Feed Service
    this.services.set('feed-service', {
      name: 'feed-service',
      version: '1.0.0',
      port: 3003,
      healthCheck: '/health',
      scaling: {
        minInstances: 2,
        maxInstances: 15,
        targetCpuUtilization: 70,
        targetMemoryUtilization: 80,
      },
    });

    // AI Service (Gemini)
    this.services.set('ai-service', {
      name: 'ai-service',
      version: '1.0.0',
      port: 3004,
      healthCheck: '/health',
      scaling: {
        minInstances: 1,
        maxInstances: 5,
        targetCpuUtilization: 60,
        targetMemoryUtilization: 70,
      },
    });

    // Notification Service
    this.services.set('notification-service', {
      name: 'notification-service',
      version: '1.0.0',
      port: 3005,
      healthCheck: '/health',
      scaling: {
        minInstances: 1,
        maxInstances: 5,
        targetCpuUtilization: 65,
        targetMemoryUtilization: 75,
      },
    });
  }

  static getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.services.get(serviceName);
  }

  static getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  // Generate Docker Compose for microservices
  static generateDockerCompose(): string {
    const services: string[] = [];

    for (const [name, config] of this.services.entries()) {
      services.push(`
  ${name}:
    build:
      context: ./services/${name}
      dockerfile: Dockerfile
    ports:
      - "${config.port}:${config.port}"
    environment:
      - NODE_ENV=production
      - PORT=${config.port}
      - DATABASE_URL=${process.env.DATABASE_URL}
      - REDIS_URL=${process.env.REDIS_URL}
    deploy:
      replicas: ${config.scaling.minInstances}
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${config.port}${config.healthCheck}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped`);
    }

    return `
version: '3.8'

services:
${services.join('')}

  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - user-service
      - commitment-service
      - feed-service
      - ai-service
      - notification-service
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Database (PostgreSQL)
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=${process.env.DB_NAME}
      - POSTGRES_USER=${process.env.DB_USER}
      - POSTGRES_PASSWORD=${process.env.DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
`;
  }

  // Generate Kubernetes deployment files
  static generateKubernetesDeployments(): string[] {
    const deployments: string[] = [];

    for (const [name, config] of this.services.entries()) {
      deployments.push(`
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  labels:
    app: ${name}
spec:
  replicas: ${config.scaling.minInstances}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: foundertype/${name}:${config.version}
        ports:
        - containerPort: ${config.port}
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "${config.port}"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: ${config.healthCheck}
            port: ${config.port}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: ${config.healthCheck}
            port: ${config.port}
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
  - protocol: TCP
    port: 80
    targetPort: ${config.port}
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}
  minReplicas: ${config.scaling.minInstances}
  maxReplicas: ${config.scaling.maxInstances}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${config.scaling.targetCpuUtilization}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: ${config.scaling.targetMemoryUtilization}
`);
    }

    return deployments;
  }

  // Generate Nginx load balancer configuration
  static generateNginxConfig(): string {
    return `
upstream user_service {
    least_conn;
    server user-service:3001 max_fails=3 fail_timeout=30s;
}

upstream commitment_service {
    least_conn;
    server commitment-service:3002 max_fails=3 fail_timeout=30s;
}

upstream feed_service {
    least_conn;
    server feed-service:3003 max_fails=3 fail_timeout=30s;
}

upstream ai_service {
    least_conn;
    server ai-service:3004 max_fails=3 fail_timeout=30s;
}

upstream notification_service {
    least_conn;
    server notification-service:3005 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.foundertype.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # User service routes
    location /api/users/ {
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Commitment service routes
    location /api/commitments/ {
        proxy_pass http://commitment_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Feed service routes
    location /api/feed/ {
        proxy_pass http://feed_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # AI service routes
    location /api/ai/ {
        proxy_pass http://ai_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Notification service routes
    location /api/notifications/ {
        proxy_pass http://notification_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name api.foundertype.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Include same location blocks as HTTP server
    include /etc/nginx/conf.d/api-routes.conf;
}
`;
  }
}

// Service discovery and health monitoring
export class ServiceDiscovery {
  private static services = new Map<string, string[]>();

  static registerService(serviceName: string, instanceId: string): void {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
    }
    const instances = this.services.get(serviceName)!;
    if (!instances.includes(instanceId)) {
      instances.push(instanceId);
    }
  }

  static deregisterService(serviceName: string, instanceId: string): void {
    const instances = this.services.get(serviceName);
    if (instances) {
      const index = instances.indexOf(instanceId);
      if (index > -1) {
        instances.splice(index, 1);
      }
    }
  }

  static getHealthyInstances(serviceName: string): string[] {
    return this.services.get(serviceName) || [];
  }

  static async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [serviceName, instances] of this.services.entries()) {
      results[serviceName] = instances.length > 0;
    }

    return results;
  }
}

// Circuit breaker pattern for resilience
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Initialize microservices
MicroservicesArchitecture.initializeServices();
