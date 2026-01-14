
export const environment = {
  production: true,
  API_KEY: (() => {
    try {
      // @ts-ignore
      return (typeof process !== 'undefined' && process.env && process.env['API_KEY']) || '';
    } catch {
      return '';
    }
  })()
};
