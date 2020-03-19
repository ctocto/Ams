import createLogger from 'dva-logger';

export const dva = {
  config: {
    onError(e) {
      e.preventDefault();
      console.error(e.message);
    },
  },
  plugins: [
    createLogger(),
  ],
};
