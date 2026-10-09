import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import {Link} from 'react-router-dom'
import { getProductImage } from '../utils/productImages'

const ProductItem = ({id,image,name,price}) => {
    
    const {currency} = useContext(ShopContext);

  return (
    <Link onClick={()=>scrollTo(0,0)} className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className=' overflow-hidden'>
        {getProductImage(image) ? (
          <img className='aspect-[3/4] w-full object-cover hover:scale-110 transition ease-in-out' src={getProductImage(image)} alt={name} loading="lazy" />
        ) : (
          <div className='aspect-[3/4] bg-gray-100 flex items-center justify-center text-sm text-gray-400'>Image unavailable</div>
        )}
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className=' text-sm font-medium'>{currency}{price}</p>
    </Link>
  )
}

export default ProductItem
