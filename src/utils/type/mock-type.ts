import { Repository } from 'typeorm';

export type MockRepository<T = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

export function createMockRepository<T>(): MockRepository<T> {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (!target[prop]) {
          target[prop] = jest.fn();
        }
        console.log('done');
        return target[prop];
      },
    },
  ) as MockRepository<T>;
}
