# usage: python3 grid.py <png> <name> [cols rows] : evenly gridded transparent sheet -> hd_<name>.json
import sys, numpy as np, json, io, base64
from PIL import Image
from scipy import ndimage as nd
path,name=sys.argv[1],sys.argv[2];cols=int(sys.argv[3]) if len(sys.argv)>3 else 5;rows=int(sys.argv[4]) if len(sys.argv)>4 else 5
A=np.array(Image.open(path).convert('RGBA'))
if (A[...,3]<10).mean()<0.2:
    white=(A[...,:3].min(2)>=238);lab,k=nd.label(white)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0};A[np.isin(lab,list(edge)),3]=0
H,W=A.shape[:2];ch,cw=H//rows,W//cols
cells=[A[r*ch:(r+1)*ch,c*cw:(c+1)*cw] for r in range(rows) for c in range(cols)]
cells=[c for c in cells if (c[...,3]>40).sum()>200]
U=np.zeros((ch,cw),bool)
for c in cells:U|=c[...,3]>40
ys,xs=np.where(U);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
feet=np.zeros(cw,bool)
for c in cells:feet|=(c[int(y0+(y1-y0)*0.9):y1,:,3]>40).any(0)
fx=np.where(feet)[0];ax=(fx.min()+fx.max())/2-x0
S=2;K=round(1.92/((y1-y0)*S),6);out=[]
for c in cells:
    img=Image.fromarray(c[y0:y1,x0:x1],'RGBA').resize(((x1-x0)*S,(y1-y0)*S),Image.NEAREST)
    b=io.BytesIO();img.save(b,'WEBP',lossless=True)
    out.append({'w':img.width,'h':img.height,'ax':round(ax*S,1),'ay':img.height,'k':K,'flip':0,'src':'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()})
json.dump(out,open(f'hd_{name}.json','w'));print(name,len(out),'frames',sum(len(o['src']) for o in out)//1024,'KB',out[0]['w'],out[0]['h'])
