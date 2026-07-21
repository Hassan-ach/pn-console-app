export const existsSync = () => false;
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const mkdirSync = () => {};
export const readdirSync = () => [];
export const statSync = () => ({ isFile: () => false, isDirectory: () => false, size: 0 });
export const unlinkSync = () => {};
export const renameSync = () => {};
export const appendFileSync = () => {};
export const copyFileSync = () => {};
export const createReadStream = () => ({ on: () => {}, pipe: () => {} });
export const createWriteStream = () => ({ on: () => {}, write: () => {}, end: () => {} });
export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
  stat: async () => ({ isFile: () => false, isDirectory: () => false, size: 0 }),
  unlink: async () => {},
  rename: async () => {},
  appendFile: async () => {},
  copyFile: async () => {},
};
export default { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, renameSync, appendFileSync, copyFileSync, createReadStream, createWriteStream, promises };
