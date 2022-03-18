import { Payload } from '../types';
declare const slack: (payload: Payload, webhook: string) => Promise<void>;
export { slack };
