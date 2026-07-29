// @ts-check
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://el-gran-rey-fer.github.io",
	base: "/trama",
	integrations: [mdx()],
});
