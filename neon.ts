import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    buckets: {
      "swachdrishti-media": { access: "public_read" },
    },
  },
});
