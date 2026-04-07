'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let key = ''
  for (let i = 0; i < 12; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export async function createAccessKey(formData: FormData) {
  const planType = formData.get('planType') as string
  const emailTarget = (formData.get('emailTarget') as string)?.toLowerCase().trim() || null
  
  const plans: Record<string, { price: number; days: number; label: string }> = {
    test: { price: 0, days: 0.167, label: 'Teste 4h' },
    monthly: { price: 19.99, days: 30, label: 'Mensal' },
    yearly: { price: 179.88, days: 365, label: 'Anual' }
  }

  const plan = plans[planType] || plans.monthly
  
  const key = generateKey()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + (plan.days * 24))

  await prisma.accessKey.create({
    data: {
      key,
      planType,
      price: plan.price,
      status: 'active',
      expiresAt,
      emailTarget
    }
  })

  revalidatePath('/admin/keys')
  return { success: true, key }
}

export async function getAccessKeys() {
  return await prisma.accessKey.findMany({
    orderBy: { createdAt: 'desc' },
    include: { teacher: true }
  })
}

export async function renewAccessKey(keyId: string, days: number) {
  const key = await prisma.accessKey.findUnique({ where: { id: keyId } })
  
  if (!key) {
    return { error: 'Chave não encontrada' }
  }

  const newExpiresAt = new Date()
  if (key.expiresAt > new Date()) {
    newExpiresAt.setTime(key.expiresAt.getTime())
  }
  newExpiresAt.setDate(newExpiresAt.getDate() + days)

  await prisma.accessKey.update({
    where: { id: keyId },
    data: { expiresAt: newExpiresAt, status: 'active' }
  })

  revalidatePath('/admin/keys')
  return { success: true }
}

export async function cancelAccessKey(keyId: string) {
  await prisma.accessKey.update({
    where: { id: keyId },
    data: { status: 'cancelled' }
  })

  revalidatePath('/admin/keys')
  return { success: true }
}

export async function deleteAccessKey(keyId: string) {
  await prisma.accessKey.delete({
    where: { id: keyId }
  })

  revalidatePath('/admin/keys')
  return { success: true }
}

export async function assignKeyToTeacher(keyId: string, teacherId: string) {
  const key = await prisma.accessKey.findUnique({ where: { id: keyId } })
  
  if (!key) {
    return { error: 'Chave não encontrada' }
  }

  if (key.status === 'used') {
    return { error: 'Chave já foi utilizada' }
  }

  if (key.teacherId && key.teacherId !== teacherId) {
    return { error: 'Chave já está vinculada a outro professor' }
  }

  await prisma.accessKey.update({
    where: { id: keyId },
    data: { 
      teacherId: teacherId,
      status: 'used',
      usedAt: new Date()
    }
  })

  await prisma.user.update({
    where: { id: teacherId },
    data: { 
      paymentStatus: 'active',
      blocked: false
    }
  })

  revalidatePath('/admin/keys')
  revalidatePath('/admin/teachers')
  return { success: true }
}
