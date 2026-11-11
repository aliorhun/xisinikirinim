/* Seven crystal systems: geometry-first, accessible SVG reference chart.
 * Angles follow the crystallographic convention:
 * alpha = angle(b,c), beta = angle(a,c), gamma = angle(a,b).
 * Diagrams use representative (not measured) unit cells; projection is schematic.
 */
(function () {
  'use strict';

  const SYSTEMS = [
    { id:'triclinic', tr:'Triklinik', en:'Triclinic',
      trLengths:'a, b, c bağımsız', enLengths:'a, b, c independent',
      trAngles:'α, β, γ serbest', enAngles:'α, β, γ unrestricted',
      cell:[1.18,1.04,1.30,73,105,78], arcs:[['b','c','α',17],['a','c','β',25],['a','b','γ',33]] },
    { id:'monoclinic', tr:'Monoklinik', en:'Monoclinic',
      trLengths:'a, b, c bağımsız', enLengths:'a, b, c independent',
      trAngles:'α = γ = 90°; β ≠ 90°', enAngles:'α = γ = 90°; β ≠ 90°',
      cell:[1.13,1.00,1.47,90,108,90], arcs:[['a','c','β',26]] },
    { id:'orthorhombic', tr:'Ortorombik', en:'Orthorhombic',
      trLengths:'a ≠ b ≠ c', enLengths:'a ≠ b ≠ c',
      trAngles:'α = β = γ = 90°', enAngles:'α = β = γ = 90°',
      cell:[1.23,.96,1.39,90,90,90] },
    { id:'tetragonal', tr:'Tetragonal', en:'Tetragonal',
      trLengths:'a = b ≠ c', enLengths:'a = b ≠ c',
      trAngles:'α = β = γ = 90°', enAngles:'α = β = γ = 90°',
      cell:[1.02,1.02,1.56,90,90,90] },
    { id:'trigonal', tr:'Trigonal', en:'Trigonal',
      trLengths:'a = b = c (R eksenleri)', enLengths:'a = b = c (R axes)',
      trAngles:'α = β = γ ≠ 90°', enAngles:'α = β = γ ≠ 90°',
      cell:[1.16,1.16,1.16,75,75,75] },
    { id:'hexagonal', tr:'Hekzagonal', en:'Hexagonal',
      trLengths:'a = b ≠ c', enLengths:'a = b ≠ c',
      trAngles:'α = β = 90°; γ = 120°', enAngles:'α = β = 90°; γ = 120°',
      cell:[1.12,1.12,1.42,90,90,120] },
    { id:'cubic', tr:'Kübik', en:'Cubic',
      trLengths:'a = b = c', enLengths:'a = b = c',
      trAngles:'α = β = γ = 90°', enAngles:'α = β = γ = 90°',
      cell:[1.13,1.13,1.13,90,90,90] }
  ];

  const rad = value => value * Math.PI / 180;
  const dot = (x,y) => x.reduce((sum, n, i) => sum + n*y[i], 0);
  const length = vector => Math.sqrt(dot(vector,vector));
  const round = value => Math.round(value * 10) / 10;

  function cellVectors(parameters) {
    const [a,b,c,alpha,beta,gamma] = parameters;
    const ca = Math.cos(rad(alpha));
    const cb = Math.cos(rad(beta));
    const cg = Math.cos(rad(gamma));
    const sg = Math.sin(rad(gamma));
    if (!(a > 0 && b > 0 && c > 0) || Math.abs(sg) < 1e-9) {
      throw new RangeError('Invalid unit-cell parameters');
    }
    const cx = c * cb;
    const cy = c * (ca - cb*cg) / sg;
    const cz2 = c*c - cx*cx - cy*cy;
    if (cz2 <= 0) throw new RangeError('Unit-cell angles do not form a 3D cell');
    return {a:[a,0,0], b:[b*cg,b*sg,0], c:[cx,cy,Math.sqrt(cz2)]};
  }

  function project(vector) {
    return {x: -.81*vector[0]+.92*vector[1],
            y: .34*vector[0]+.25*vector[1]-1.03*vector[2]};
  }

  function cellSvg(system, english) {
    const vectors=cellVectors(system.cell);
    const points=[];
    for(let n=0;n<8;n++){
      const v=[0,0,0];
      for(const [i,axis] of ['a','b','c'].entries()) {
        if(n & (1<<i)) for(let j=0;j<3;j++) v[j]+=vectors[axis][j];
      }
      points.push(project(v));
    }
    const xmin=Math.min(...points.map(p=>p.x));
    const xmax=Math.max(...points.map(p=>p.x));
    const ymin=Math.min(...points.map(p=>p.y));
    const ymax=Math.max(...points.map(p=>p.y));
    const scale=Math.min(190/(xmax-xmin),141/(ymax-ymin));
    const xoffset=125-scale*(xmin+xmax)/2;
    const yoffset=95-scale*(ymin+ymax)/2;
    const p=points.map(q=>({x:round(q.x*scale+xoffset),y:round(q.y*scale+yoffset)}));
    const lines=[];
    for(let i=0;i<8;i++) for(let bit=0;bit<3;bit++){
      const j=i^(1<<bit);
      if(i<j) {
        const axisEdge=i===0;
        lines.push('<line class="'+(axisEdge?'cell-axis':'cell-edge')+
          '" x1="'+p[i].x+'" y1="'+p[i].y+'" x2="'+p[j].x+'" y2="'+p[j].y+'"/>');
      }
    }
    const marks=['a','b','c'].map((axis,index)=>{
      const start=p[0],end=p[1<<index];
      const dx=end.x-start.x,dy=end.y-start.y;
      const n=Math.hypot(dx,dy)||1;
      const side=index===0?-1:1;
      const nx=-dy/n*side,ny=dx/n*side;
      const x=round(start.x+dx*.64+nx*11);
      const y=round(start.y+dy*.64+ny*11);
      return '<text class="cell-axis-label" x="'+x+'" y="'+y+'">'+axis+'</text>';
    }).join('');

    function angleArc(first,second,symbol,radius){
      const firstIndex={a:1,b:2,c:4}[first];
      const secondIndex={a:1,b:2,c:4}[second];
      const origin=p[0],one=p[firstIndex],two=p[secondIndex];
      const norm=q=>{const dx=q.x-origin.x,dy=q.y-origin.y,mag=Math.hypot(dx,dy)||1;return {x:dx/mag,y:dy/mag};};
      const u=norm(one),v=norm(two);
      const sum={x:u.x+v.x,y:u.y+v.y};
      const mag=Math.hypot(sum.x,sum.y)||1;
      const bis={x:sum.x/mag,y:sum.y/mag};
      const start={x:round(origin.x+u.x*radius),y:round(origin.y+u.y*radius)};
      const end={x:round(origin.x+v.x*radius),y:round(origin.y+v.y*radius)};
      const control={x:round(origin.x+bis.x*radius*.93),y:round(origin.y+bis.y*radius*.93)};
      const label={x:round(origin.x+bis.x*(radius+10)),y:round(origin.y+bis.y*(radius+10))};
      return '<path class="cell-angle" d="M'+start.x+' '+start.y+' Q'+control.x+' '+control.y+' '+end.x+' '+end.y+'"/>'+
        '<text class="cell-angle-label" x="'+label.x+'" y="'+label.y+'">'+symbol+'</text>';
    }
    const arcs=(system.arcs||[]).map(a=>angleArc(...a)).join('');
    const nodes=p.map(q=>'<circle class="cell-node" cx="'+q.x+'" cy="'+q.y+'" r="3.6"/>').join('');
    const title=english?system.en:system.tr;
    const description=english
      ? 'Representative unit cell; a, b and c are edge vectors.'
      : 'Temsili birim hücre; a, b ve c kenar vektörleridir.';
    return '<svg class="crystal-cell-figure" viewBox="0 0 250 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+title+': '+description+'">'+
      '<g class="cell-lines">'+lines.join('')+'</g>'+arcs+nodes+marks+'</svg>';
  }

  function render() {
    const host=document.getElementById('crystalSystemAtlas');
    if(!host) return;
    const en=document.documentElement.lang.toLowerCase().startsWith('en');
    const heading=en?'Seven crystal systems: unit-cell geometry':'Yedi kristal sisteminin birim hücre geometrisi';
    const intro=en
      ? 'Edges a, b, c and angles α = ∠(b,c), β = ∠(a,c), γ = ∠(a,b). The drawings are schematic, not to scale.'
      : 'Kenarlar a, b, c ve açılar α = ∠(b,c), β = ∠(a,c), γ = ∠(a,b). Çizimler ölçekli değildir; geometrik birer şemadır.';
    const note=en
      ? 'Rhombohedral axes (R) are one way to represent the trigonal system, not an eighth crystal system. Trigonal crystals may also use hexagonal axes.'
      : 'Rombohedral eksenler (R), trigonal sistemin bir gösterimidir; sekizinci bir kristal sistemi değildir. Trigonal kristaller hekzagonal eksenlerle de gösterilebilir.';
    host.replaceChildren();
    const header=document.createElement('div');
    header.className='crystal-atlas-intro';
    const h=document.createElement('h3');h.textContent=heading;
    const p=document.createElement('p');p.textContent=intro;
    header.append(h,p);
    const grid=document.createElement('div');grid.className='crystal-atlas-grid';
    for(const system of SYSTEMS){
      const card=document.createElement('figure');
      card.className='crystal-atlas-card';
      card.dataset.system=system.id;
      const label=document.createElement('figcaption');
      const name=document.createElement('strong');
      name.textContent=en?system.en:system.tr;
      const lengths=document.createElement('span');
      lengths.textContent=en?system.enLengths:system.trLengths;
      const angles=document.createElement('span');
      angles.textContent=en?system.enAngles:system.trAngles;
      label.append(name,lengths,angles);
      card.innerHTML=cellSvg(system,en);
      card.append(label);
      grid.append(card);
    }
    const footer=document.createElement('p');
    footer.className='crystal-atlas-note';
    footer.textContent=note;
    host.append(header,grid,footer);
  }

  if(typeof module==='object' && module.exports) {
    module.exports={SYSTEMS,cellVectors,cellSvg};
  }
  if(typeof document==='undefined') return;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render,{once:true});
  else render();
  new MutationObserver(changes=>{
    if(changes.some(change=>change.attributeName==='lang')) render();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();