#!/usr/bin/env python3
"""Optional official eBay Browse API snapshot fetcher.
Requires approved API credentials; no scraping or sold-price claims.
Python standard library only.
"""
import base64
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/live-listings.json'
SEARCH_TERMS = [
    'Seiko SKX007', 'Sony A7 III body', 'Nikon F3 body',
    'Omega Speedmaster 3510.50', 'LEGO 10221', 'Game Boy Advance SP AGS-101'
]
MARKETS = ['EBAY_US', 'EBAY_GB', 'EBAY_DE', 'EBAY_AU']

def request_json(url, headers=None, data=None):
    req = urllib.request.Request(url, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=28) as response:
        return json.load(response)

def get_token(client_id, client_secret):
    basic = base64.b64encode((client_id + ':' + client_secret).encode('utf-8')).decode('ascii')
    body = urllib.parse.urlencode({
        'grant_type': 'client_credentials',
        'scope': 'https://api.ebay.com/oauth/api_scope'
    }).encode('ascii')
    req = urllib.request.Request('https://api.ebay.com/identity/v1/oauth2/token',
        data=body, headers={
            'Authorization': 'Basic ' + basic,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }, method='POST')
    with urllib.request.urlopen(req, timeout=28) as response:
        return json.load(response)['access_token']

def search(token, market, term):
    query = urllib.parse.urlencode({'q': term, 'limit': 8, 'filter': 'buyingOptions:{FIXED_PRICE}'})
    data = request_json('https://api.ebay.com/buy/browse/v1/item_summary/search?' + query,
        {'Authorization': 'Bearer ' + token, 'X-EBAY-C-MARKETPLACE-ID': market,
         'Accept': 'application/json'})
    return data.get('itemSummaries', [])

def normalize(item, marketplace, fetched):
    price=item.get('price') or {}
    url=item.get('itemWebUrl', '')
    if not url.startswith('https://') or price.get('value') is None:
        return None
    return {
        'id':str(item.get('itemId','')),
        'title':str(item.get('title',''))[:180],
        'url':url,
        'marketplace':marketplace,
        'price':str(price['value']),
        'currency':str(price.get('currency','')),
        'condition':str(item.get('condition','Unknown'))[:100],
        'fetchedAt':fetched,
        'source':'eBay Browse API',
        'status':'Listing snapshot, not price-verified or authenticity-checked'
    }

def main():
    client=os.environ.get('EBAY_CLIENT_ID')
    secret=os.environ.get('EBAY_CLIENT_SECRET')
    if not client or not secret:
        print('No eBay API credentials; leaving current listing data unchanged.')
        return 0
    try:
        token=get_token(client,secret)
        fetched=dt.datetime.now(dt.timezone.utc).isoformat()
        records=[]
        for market in MARKETS:
            for term in SEARCH_TERMS:
                for item in search(token, market, term):
                    record=normalize(item,market,fetched)
                    if record:records.append(record)
        deduped=list({x['id'] or x['url']:x for x in records}.values())
        OUT.write_text(json.dumps({
            'lastUpdated':fetched,'source':'eBay Browse API','items':deduped
        },ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
        print('Updated '+str(len(deduped))+' authorized listing snapshots.')
    except Exception as exc:
        print('Approved eBay API fetch failed: '+type(exc).__name__,file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
