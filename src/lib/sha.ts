import { CacheRecord } from './cache';

const isObject = (val: unknown) => {
  return val != null && typeof val === 'object' && !Array.isArray(val);
};

const objectToArraySortedByKey = (obj: unknown): unknown => {
  if (!isObject(obj) && !Array.isArray(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (Array.isArray(item) || isObject(item)) {
        return objectToArraySortedByKey(item);
      }
      return item;
    });
  }

  return Object.keys(<CacheRecord>obj)
    .sort()
    .map((key: string) => {
      return [key, objectToArraySortedByKey((<CacheRecord>obj)[key])];
    });
};

const hashable = (obj: CacheRecord): string => {
  return JSON.stringify(objectToArraySortedByKey(obj));
};

const digest = (obj: CacheRecord, algorithm = 'SHA-256') => {
  const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  if (!algorithms.includes(algorithm)) {
    throw RangeError(`Valid hash algorithm values are any of ${JSON.stringify(algorithms)}`);
  }
  return (async (obj, algorithm) => {
    const encoder = new TextEncoder();
    const hashInput = encoder.encode(hashable(obj)).buffer;
    let digest = '';
    {
      const nodeAlg = algorithm.toLowerCase().replace('-', '');
      digest = require('crypto').createHash(nodeAlg).update(Buffer.from(hashInput)).digest('hex'); // eslint-disable-line
    }
    /* eslint-enable no-lone-blocks */
    return digest;
  })(obj, algorithm);
};

export default digest;
