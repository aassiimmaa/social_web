'use server'

import prisma from '~/lib/prisma'
import { getDbUserId } from './user.action'
import { revalidatePath } from 'next/cache'

const createPost = async (content: string, image: string) => {
  try {
    const userId = await getDbUserId()

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId
      }
    })
    revalidatePath('/') //purge the cache for the homepage
    return { success: true, post }
  } catch (err) {
    console.error(err)
    return { success: false, message: 'Failed to create post' }
  }
}

export { createPost }
