"use client";

import React from 'react'
import { LogoutButtonProps } from '../types'
import { useRouter } from 'next/navigation'
import { useAuthClient } from 'better-auth/react';

const LogoutButton = ({children}:LogoutButtonProps) => {
    const router = useRouter();
    const { signOut } = useAuthClient();
    const onLogout = async()=>{
        await signOut()
        router.refresh()
    }
  return (
    <span className='cursor-pointer' onClick={onLogout}>
        {children}
    </span>
  )
}

export default LogoutButton