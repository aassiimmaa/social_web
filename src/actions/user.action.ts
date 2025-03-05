'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '~/lib/prisma'

const syncUser = async () => {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) return

    //check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    })
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ''} ${user.lastName || ''}`,
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split('@')[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl
      }
    })

    return dbUser
  } catch (error) {
    console.log('error in syncUser', error)
  }
}

const getUserByClerkId = async (clerkId: string) => {
  return prisma.user.findUnique({
    where: {
      clerkId
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true
        }
      }
    }
  })
}

const getDbUserId = async () => {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')
  return user.id
}

const getRandomUsers = async () => {
  try {
    const userId = await getDbUserId()

    if (!userId) return []

    //get 3 random users exclude ourselves and user that we already follow.
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true
          }
        }
      },
      take: 3
    })
    return randomUsers
  } catch (err) {
    console.log('Error fetching random users', err)
    return []
  }
}

const toggleFollow = async (targetUserId: string) => {
  try {
    const userId = await getDbUserId()

    if (!userId) return

    if (userId === targetUserId) throw new Error('You cannot follow yourself')

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      //unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId
          }
        }
      })
    } else {
      //follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId
          }
        }),

        prisma.notification.create({
          data: {
            type: 'FOLLOW',
            userId: targetUserId,
            creatorId: userId
          }
        })
      ])
    }
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.log('Error in toggle Follow', error)
    return { success: false, error: 'Error toggling follow' }
  }
}

export { syncUser, getUserByClerkId, getDbUserId, getRandomUsers, toggleFollow }
