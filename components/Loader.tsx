import { NextPage } from 'next'
import React from 'react'
import { Interface } from 'readline'

interface props {
    text: string
}

const Loader: React.FC<props> = ({ text }) => {
    return (
        <div className="fixed top-0 right-0 left-0 bottom-0 bg-black opacity-60 flex justify-center flex-col gap-2 items-center">
            <div className="loader"></div>
            <p className='z-30 text-white font-semibold font-Quicksand text-2xl'>{text}</p>
        </div>
    )
}

export default Loader