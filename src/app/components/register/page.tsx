'use client'


import { FormEvent, useCallback, useRef, useState,useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {supabase }from '../../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'


import useStore from '../../../../store'


const TextbookNew = () => {
  const router = useRouter()
  const { user, setUser } = useStore()
  const titleRef = useRef<HTMLInputElement>(null!)
  const authorRef = useRef<HTMLInputElement>(null!)
  const subjectRef = useRef<HTMLInputElement>(null!)
  const gradeRef = useRef<HTMLInputElement>(null!)
  const detailsRef = useRef<HTMLTextAreaElement>(null!)
  const [image, setImage] = useState<File>(null!)

  useEffect(() => { 
    const fetchUser = async () => { 
      const { data: { user } } = await supabase.auth.getUser() 
      setUser({ id: user?.id, email: user?.email }) 
    } 
    fetchUser() 
}, [setUser])

  // 画像アップロード
  const onUploadImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files


    if (!files || files?.length === 0) {
      return
    }
    setImage(files[0])
  }, [])


  // 送信
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('onSubmit called');
    if (user.id) {
      // supabaseストレージに画像アップロード
      const { data: storageData, error: storageError } = await supabase.storage
        .from('textbook')
        .upload(`${user.id}/${uuidv4()}`, image)


      if (storageError) {
        alert(storageError.message)
        return
      }
      console.log('ユーザーID:', user.id)
      console.log('タイトル:', titleRef.current.value)
      console.log('ストレージデータ:', storageData)
      // 画像URL取得
      const { data: urlData } = await supabase.storage.from('textbook').getPublicUrl(storageData.path)


      // 教科書データを新規作成
      const { error: insertError } = await supabase.from('textbook').insert({
        title: titleRef.current.value,
        author: authorRef.current.value,
        subject: subjectRef.current.value,
        grade: parseInt(gradeRef.current.value, 10),
        details: detailsRef.current.value,
        image_url: urlData.publicUrl,
        user_id: user.id,
      })


      if (insertError) {
        alert(insertError.message)
        return
      }
      console.log('データが正常に挿入されました。')
      // トップページに遷移
      router.push('/mypage')
      router.refresh()
    }
  }


  return (
    <div className="max-w-screen-md mx-auto">
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <div className="text-sm mb-1">タイトル</div>
          <input
            className="w-full bg-gray-100 rounded border py-1 px-3 outline-none focus:bg-transparent focus:ring-2 focus:ring-yellow-500"
            ref={titleRef}
            type="text"
            id="title"
            placeholder="Title"
            required
          />
        </div>


        <div className="mb-5">
          <div className="text-sm mb-1">著者</div>
          <input
            className="w-full bg-gray-100 rounded border py-1 px-3 outline-none focus:bg-transparent focus:ring-2 focus:ring-yellow-500"
            ref={authorRef}
            type="text"
            id="author"
            placeholder="Author"
          />
        </div>


        <div className="mb-5">
          <div className="text-sm mb-1">科目</div>
          <input
            className="w-full bg-gray-100 rounded border py-1 px-3 outline-none focus:bg-transparent focus:ring-2 focus:ring-yellow-500"
            ref={subjectRef}
            type="text"
            id="subject"
            placeholder="Subject"
          />
        </div>


        <div className="mb-5">
          <div className="text-sm mb-1">学年</div>
          <input
            className="w-full bg-gray-100 rounded border py-1 px-3 outline-none focus:bg-transparent focus:ring-2 focus:ring-yellow-500"
            ref={gradeRef}
            type="number"
            id="grade"
            placeholder="Grade"
          />
        </div>


        <div className="mb-5">
          <div className="text-sm mb-1">詳細</div>
          <textarea
            className="w-full bg-gray-100 rounded border py-1 px-3 outline-none focus:bg-transparent focus:ring-2 focus:ring-yellow-500"
            ref={detailsRef}
            id="details"
            placeholder="Details"
            rows={15}
          />
        </div>


        <div className="mb-5">
          <div className="text-sm mb-1">画像</div>
          <input type="file" id="image" onChange={onUploadImage} />
        </div>


        <div className="text-center mb-5">
          <button
            type="submit"
            className="w-full text-white bg-yellow-500 hover:brightness-110 rounded py-1 px-8"
          >
            作成
          </button>
        </div>
      </form>
    </div>
  )
}


export default TextbookNew



