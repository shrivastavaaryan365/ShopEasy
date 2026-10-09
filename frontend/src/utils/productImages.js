const getImageUrl = (image) => {
  if (typeof image === 'string') return image.trim();
  if (image && typeof image === 'object') {
    // Product documents can contain either a URL string or an upload object.
    // Prefer Cloudinary's HTTPS URL, then handle common API/storage variants.
    const candidate = image.secure_url ?? image.url ?? image.src ?? image.path ?? image.image;
    return typeof candidate === 'string' ? candidate.trim() : '';
  }
  return '';
};

export const getProductImages = (images) => {
  const imageList = Array.isArray(images) ? images : [images];
  return imageList.map(getImageUrl).filter(Boolean);
};

export const getProductImage = (images) => getProductImages(images)[0] || '';
