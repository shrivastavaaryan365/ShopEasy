import React from 'react'

const Navbar = ({setToken}) => {
  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
        <span className='text-2xl font-bold tracking-[-1px]'><span className='text-gray-900'>Shop</span><span className='text-[#c586a5]'>Easy</span><span className='ml-2 text-xs font-medium tracking-normal text-gray-500'>ADMIN</span></span>
        <button onClick={()=>setToken('')} className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'>Logout</button>
    </div>
  )
}

export default Navbar
