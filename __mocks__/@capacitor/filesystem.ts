import { FileInfo } from "@capacitor/filesystem";

const mockFiles: { [key: string]: string } = {}; // In-memory representation of the filesystem

export const Filesystem = {
  __reset: () => {
    for (const key in mockFiles) {
      delete mockFiles[key];
    }
  },
  appendFile: jest.fn(async ({ path, data, directory, encoding }) => {
    const fullPath = `${directory}/${path}`;
    if (!mockFiles[fullPath]) {
      mockFiles[fullPath] = '';
    }
    mockFiles[fullPath] += data;
    return {};
  }),
  readFile: jest.fn(async ({ path, directory }) => {
    const fullPath = `${directory}/${path}`;
    if (mockFiles[fullPath]) {
      return { data: mockFiles[fullPath] };
    }
    throw new Error('File not found');
  }),
  stat: jest.fn(async ({ path, directory }) => {
    const fullPath = `${directory}/${path}`;
    if (mockFiles[fullPath]) {
      return { size: mockFiles[fullPath].length, type: 'file', uri: `mock://${fullPath}` };
    }
    throw new Error('File not found');
  }),
  writeFile: jest.fn(async ({ path, data, directory, encoding }) => {
    const fullPath = `${directory}/${path}`;
    mockFiles[fullPath] = data;
    return {};
  }),
  getUri: jest.fn(async ({ path, directory }) => {
    const fullPath = `${directory}/${path}`;
    return { uri: `mock://${fullPath}` };
  }),
  deleteFile: jest.fn(async ({ path, directory }) => {
    const fullPath = `${directory}/${path}`;
    delete mockFiles[fullPath];
  }),
  readdir: jest.fn(async ({ path, directory }) => {
    const files: FileInfo[] = Object.keys(mockFiles)
      .filter(fullPath => fullPath.startsWith(`${directory}/`))
      .map(fullPath => {
        const name = fullPath.substring(directory.length + 1);
        return {
          name,
          path: fullPath,
          size: mockFiles[fullPath].length,
          ctime: 0,
          mtime: 0,
          uri: `mock://${fullPath}`,
          type: 'file',
        };
      });
    return { files };
  }),
};

export const Directory = {
  Data: 'mock-data-directory',
  Cache: 'mock-cache-directory',
  Documents: 'mock-documents-directory',
  External: 'mock-external-directory',
  ExternalStorage: 'mock-external-storage-directory',
  Library: 'mock-library-directory',
  Resources: 'mock-resources-directory',
  NoBackup: 'mock-nobackup-directory',
};

export const Encoding = {
  UTF8: 'utf8',
  ASCII: 'ascii',
  UTF16: 'utf16',
};