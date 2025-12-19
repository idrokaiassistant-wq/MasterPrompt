import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Get All Subscriptions
  fastify.get('/subscriptions', async (request, reply) => {
    const subs = await prisma.subscription.findMany({
      where: { isActive: true }
    })
    return subs
  })

  // Subscribe User (Mock Payment)
  fastify.post('/subscribe', async (request, reply) => {
    const { telegramId, subscriptionId, provider } = request.body as any

    try {
      const sub = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      })

      if (!sub) return reply.status(404).send({ error: 'Subscription not found' })

      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) }
      })

      if (!user) return reply.status(404).send({ error: 'User not found' })

      // Mock Payment Processing
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: sub.price,
          currency: sub.currency,
          provider: provider || 'manual',
          status: 'COMPLETED', // Auto-complete for now
          transactionId: `TX-${Date.now()}`
        }
      })

      // Update User Subscription
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + sub.duration)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionId: sub.id,
          subExpiresAt: expiresAt,
          balance: { decrement: sub.price } // Deduct from balance if using internal wallet
        }
      })

      return { success: true, paymentId: payment.id, expiresAt }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Subscription failed' })
    }
  })
}
