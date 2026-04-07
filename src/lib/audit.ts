import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { createPaginatedResponse } from './api-utils';

export type AuditAction = 'create' | 'update' | 'delete';
export type AuditEntity = 
  | 'user' | 'class' | 'student' | 'lesson' 
  | 'grade' | 'material' | 'topic' | 'activity';

interface AuditContext {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  description?: string;
  metadata?: Record<string, any>;
}

class AuditLogger {
  private enabled = true;

  async log(ctx: AuditContext): Promise<void> {
    if (!this.enabled) return;

    try {
      const session = await getSession();
      if (!session?.user) return;

      const headersList = await headers();
      const ipAddress = 
        headersList.get('x-forwarded-for')?.split(',')[0] || 
        headersList.get('x-real-ip') || 
        'unknown';
      
      const userAgent = headersList.get('user-agent') || 'unknown';

      await prisma.auditLog.create({
        data: {
          teacherId: session.user.id,
          action: ctx.action,
          entity: ctx.entity,
          entityId: ctx.entityId,
          description: ctx.description,
          details: ctx.metadata ? JSON.stringify(ctx.metadata) : null,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('[Audit] Failed to log:', error);
    }
  }

  async logCreate(entity: AuditEntity, entityId: string, data?: Record<string, any>): Promise<void> {
    await this.log({ action: 'create', entity, entityId, metadata: data });
  }

  async logUpdate(entity: AuditEntity, entityId: string, oldData?: Record<string, any>, newData?: Record<string, any>): Promise<void> {
    await this.log({ 
      action: 'update', 
      entity, 
      entityId, 
      metadata: { old: oldData, new: newData } 
    });
  }

  async logDelete(entity: AuditEntity, entityId: string, data?: Record<string, any>): Promise<void> {
    await this.log({ action: 'delete', entity, entityId, metadata: data });
  }

  disable(): void {
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }
}

export const audit = new AuditLogger();

export async function getAuditLogs(
  filters: {
    action?: AuditAction;
    entity?: AuditEntity;
    startDate?: Date;
    endDate?: Date;
  },
  pagination: { page: number; limit: number }
) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const where: any = { teacherId: session.user.id };
  
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const skip = (pagination.page - 1) * pagination.limit;
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return createPaginatedResponse(logs, total, pagination.page, pagination.limit);
}