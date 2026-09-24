// Appearance is separate from the collision footprint and seat rules.
export const VEHICLE_MODELS = {
  sedan: { label: '승용차', length: 42, width: 24, body: 9, roof: 17 },
  taxi: { label: '택시', length: 42, width: 24, body: 10, roof: 18 },
  suv: { label: 'SUV', length: 68, width: 27, body: 13, roof: 23 },
  van: { label: '봉고차', length: 72, width: 27, body: 19, roof: 23 },
  bus: { label: '버스', length: 103, width: 28, body: 22, roof: 26 }
};

export function assignModels(cars) {
  const counts = { taxi: 0, van: 0, bus: 0 };
  for (const car of cars) {
    const index = counts[car.type]++;
    car.model = car.type === 'taxi' ? ['sedan', 'taxi'][index % 2]
      : car.type === 'van' ? ['van', 'suv', 'van'][index % 3] : 'bus';
  }
}

export function makePassenger(id) {
  return {
    id,
    gender: id % 2 ? 'woman' : 'man',
    hairstyle: id % 2 ? (Math.floor(id / 2) % 2 ? 'ponytail' : 'bob') : (Math.floor(id / 2) % 2 ? 'sidepart' : 'short'),
    outfit: id % 4 === 1 ? 'skirt' : 'trousers',
    skin: ['#f4c39e', '#d99a70', '#a86747'][Math.floor(id / 3) % 3],
    hair: ['#40312e', '#71452c', '#292c39', '#a87536'][Math.floor(id / 5) % 4]
  };
}

export const vehicleModel = car => {
  const model=VEHICLE_MODELS[car.model || car.type],scale=car.scale||1;
  return scale===1?model:{...model,length:model.length*scale,width:model.width*scale,body:model.body*scale,roof:model.roof*scale};
};
