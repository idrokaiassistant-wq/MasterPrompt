import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function userRoutes(fastify: FastifyInstance) {
  // Get User Profile
  fastify.get('/profile/:telegramId', async (request, reply) => {
    const { telegramId } = request.params as { telegramId: string }
    
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
        include: { subscription: true }
      })

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      // Convert BigInt to string for JSON serialization
      return {
        ...user,
        telegramId: user.telegramId?.toString(),
        subscription: user.subscription
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal Server Error' })
    }
  })

  // Update Profile
  fastify.put('/profile/:telegramId', async (request, reply) => {
    const { telegramId } = request.params as { telegramId: string }
    const { firstName, lastName, phone, language } = request.body as any

    try {
      const user = await prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: {
          firstName,
          lastName,
          phone,
          language
        }
      })

      return {
        ...user,
        telegramId: user.telegramId?.toString()
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Failed to update profile' })
    }
  })
}
