import { Storage, Drivers } from '@ionic/storage';
import { maxId } from '../utils/utils';

let storage:Storage = new Storage();

export const createStore = (name = "walletStorage") => {

  storage = new Storage({

    name,
    driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
  });

  storage.create();
}

export const set = async (key:string, val:any) => {

  await storage.set(key, val);
}

export const get = async (key:string) => {

  return await storage.get(key);
}

export const remove = async (key:string) => {

  await storage.remove(key);
}

export const clear = async () => {

  await storage.clear();
}

export const setObject = async (tableName:string, id:string, val:any) => {

  try {
    const all = await get(tableName) || [];
    all[id] = val;
    await set(tableName, all);
    return true;
  } catch (e) {
    return false;
  }

}

export const setNewObject = async (tableName:string, val:any) => {

  try {
    let value = { ...val };

    let all = await storage.get(tableName);
    let objIndex;
    let aux = 0;

    if (all){
      objIndex = maxId(all);
      if (objIndex >= 0) aux += 1;
      else objIndex = 0;

      value["id"] = objIndex+aux;
      all[objIndex+aux] = value
    } else {
      value["id"] = 0;
      objIndex = 0;
      all = Array(1).fill(value);
    }

    await set(tableName, all);
    return objIndex+aux;
  } catch (e) {
    console.log("error");
    console.log(e);
    return -1;
  }

}

export const removeObject = async (tableName:string, id:string) => {

  let all = await get(tableName) || [];
  all = all.filter((a: { id: string; }) => (a.id) !== (id))

  await set(tableName, all);
}

export const getObject = async (tableName:string, id:string) => {

  try {
    const all = await get(tableName) || [];

    if (all && all.length){
      return all.find((o: { id: string; }) => o.id === id);
    }
  } catch (e) {
    console.log(e);
  }

}
