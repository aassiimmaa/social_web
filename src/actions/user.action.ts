'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import React from 'react'
import prisma from '~/lib/prisma'

async function syncUser() {
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

export default syncUser
