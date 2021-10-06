import AbstractProcessor from './abstract';

export default class StorageProcessor extends AbstractProcessor {

  constructor(storage) {
    super();
    this.storage = storage;
  }

  process(file, args) {
    const filepath = (`${file.path}/${file.filename}`).replace(/\/\/+/g, '/');
    return this.storage.save(file.stream, filepath, args.force)
      .then(() => file);
  }

}
