'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '~/lib/prisma'
import { getDbUserId } from './user.action'

const getProfileByUsername = async (username: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw new Error('Failed to fetch profile')
  }
}

const getUserPosts = async (userId: string) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        likes: {
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return posts
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw new Error('Failed to fetch user posts')
  }
}

const getUserLikedPosts = async (userId: string) => {
  try {
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId
          }
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        likes: {
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return likedPosts
  } catch (error) {
    console.error('Error fetching liked posts:', error)
    throw new Error('Failed to fetch liked posts')
  }
}

const updateProfile = async (formdata: FormData) => {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) throw new Error('Unauthorized')

    const name = formdata.get('name') as string
    const bio = formdata.get('bio') as string
    const location = formdata.get('location') as string
    const website = formdata.get('website') as string

    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        name,
        bio,
        location,
        website
      }
    })

    revalidatePath('/profile')
    return { success: true, user }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

const isFolloing = async (userId: string) => {
  try {
    const currentUserId = await getDbUserId()
    if (!currentUserId) return false

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    })

    return !!follow
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}

export {
  getProfileByUsername,
  getUserPosts,
  getUserLikedPosts,
  updateProfile,
  isFolloing
}
