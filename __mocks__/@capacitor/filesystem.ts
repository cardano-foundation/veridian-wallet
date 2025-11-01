const mockFiles: { [key: string]: string } = {}; // In-memory representation of the filesystem

export const Filesystem = {
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
    // If file doesn't exist, stat should throw an error, or return 0 size depending on desired mock behavior.
    // For now, let's return 0 size if not found, as the log rotation logic handles file not found by assuming 0 size.
    return { size: 0, type: 'file', uri: `mock://${fullPath}` };
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