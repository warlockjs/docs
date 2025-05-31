import type { GenericObject } from "@mongez/reinforcements";
import type { CacheDriver, LRUMemoryCacheOptions } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

class CacheNode {
  public next: CacheNode | null = null;
  public prev: CacheNode | null = null;
  public constructor(
    public key: string,
    public value: any,
  ) {
    //
  }
}

/**
 * LRU Memory Cache Driver
 * The concept of LRU is to remove the least recently used data
 * whenever the cache is full
 * The question that resides here is how to tell the cache is full?
 */
export class LRUMemoryCacheDriver
  extends BaseCacheDriver<LRUMemoryCacheDriver, LRUMemoryCacheOptions>
  implements CacheDriver<LRUMemoryCacheDriver, LRUMemoryCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "lru";

  /**
   * Cache map
   */
  protected cache: Map<string, CacheNode> = new Map();

  /**
   * Head of the cache
   */
  protected head: CacheNode = new CacheNode("", null);

  /**
   * Tail of the cache
   */
  protected tail: CacheNode = new CacheNode("", null);

  /**
   * {@inheritdoc}
   */
  public constructor() {
    super();

    this.init();
  }

  /**
   * Initialize the cache
   */
  public init() {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(_namespace: string) {
    throw new Error("Namespace is not supported in LRU cache driver.");
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: string | GenericObject, value: any, _ttl?: number) {
    key = await this.parseKey(key);

    this.log("caching", key);

    const existingNode = this.cache.get(key);
    if (existingNode) {
      existingNode.value = value;

      this.moveHead(existingNode);
    } else {
      const newNode = new CacheNode(key, value);

      this.cache.set(key, newNode);

      this.addNode(newNode);
      if (this.cache.size > this.capacity) {
        this.removeTail();
      }
    }

    this.log("cached", key);

    return this;
  }

  /**
   * Move the node to the head
   */
  protected moveHead(node: CacheNode) {
    this.removeNode(node);
    this.addNode(node);
  }

  /**
   * Remove the node from the cache
   */
  protected removeNode(node: CacheNode) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  /**
   * Add the node to the head
   */
  protected addNode(node: CacheNode) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  /**
   * Remove the tail node
   */
  protected removeTail() {
    const node = this.tail.prev!;

    this.removeNode(node);

    this.cache.delete(node.key);
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: string | GenericObject) {
    const parsedKey = await this.parseKey(key);

    this.log("fetching", parsedKey);

    const node = this.cache.get(parsedKey);

    if (!node) {
      this.log("notFound", parsedKey);
      return null;
    }

    this.moveHead(node);

    this.log("fetched", parsedKey);

    return node.value;
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: string | GenericObject) {
    const parsedKey = await this.parseKey(key);

    this.log("removing", parsedKey);

    const node = this.cache.get(parsedKey);

    if (node) {
      this.removeNode(node);
      this.cache.delete(parsedKey);
    }

    this.log("removed", parsedKey);
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");

    this.cache.clear();

    this.init();

    this.log("flushed");
  }

  /**
   * Get lru capacity
   */
  public get capacity() {
    return this.options.capacity || 1000;
  }
}
