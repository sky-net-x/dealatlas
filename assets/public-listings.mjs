// Pure normalization for resell.store's explicitly public, unauthenticated marketplace search.
// Listings are seller-provided claims; none is independently verified or classified as a bargain.
export const RESELL_PUBLIC_BASE='https://api.resell.store/v1/market/search';
export const RESELL_CATEGORIES=['All','Clothing','Shoes','Bags','Home','Collectibles','Books','Tech','Kids','Garden'];
const MAX_QUERY_LENGTH=80;
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const storePattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function buildListingSearchUrl({query='',category='All',offset=0,limit=12,sort=null}={}) {
  if(typeof query!=='string'||query.length>160)throw Error('Query is too long');
  const q=query.trim().slice(0,MAX_QUERY_LENGTH);
  if(!RESELL_CATEGORIES.includes(category))throw Error('Unsupported category');
  if(!Number.isInteger(offset)||offset<0||offset>2000)throw Error('Invalid page offset');
  if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('Invalid page size');
  const url=new URL(RESELL_PUBLIC_BASE);
  if(q)url.searchParams.set('q',q);
  if(category!=='All')url.searchParams.set('category',category);
  if(sort!==null && !['best','newest','price-asc','price-desc'].includes(sort))throw Error('Unsupported sort order');
  url.searchParams.set('sort',sort || (q?'best':'newest'));
  url.searchParams.set('limit',String(limit));
  url.searchParams.set('offset',String(offset));
  return url.toString();
}

export function validatePublicListing(item) {
  if(!item||item.object!=='public_listing'||!idPattern.test(String(item.id||''))||
     !storePattern.test(String(item.store||''))||
     typeof item.title!=='string'||!item.title.trim()||item.title.length>220||
     typeof item.price!=='number'||!Number.isFinite(item.price)||item.price<=0||item.price>1000000||
     item.sold!==false||!RESELL_CATEGORIES.includes(item.category)||item.category==='All')return null;
  let url;
  try{url=new URL(item.url)}catch{return null}
  if(url.protocol!=='https:'||url.username||url.password||url.port||
     url.hostname!==item.store+'.resell.store' || !/^\/[a-z0-9-]+\/?$/.test(url.pathname) ||
     url.search||url.hash)return null;
  const shipping=typeof item.shipping==='number'&&Number.isFinite(item.shipping)&&item.shipping>=0&&item.shipping<=100000
    ? item.shipping : null;
  const seller=typeof item.seller?.name==='string'?item.seller.name.slice(0,95):item.store;
  return {
    id:item.id, title:item.title.trim(),seller,sellerStore:item.store,
    category:item.category,priceUsd:item.price,shippingUsd:shipping,
    pickupOrUnknown:shipping===0||shipping===null,
    url:url.href,priceType:'seller_asking_price',source:'resell.store public marketplace API',
    sellerVerified:false,saleVerified:false,stockVerified:false
  };
}

export function normalizePublicSearch(payload,{limit=12,offset=0}={}) {
  if(!payload||payload.object!=='search_result'||!Array.isArray(payload.data)||
    payload.data.length>limit||!Number.isInteger(payload.total)||payload.total<0||
    typeof payload.has_more!=='boolean')throw Error('Marketplace returned unexpected data');
  const seen=new Set(), listings=[];
  for(const item of payload.data){
    const candidate=validatePublicListing(item);
    if(candidate&&!seen.has(candidate.id)){
      seen.add(candidate.id);
      listings.push(candidate);
    }
  }
  return {listings,total:payload.total,hasMore:payload.has_more,nextOffset:offset+payload.data.length,
    discarded:payload.data.length-listings.length};
}
