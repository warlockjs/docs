import type { GenericObject } from "@mongez/reinforcements";
import { Model } from "@warlock.js/cascade";
import { RepositoryDestroyManager } from "./repository-destroyer-manager";
import { RepositoryFiller } from "./repository-filler";
import type { Fillable, SaveMode } from "./types";

export abstract class RepositoryFillerManager<
  T extends Model,
  M extends typeof Model = typeof Model,
> extends RepositoryDestroyManager<T, M> {
  /**
   * Data to be filled in the model during creation|update|patch
   */
  protected fillable?: Fillable;

  /**
   * Filled inputs
   * Will be used with create or update to only get the inputs that are fillable
   */
  protected filled?: string[];

  /**
   * Create new record
   */
  public create(data: any, model?: T): Promise<T> {
    const filler = this.makeFiller();

    return filler.create(data, model) as Promise<T>;
  }

  /**
   * Update record
   */
  public async update(id: number | string | T, data: any) {
    const model = id instanceof Model ? id : await this.find(id);

    if (!model) return;

    const filler = this.makeFiller();

    return filler.update(model, data) as Promise<T>;
  }

  /**
   * Update many documents
   */
  public async updateMany(where: GenericObject, data: any) {
    const models = await this.all(where);

    const promises: any[] = [];

    models.forEach(model => {
      promises.push(this.update(model, data));
    });

    await Promise.all(promises);

    return models;
  }

  /**
   * Find or create
   */
  public async findOrCreate(
    where: GenericObject,
    data: GenericObject,
  ): Promise<T> {
    const model = await this.first(where);

    return model || (await this.create(data));
  }

  /**
   * Update or create
   */
  public async updateOrCreate(where: GenericObject, data: GenericObject) {
    const model = await this.first(where);

    if (model) {
      return await this.update(model, data);
    }

    return await this.create(data);
  }

  /**
   * Set data
   */
  public async setData(_model: T, _data: any, _saveMode: SaveMode) {
    //
  }

  /**
   * Make new instance of the filler
   */
  public makeFiller(): RepositoryFiller {
    return new RepositoryFiller(this, this.getFillable(), this.filled);
  }

  /**
   * Get fillable data
   */
  public getFillable() {
    return this.fillable;
  }

  /**
   * On creating event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onCreating(_model: T, _data: any) {
    //
  }

  /**
   * On create event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onCreate(_model: T, _data: any) {
    //
  }

  /**
   * On updating event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onUpdating(_model: T, _data: any, _oldModel?: T) {
    //
  }

  /**
   * On update event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onUpdate(_model: T, _data: any, _oldModel?: T) {
    //
  }

  /**
   * On saving event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onSaving(_model: T, _data: any, _oldModel?: T) {
    //
  }

  /**
   * On save event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onSave(_model: T, _data: any, _oldModel?: T) {
    //
  }
}
