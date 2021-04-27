import Promise from 'bluebird';

export default () => {
  return {
    process: (file) => {
      file.stream.resume();
      return Promise.resolve(null);
    }
  };
};

