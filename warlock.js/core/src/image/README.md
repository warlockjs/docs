# Image

Image processing utilities. Provides an `Image` class for resizing, converting, and manipulating images.

## Key Files

| File       | Purpose                                                               |
| ---------- | --------------------------------------------------------------------- |
| `image.ts` | `Image` class — resize, crop, convert, compress, watermark operations |
| `index.ts` | Barrel export                                                         |

## Key Exports

- `Image` — image processing class

## Dependencies

### Internal (within `core/src`)

- None directly

### External

- `sharp` — underlying image processing library

## Used By

- `http/uploaded-file.ts` — may process uploaded images
- `storage/` — image files stored via storage drivers
- Application-level code for image manipulation
