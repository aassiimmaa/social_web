import { notFound } from 'next/navigation'
import React from 'react'
import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserPosts,
  isFolloing
} from '~/actions/profile.action'
import ProfilePageClient from './ProfilePageClient'

export const generateMetadata = async ({
  params
}: {
  params: { username: string }
}) => {
  const user = await getProfileByUsername(params.username)
  if (!user) return

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Check out ${user.username}'s profile.`
  }
}

const ProfilePageServer = async ({
  params
}: {
  params: { username: string }
}) => {
  const user = await getProfileByUsername(params.username)
  if (!user) return notFound()

  const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    isFolloing(user.id)
  ])

  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={isCurrentUserFollowing}
    />
  )
}

export default ProfilePageServer
