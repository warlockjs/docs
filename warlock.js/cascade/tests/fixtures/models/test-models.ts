import { Model } from "../../src/model/model";

/**
 * Fixture: Simple User model for testing
 */
class User extends Model {
  static table = "test_users";
  static fillable = ["name", "email", "age"];
}

/**
 * Fixture: Post model with timestamps
 */
class Post extends Model {
  static table = "test_posts";
  static timestamps = true;
  static fillable = ["title", "content"];
}

/**
 * Fixture: Comment model with soft deletes
 */
class Comment extends Model {
  static table = "test_comments";
  static softDeletes = true;
  static fillable = ["text"];
}

export { Comment, Post, User };
