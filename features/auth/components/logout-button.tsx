"use client";

import React from 'react'
import { LogoutButtonProps } from '../types'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client';

const LogoutButton = ({children}:LogoutButtonProps) => {
    const router = useRouter();
    const { signOut } = authClient;
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