"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {supabase }from '../../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import useStore from '../../../../store'
import { Interface } from "readline";

const TextbookNew = () => {
    const router = useRouter()
    const { user, setUser } = useStore()


  
    useEffect(() => { 
      const fetchUser = async () => { 
        const { data: { user } } = await supabase.auth.getUser() 
        setUser({ id: user?.id, email: user?.email }) 
      } 
      fetchUser() 
  }, [setUser])
  
}