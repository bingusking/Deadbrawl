# usage: python3 strip.py <png> <name> [anchor=torso|feet]
import sys, os, json, io, base64, numpy as np
from PIL import Image
from scipy import ndimage as nd
path,name=sys.argv[1],sys.argv[2]; anchor=sys.argv[3] if len(sys.argv)>3 else 'torso'; NF=int(sys.argv[4]) if len(sys.argv)>4 else 0
SC=480/571.5; K=round(1.92/480,6)          # same scale as the HD idle strip
import os
REF=float(os.environ.get('REFH','0'))       # standing height (px) of the character in this source image
if REF: SC=480/REF
A=np.array(Image.open(path).convert('RGB')).astype(float)
r,g,b=A[...,0],A[...,1],A[...,2]; gness=g-np.maximum(r,b)
KLO=float(os.environ.get('KLO','25'));KR=float(os.environ.get('KR','95'))
alpha=1-np.clip((gness-KLO)/KR,0,1)
g2=np.where(gness>0,np.maximum(r,b)+np.clip(gness,0,None)*0.15,g)
if os.environ.get('DESPILL'): g2=np.minimum(g2,np.maximum(r,b))
rgb=np.dstack([r,g2,b]).clip(0,255)
solid=alpha>0.5; lab,k=nd.label(solid); sizes=nd.sum(solid,lab,range(1,k+1))
alpha=alpha*nd.binary_dilation(np.isin(lab,np.where(sizes>150)[0]+1),iterations=3)
cols=(alpha>0.3).sum(0)>0
cl,ck=nd.label(nd.binary_closing(cols,iterations=1))
segs=[sl[0] for sl in nd.find_objects(cl) if sl[0].stop-sl[0].start>=80]
csum=(alpha>0.3).sum(0)
while NF and len(segs)<NF:
    i=max(range(len(segs)),key=lambda j:segs[j].stop-segs[j].start); s0=segs[i]; W=s0.stop-s0.start
    lo=s0.start+int(W*0.3); hi=s0.start+int(W*0.7); cut=lo+int(np.argmin(csum[lo:hi]))
    segs[i:i+1]=[slice(s0.start,cut),slice(cut,s0.stop)]
out=[];prev=[]
for xs in segs:
    a=alpha[:,xs]; ys=np.where((a>0.3).sum(1)>0)[0]; y0,y1=ys[0],ys[-1]+1
    sa=a[y0:y1]; sub=rgb[y0:y1,xs]; op=sa>0.5; H=y1-y0
    foot=float(np.where(op.sum(1)>0)[0][-1]+1)
    body=op&~((sub[...,2]>sub[...,1]+50)&(sub[...,2]>sub[...,0]*0.75))
    if anchor=='feet': fy,fx=np.where(body[int(H*0.88):])
    else: fy,fx=np.where(body[int(H*0.25):int(H*0.55)])
    ax=float(np.median(fx))
    img=Image.fromarray(np.dstack([sub,sa*255]).astype(np.uint8),'RGBA')
    img=img.resize((max(1,int(img.width*SC)),max(1,int(img.height*SC))),Image.NEAREST if os.environ.get('PIXEL') else Image.LANCZOS)
    bio=io.BytesIO();img.save(bio,'WEBP',lossless=True) if os.environ.get('PIXEL') else img.save(bio,'WEBP',quality=92,method=6)
    out.append({'w':img.width,'h':img.height,'ax':round(ax*SC,1),'ay':round(foot*SC,1),'k':K,'flip':0,
                'src':'data:image/webp;base64,'+base64.b64encode(bio.getvalue()).decode()})
    prev.append(img)
json.dump(out,open(f'hd_{name}.json','w'))
W=sum(i.width for i in prev)+10*len(prev);c=Image.new('RGBA',(W,max(i.height for i in prev)+10),(40,40,60,255));x=0
for i in prev: c.alpha_composite(i,(x,c.height-i.height));x+=i.width+10
c.resize((W//2,c.height//2)).save(f'hd_{name}_check.png')
print(name,len(out),'frames',[ (o['w'],o['h']) for o in out], sum(len(o['src']) for o in out)//1024,'KB')
