// Cosmetic fleet progression. Existing model footprints and 4/6/10 seats stay authoritative.
export const FLEET_STYLES={
 compact:{label:'경차',type:'taxi',kind:'sedan',shape:'compact',description:'짧은 보닛과 둥근 지붕의 골목 경차'},
 sedan:{label:'승용차',type:'taxi',kind:'sedan',description:'낮은 차체와 분리된 트렁크'},
 taxi:{label:'택시',type:'taxi',kind:'taxi',description:'지붕 택시등과 체크무늬 띠'},
 wagon:{label:'왜건',type:'taxi',kind:'sedan',shape:'wagon',description:'뒤까지 길게 이어진 유리 지붕'},
 roadster:{label:'오픈카',type:'taxi',kind:'sedan',shape:'open',description:'열린 지붕 안으로 보이는 네 좌석'},
 electric:{label:'전기 승용차',type:'taxi',kind:'sedan',shape:'electric',description:'유리 지붕과 한 줄로 이어진 전조등'},
 electricTaxi:{label:'전기 택시',type:'taxi',kind:'taxi',shape:'electric',description:'택시등과 매끈한 유리 지붕'},
 executive:{label:'클래식 세단',type:'taxi',kind:'sedan',shape:'classic',description:'크롬 그릴과 밝은 지붕의 심야 세단'},
 suv:{label:'SUV',type:'van',kind:'suv',description:'높은 지붕과 은색 루프 레일'},
 van:{label:'봉고차',type:'van',kind:'van',description:'네모난 차체와 슬라이딩 도어'},
 minibus:{label:'미니버스',type:'van',kind:'van',shape:'mini',description:'큰 창문과 앞쪽 승차문'},
 retrovan:{label:'레트로 밴',type:'van',kind:'van',shape:'retro',description:'밝은 지붕과 두 부분으로 나뉜 앞유리'},
 adventure:{label:'오프로드 SUV',type:'van',kind:'suv',shape:'adventure',description:'루프 바스켓과 뒤쪽 스페어타이어'},
 camper:{label:'캠핑 밴',type:'van',kind:'van',shape:'camper',description:'높은 팝업 지붕과 접힌 차양'},
 airport:{label:'공항 셔틀',type:'van',kind:'van',shape:'airport',description:'밀폐형 짐 박스를 얹은 터미널 셔틀'},
 citybus:{label:'시내버스',type:'bus',kind:'bus',description:'나란한 창문과 앞쪽 이중문'},
 coach:{label:'관광버스',type:'bus',kind:'bus',shape:'coach',description:'긴 파노라마 창문과 아래쪽 짐칸'},
 electricbus:{label:'전기버스',type:'bus',kind:'bus',shape:'electric',description:'지붕 배터리 팩과 연결형 전조등'},
 panorama:{label:'전망 버스',type:'bus',kind:'bus',shape:'panorama',description:'유리 천장으로 밤하늘이 보이는 버스'},
 festival:{label:'축제 버스',type:'bus',kind:'bus',shape:'festival',description:'금빛 띠와 별 장식의 마지막 축제 셔틀'}
};

export const REGION_FLEETS=[
 {name:'골목의 작은 발',small:['compact','sedan','taxi'],medium:['van','suv'],large:['citybus']},
 {name:'강변 나들이',small:['wagon','compact','taxi'],medium:['suv','van'],large:['citybus']},
 {name:'항구 단체 여행',small:['wagon','taxi','sedan'],medium:['minibus','van','suv'],large:['coach','citybus']},
 {name:'벚꽃 드라이브',small:['roadster','compact','taxi'],medium:['retrovan','minibus','van'],large:['coach','citybus']},
 {name:'언덕 탐험대',small:['roadster','wagon','taxi'],medium:['adventure','suv','retrovan'],large:['coach','citybus']},
 {name:'전기로 달리는 밤',small:['electric','electricTaxi','sedan'],medium:['minibus','suv','van'],large:['electricbus','coach']},
 {name:'숲속 캠핑 여행',small:['wagon','electric','taxi'],medium:['camper','adventure','retrovan'],large:['electricbus','coach']},
 {name:'밤하늘 전망 노선',small:['roadster','electricTaxi','wagon'],medium:['camper','minibus','suv'],large:['panorama','electricbus','coach']},
 {name:'심야 공항 특급',small:['executive','electricTaxi','sedan'],medium:['airport','minibus','van'],large:['coach','electricbus','panorama']},
 {name:'백야 축제 퍼레이드',small:['roadster','electric','executive','taxi'],medium:['retrovan','camper','airport','adventure'],large:['festival','panorama','electricbus']}
];
REGION_FLEETS.push(...['햇살 나들이','라벤더 산책','언덕 원정대','바닷길 특급','구름 정원 셔틀','유성 관광 노선','황금 항구 수송대','오로라 순환선','달맞이 야간 특급','카니발 대행진'].map((name,i)=>({name,small:[...REGION_FLEETS[(i+4)%10].small],medium:[...REGION_FLEETS[(i+7)%10].medium],large:[...REGION_FLEETS[(i+8)%10].large]})));
const stage=index=>Math.max(0,Math.min(199,Math.trunc(index)||0));
export const fleetFor=index=>REGION_FLEETS[Math.floor(stage(index)/10)];
export const fleetStyles=index=>{const f=fleetFor(index);return [...f.small,...f.medium,...f.large];};
export function vehicleStyle(car,index=0){
 if(car.previewStyle&&FLEET_STYLES[car.previewStyle])return FLEET_STYLES[car.previewStyle];
 const f=fleetFor(index),pool=f[car.type==='bus'?'large':car.type==='van'?'medium':'small'];
 const suffix=String(car.id||'').match(/(\d+)$/),ordinal=suffix?Number(suffix[1]):0;
 return FLEET_STYLES[pool[(ordinal+stage(index)%10)%pool.length]];
}
export const vehicleLabel=(car,index)=>vehicleStyle(car,index).label;
export const styleDebut=id=>REGION_FLEETS.findIndex(f=>[...f.small,...f.medium,...f.large].includes(id))*10+1;
